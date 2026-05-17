import { FastifyInstance } from "fastify";
import { usingDatabase } from "../database/csmaps/init";
import { Database } from "../database/types";
import {
  GetStockDataResponse,
  StockDocument,
  OptionData,
} from "../schemas/stocks/schemas";
import {
  getStockDataAsync,
  getOptionDataAsync,
} from "../external/external-data-provider";

export default async function stockRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Params: {
      symbol: string;
    };
    Querystring: {
      apiKey: string;
    };
    Reply: GetStockDataResponse;
  }>("/:symbol", async (request, reply) => {
    const { symbol } = request.params;
    const { apiKey } = request.query;
    if (!/[A-Za-z]{1,5}/.test(symbol) || apiKey == null || apiKey.length === 0) {
      reply.status(400).send("Invalid symbol or API key");
      return;
    }

    const authApiKey = await usingDatabase(
      fastify,
      Database.DOCDB,
      async (db) => await db.documentAsync<{}>("authorized_keys", apiKey),
    );
    if (authApiKey == null) {
      reply.status(403).send("Unauthorized API key");
      return;
    }

    const data = await usingDatabase(
      fastify,
      Database.DOCDB,
      async (db) =>
        await db.documentAsync<StockDocument>("stocks", symbol.toUpperCase()),
    );

    if (data != null) {
      reply.status(200).send(data);
    } else {
      const stockData = await getStockDataAsync(symbol, apiKey, fastify);
      if (stockData == null) {
        reply.status(404);
        return;
      }

      await usingDatabase(
        fastify,
        Database.DOCDB,
        async (db) =>
          await db.upsertDocumentAsync("stocks", symbol.toUpperCase(), stockData),
      );

      reply.status(200).send(stockData);
    }
  });

  fastify.get<{
    Params: {
      optionTicker: string;
    };
    Querystring: {
      apiKey: string;
    };
    Reply: OptionData | string;
  }>("/options/:optionTicker", async (request, reply) => {
    const { optionTicker } = request.params;
    const { apiKey } = request.query;

    if (apiKey == null || apiKey.length === 0) {
      reply.status(400).send("Invalid API key");
      return;
    }

    const authApiKey = await usingDatabase(
      fastify,
      Database.DOCDB,
      async (db) => await db.documentAsync<{}>("authorized_keys", apiKey),
    );
    if (authApiKey == null) {
      reply.status(403).send("Unauthorized API key");
      return;
    }

    const optionData = await getOptionDataAsync(optionTicker, fastify);

    if (optionData == null) {
      reply.status(404).send("Option not found");
      return;
    }

    reply.status(200).send(optionData);
  });
}
