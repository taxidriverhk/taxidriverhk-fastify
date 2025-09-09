import fastifyPostgres from "@fastify/postgres";
import fastify from "fastify";
import { getConnectionString, usingDatabase } from "./database/init";
import { Database } from "./database/types";
import {
  GetMapsResponse,
  GetStatisticsResponse,
  GetTutorialsResponse,
  Map as MapItem,
  Tutorial,
} from "./schemas";

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
  Reply: string;
}>("/stocks/:symbol", async (request, reply) => {
  const { symbol } = request.params;
  if (!/^[A-Za-z]{1,5}$/.test(symbol)) {
    reply.status(400).send("Invalid symbol");
    return;
  }

  const data = await usingDatabase(
    server,
    Database.DOCDB,
    async (db) => await db.documentAsync("stocks", symbol.toUpperCase())
  );

  if (data != null) {
    reply.status(200).send(data);
  } else {
    // TODO: fetch from Alpha Vantage and store into DB as cache
    reply.status(404);
  }
});

server.listen({ port: 8090, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`CS Maps server started at ${address}`);
});
