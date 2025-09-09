import type { FastifyInstance } from "fastify";

import { MockMapDatabase, SqlMapDatabase } from "./impl";
import { Database, MapDatabase } from "./types";

export function getConnectionString(database: Database): string | undefined {
  return new Map([
    [Database.CSMAPS, process.env.CSMAPS_DATABASE_URL],
    [Database.DOCDB, process.env.DOCDB_DATABASE_URL],
  ]).get(database);
}

export async function usingDatabase<T>(
  server: FastifyInstance,
  database: Database,
  func: (db: MapDatabase) => Promise<T>
): Promise<T> {
  const connection = await getDatabaseAsync(server, database);
  try {
    return await func(connection);
  } finally {
    connection.close();
  }
}

async function getDatabaseAsync(
  fastifyServer: FastifyInstance,
  database: Database
): Promise<MapDatabase> {
  const connectionString = getConnectionString(database);
  if (!connectionString) {
    fastifyServer.log.info(
      "Connection string is not defined, will use a mock DB"
    );
    return new MockMapDatabase();
  }

  fastifyServer.log.info("Connecting to PostgreSQL database");
  const sqlClient = await fastifyServer.pg[database].connect();

  fastifyServer.log.info("Connected to PostgreSQL database successfully");
  return new SqlMapDatabase(sqlClient);
}
