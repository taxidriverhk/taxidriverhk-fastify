import fastifyPostgres from "@fastify/postgres";
import fastify from "fastify";
import pg from "pg";
import { getConnectionString } from "./database/init";
import { Database } from "./database/types";
import csmapsRoutes from "./routes/csmaps";
import stockRoutes from "./routes/stocks";

const server = fastify({
  logger: {
    level: "info",
  },
});

// Parse BIGINT, INTEGER, NUMERIC, DECIMAL types back to numbers
pg.types.setTypeParser(20, (value: string) => parseInt(value, 10)); // BIGINT
pg.types.setTypeParser(23, (value: string) => parseInt(value, 10)); // INTEGER
pg.types.setTypeParser(21, (value: string) => parseInt(value, 10)); // SMALLINT
pg.types.setTypeParser(700, (value: string) => parseFloat(value)); // REAL
pg.types.setTypeParser(701, (value: string) => parseFloat(value)); // DOUBLE PRECISION
pg.types.setTypeParser(1700, (value: string) => parseFloat(value)); // NUMERIC

Object.values(Database).forEach((db) => {
  const connectionString = getConnectionString(db);
  if (connectionString) {
    server.register(fastifyPostgres, {
      name: db,
      connectionString,
    });
  }
});

server.register(csmapsRoutes);
server.register(stockRoutes, { prefix: "/stocks" });

server.listen({ port: 8090, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Fastify server started at ${address}`);
});
