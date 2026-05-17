import { FastifyReply } from "fastify";

const VALID_LANGUAGES = new Set(["en_us", "zh_hk"]);
const ORDER_BY_MAP = new Map(
  ["username", "uploadedDate", "licensePlateNumber"].map((v) => [v.toLowerCase(), v])
);
const VALID_SORT = new Set(["asc", "desc"]);

export function validateLanguage(language: string | undefined, reply: FastifyReply): language is string {
  if (!language || !VALID_LANGUAGES.has(language.toLowerCase())) {
    reply.status(400).send({ error: `Invalid language: ${language}` });
    return false;
  }
  return true;
}

export function validateOrderBy(orderBy: string | undefined, reply: FastifyReply): orderBy is string {
  if (!orderBy || !ORDER_BY_MAP.has(orderBy.toLowerCase())) {
    reply.status(400).send({ error: "order_by is required and must be one of: username, uploadedDate, licensePlateNumber" });
    return false;
  }
  return true;
}

export function normalizeOrderBy(orderBy: string): string {
  return ORDER_BY_MAP.get(orderBy.toLowerCase())!;
}

export function validateSort(sort: string | undefined, reply: FastifyReply): sort is "asc" | "desc" {
  if (!sort || !VALID_SORT.has(sort.toLowerCase())) {
    reply.status(400).send({ error: `Invalid sort direction: ${sort}` });
    return false;
  }
  return true;
}

export function validateSize(size: number | undefined, reply: FastifyReply): boolean {
  if (size !== undefined && size < 1) {
    reply.status(400).send({ error: "Page size must be at least 1" });
    return false;
  }
  return true;
}
