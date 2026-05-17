import type { FastifyInstance } from "fastify";
import { PoolClient } from "pg";
import { Database } from "../types";

/**
 * Acquires a client from the named pool, runs `fn`, then releases the client.
 * Mirrors the `usingDatabase` helper in the existing fastify repo.
 */
export async function usingHkAdBus2<T>(
    server: FastifyInstance,
    fn: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client: PoolClient = await (server.pg as any)[Database.HKADBUS2].connect();
    try {
        return await fn(client);
    } finally {
        client.release();
    }
}
