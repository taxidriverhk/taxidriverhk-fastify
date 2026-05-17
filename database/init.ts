import { Database } from "database/types";

export function getConnectionString(database: Database): string | undefined {
  return new Map([
    [Database.CSMAPS, process.env.CSMAPS_DATABASE_URL],
    [Database.DOCDB, process.env.DOCDB_DATABASE_URL],
    [Database.HKADBUS2, process.env.HKADBUS2_DATABASE_URL],
  ]).get(database);
}
