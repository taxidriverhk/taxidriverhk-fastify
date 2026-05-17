import type { FastifyInstance } from "fastify";
import { getConnectionString } from "database/init";
import { Database } from "database/types";
import { MockMapDatabase, SqlMapDatabase } from "database/csmaps/impl";
import { MapDatabase } from "database/csmaps/types";

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
