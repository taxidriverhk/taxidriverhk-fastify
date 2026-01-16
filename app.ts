import fastifyPostgres from "@fastify/postgres";
import fastify from "fastify";
import { getConnectionString, usingDatabase } from "./database/init";
import { Database } from "./database/types";
import {
  GetMapsResponse,
  GetStatisticsResponse,
  GetStockDataResponse,
  GetTutorialsResponse,
  Map as MapItem,
  StockDocument,
  Tutorial,
  OptionData,
} from "./schemas";
import {
  getStockDataAsync,
  getOptionDataAsync,
} from "./external/external-data-provider";

const server = fastify({
  logger: {
    level: "info",
  },
});

Object.values(Database).forEach((db) => {
  const connectionString = getConnectionString(db);
  if (connectionString) {
    server.register(fastifyPostgres, {
      name: db,
      connectionString,
    });
  }
});

server.get<{
  Reply: GetMapsResponse;
}>("/maps", async (_request, _reply) => {
  return await usingDatabase(server, Database.CSMAPS, async (db) => {
    const [categories, maps] = await Promise.all([
      db.categoriesAsync(),
      db.mapsAsync(),
    ]);
    return {
      categories,
      maps,
    };
  });
});

server.get<{
  Params: {
    name: string;
  };
  Reply: MapItem;
}>("/maps/:name", async (request, reply) => {
  const { name } = request.params;
  const idNumber = parseInt(name, 10);

  const map = await usingDatabase(server, Database.CSMAPS, async (db) =>
    Number.isNaN(idNumber)
      ? await db.mapAsync(name)
      : await db.mapAsyncById(name)
  );

  if (map != null) {
    reply.status(200).send(map);
  } else {
    reply.status(404);
  }
});

server.get<{
  Reply: GetStatisticsResponse;
}>("/statistics", async (_request, _reply) => {
  return await usingDatabase(server, Database.CSMAPS, async (db) => ({
    statistics: await db.statisticsAsync(),
  }));
});

server.get<{
  Reply: GetTutorialsResponse;
}>("/tutorials", async (_request, _reply) => {
  return await usingDatabase(server, Database.CSMAPS, async (db) => ({
    tutorials: await db.tutorialsAsync(),
  }));
});

server.get<{
  Params: {
    id: string;
  };
  Reply: Tutorial;
}>("/tutorials/:id", async (request, reply) => {
  const { id } = request.params;
  const tutorial = await usingDatabase(
    server,
    Database.CSMAPS,
    async (db) => await db.tutorialAsync(id)
  );

  if (tutorial != null) {
    reply.status(200).send(tutorial);
  } else {
    reply.status(404);
  }
});

server.get<{
  Params: {
    symbol: string;
  };
  Querystring: {
    apiKey: string;
  };
  Reply: GetStockDataResponse;
}>("/stocks/:symbol", async (request, reply) => {
  const { symbol } = request.params;
  const { apiKey } = request.query;
  if (!/[A-Za-z]{1,5}/.test(symbol) || apiKey == null || apiKey.length === 0) {
    reply.status(400).send("Invalid symbol or API key");
    return;
  }

  const authApiKey = await usingDatabase(
    server,
    Database.DOCDB,
    async (db) => await db.documentAsync<{}>("authorized_keys", apiKey)
  );
  if (authApiKey == null) {
    reply.status(403).send("Unauthorized API key");
    return;
  }

  const data = await usingDatabase(
    server,
    Database.DOCDB,
    async (db) =>
      await db.documentAsync<StockDocument>("stocks", symbol.toUpperCase())
  );

  if (data != null) {
    reply.status(200).send(data);
  } else {
    const stockData = await getStockDataAsync(symbol, apiKey, server);
    if (stockData == null) {
      reply.status(404);
      return;
    }

    await usingDatabase(
      server,
      Database.DOCDB,
      async (db) =>
        await db.upsertDocumentAsync("stocks", symbol.toUpperCase(), stockData)
    );

    reply.status(200).send(stockData);
  }
});

server.get<{
  Params: {
    optionTicker: string;
  };
  Querystring: {
    apiKey: string;
  };
  Reply: OptionData | string;
}>("/stocks/options/:optionTicker", async (request, reply) => {
  const { optionTicker } = request.params;
  const { apiKey } = request.query;

  if (apiKey == null || apiKey.length === 0) {
    reply.status(400).send("Invalid API key");
    return;
  }

  const authApiKey = await usingDatabase(
    server,
    Database.DOCDB,
    async (db) => await db.documentAsync<{}>("authorized_keys", apiKey)
  );
  if (authApiKey == null) {
    reply.status(403).send("Unauthorized API key");
    return;
  }

  const optionData = await getOptionDataAsync(optionTicker, server);

  if (optionData == null) {
    reply.status(404).send("Option not found");
    return;
  }

  reply.status(200).send(optionData);
});

server.listen({ port: 8090, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`CS Maps server started at ${address}`);
});
