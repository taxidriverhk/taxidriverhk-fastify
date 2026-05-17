import { FastifyInstance } from "fastify";
import { usingDatabase } from "database/csmaps/init";
import { Database } from "database/types";
import {
  GetMapsResponse,
  GetStatisticsResponse,
  GetTutorialsResponse,
  Map as MapItem,
  Tutorial,
} from "schemas/csmaps/schemas";

export default async function csmapsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Reply: GetMapsResponse;
  }>("/maps", async (_request, _reply) => {
    return await usingDatabase(fastify, Database.CSMAPS, async (db) => {
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

  fastify.get<{
    Params: {
      name: string;
    };
    Reply: MapItem;
  }>("/maps/:name", async (request, reply) => {
    const { name } = request.params;
    const idNumber = parseInt(name, 10);

    const map = await usingDatabase(fastify, Database.CSMAPS, async (db) =>
      Number.isNaN(idNumber)
        ? await db.mapAsync(name)
        : await db.mapAsyncById(name),
    );

    if (map != null) {
      reply.status(200).send(map);
    } else {
      reply.status(404);
    }
  });

  fastify.get<{
    Reply: GetStatisticsResponse;
  }>("/statistics", async (_request, _reply) => {
    return await usingDatabase(fastify, Database.CSMAPS, async (db) => ({
      statistics: await db.statisticsAsync(),
    }));
  });

  fastify.get<{
    Reply: GetTutorialsResponse;
  }>("/tutorials", async (_request, _reply) => {
    return await usingDatabase(fastify, Database.CSMAPS, async (db) => ({
      tutorials: await db.tutorialsAsync(),
    }));
  });

  fastify.get<{
    Params: {
      id: string;
    };
    Reply: Tutorial;
  }>("/tutorials/:id", async (request, reply) => {
    const { id } = request.params;
    const tutorial = await usingDatabase(
      fastify,
      Database.CSMAPS,
      async (db) => await db.tutorialAsync(id),
    );

    if (tutorial != null) {
      reply.status(200).send(tutorial);
    } else {
      reply.status(404);
    }
  });
}
