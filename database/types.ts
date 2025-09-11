import type { Category, Map, Statistics, Tutorial } from "../schemas";

export enum Database {
  CSMAPS = "csmaps",
  DOCDB = "docdb",
}

export type Nullable<T> = T | null;

export abstract class MapDatabase {
  close(): void {}

  abstract categoriesAsync(): Promise<Array<Category>>;
  abstract documentAsync<T>(table: string, id: string): Promise<Nullable<T>>;
  abstract mapsAsync(): Promise<Array<Map>>;
  abstract mapAsync(name: string): Promise<Nullable<Map>>;
  abstract mapAsyncById(id: string): Promise<Nullable<Map>>;
  abstract statisticsAsync(): Promise<Statistics>;
  abstract tutorialsAsync(): Promise<Array<Tutorial>>;
  abstract tutorialAsync(id: string): Promise<Nullable<Tutorial>>;

  abstract upsertDocumentAsync<T>(
    table: string,
    id: string,
    content: T
  ): Promise<void>;
}
