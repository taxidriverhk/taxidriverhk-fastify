import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createHmac, timingSafeEqual } from "crypto";

const ISSUER = "taxidriverhk";
const TTL_SECONDS = 3600;

// Minimal HS256 JWT implementation (no external dependency required).
// For production consider using @fastify/jwt or jsonwebtoken.

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function generateToken(secret: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ iss: ISSUER, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })
  );
  const signature = base64url(
    createHmac("sha256", secret)
      .update(`${header}.${payload}`)
      .digest()
  );
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;
    const expected = base64url(
      createHmac("sha256", secret)
        .update(`${header}.${payload}`)
        .digest()
    );

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expBuf)) return false;

    const { iss, exp } = JSON.parse(base64urlDecode(payload).toString());
    if (iss !== ISSUER) return false;
    if (typeof exp === "number" && exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Fastify preHandler hook that enforces JWT auth on non-GET routes.
 * Register via `fastify.addHook('preHandler', authHook)` or per-route.
 */
export function buildAuthHook(secret: string) {
  return async function authHook(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (request.method === "GET") return; // read-only routes are public

    const authHeader = request.headers["authorization"];
    if (!authHeader || !verifyToken(authHeader, secret)) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  };
}

/**
 * Register a POST /auth/token route that hands back a signed JWT.
 * The secret is read from the ENCRYPTOR_PASSWORD environment variable,
 * matching the original Java AuthenticationFilter behaviour.
 */
export function registerAuthRoutes(server: FastifyInstance): void {
  const secret = process.env.ENCRYPTOR_PASSWORD ?? "changeme";

  server.post("/auth/token", async (_request, reply) => {
    const token = generateToken(secret);
    reply.send({ token });
  });
}
