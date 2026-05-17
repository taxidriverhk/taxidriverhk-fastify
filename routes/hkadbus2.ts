import { FastifyInstance } from "fastify";
import {
  getAdvertisementsByCategoryHashKey,
  getBusModels,
  getCategories,
  getEntityOptions,
  getPhotoByShortId,
  getUsers,
  searchPhotos,
} from "../database/hkadbus2/impl";
import { usingHkAdBus2 } from "../database/hkadbus2/init";
import {
  EntityOptionType,
  GetAdvertisementsResponse,
  GetBusModelsResponse,
  GetCategoriesResponse,
  GetEntityOptionsResponse,
  GetPhotoResponse,
  GetUsersResponse,
  PutPhotoRequest,
  PutPhotoResponse,
  SearchPhotosResponse,
  SearchPhotoFilter,
} from "../schemas/hkadbus2/schemas";
import {
  normalizeOrderBy,
  validateLanguage,
  validateOrderBy,
  validateSize,
  validateSort,
} from "../schemas/hkadbus2/validation";
import { buildAuthHook, generateToken } from "../services/hkadbus2/auth";
import { putPhoto } from "../services/hkadbus2/photo";

export default async function hkadbus2Routes(fastify: FastifyInstance) {
  const secret = process.env.ENCRYPTOR_PASSWORD ?? "changeme";
  const authHook = buildAuthHook(secret);

  fastify.post("/auth/token", async (_request, reply) => {
    const token = generateToken(secret);
    reply.send({ token });
  });

  fastify.get<{
    Querystring: { language?: string };
    Reply: GetCategoriesResponse;
  }>("/categories", async (request, reply) => {
    const { language } = request.query;
    if (!validateLanguage(language, reply)) return;
    return usingHkAdBus2(fastify, async (client) => ({
      categories: await getCategories(client, language.toLowerCase()),
    }));
  });

  fastify.get<{
    Params: { categoryId: string };
    Querystring: { language?: string };
    Reply: GetAdvertisementsResponse;
  }>("/categories/:categoryId/advertisements", async (request, reply) => {
    const { categoryId } = request.params;
    const { language } = request.query;
    if (!validateLanguage(language, reply)) return;
    return usingHkAdBus2(fastify, async (client) => ({
      advertisements: await getAdvertisementsByCategoryHashKey(client, categoryId, language.toLowerCase()),
    }));
  });

  fastify.get<{
    Querystring: { language?: string };
    Reply: GetBusModelsResponse;
  }>("/bus-models", async (request, reply) => {
    const { language } = request.query;
    if (!validateLanguage(language, reply)) return;
    return usingHkAdBus2(fastify, async (client) => ({
      busModels: await getBusModels(client, language.toLowerCase()),
    }));
  });

  fastify.get<{
    Params: { entityType: string };
    Querystring: { language?: string };
    Reply: GetEntityOptionsResponse;
  }>("/entities/:entityType", async (request, reply) => {
    const { entityType } = request.params;
    const { language } = request.query;
    if (!validateLanguage(language, reply)) return;
    const validType = Object.values(EntityOptionType).find((v) => v === entityType);
    if (!validType) {
      reply.status(400).send({ error: `Invalid entityType: ${entityType}` } as any);
      return;
    }
    return usingHkAdBus2(fastify, async (client) => ({
      entityType,
      options: await getEntityOptions(client, validType as EntityOptionType, language.toLowerCase()),
    }));
  });

  fastify.get<{
    Params: { shortId: string };
    Querystring: { language?: string };
    Reply: GetPhotoResponse;
  }>("/photos/:shortId", async (request, reply) => {
    const { shortId } = request.params;
    const { language } = request.query;
    if (!validateLanguage(language, reply)) return;
    const id = parseInt(shortId, 10);
    if (isNaN(id)) {
      reply.status(400).send({ error: "Invalid shortId" } as any);
      return;
    }
    const photo = await usingHkAdBus2(fastify, (client) =>
      getPhotoByShortId(client, id, language.toLowerCase())
    );
    if (!photo) {
      reply.status(404).send({ error: "Photo not found" } as any);
      return;
    }
    reply.send({ photo });
  });

  fastify.get<{
    Querystring: {
      q?: string;
      order_by?: string;
      sort?: string;
      size?: string;
      next_sort_key?: string;
      language?: string;
      advertisement_id?: string;
      bus_model_id?: string;
      bus_route_number?: string;
      fleet_prefix?: string;
      fleet_number?: string;
      license_plate_number?: string;
      uploader_name?: string;
    };
    Reply: SearchPhotosResponse;
  }>("/photos", async (request, reply) => {
    const q = request.query;
    if (!validateLanguage(q.language, reply)) return;
    if (!validateOrderBy(q.order_by, reply)) return;
    if (!validateSort(q.sort, reply)) return;
    const size = q.size !== undefined ? parseInt(q.size, 10) : 50;
    if (!validateSize(size, reply)) return;

    const filter: SearchPhotoFilter = {
      language: q.language?.toLowerCase(),
      advertisementIds: q.advertisement_id ? [q.advertisement_id] : [],
      busModelIds: q.bus_model_id ? [q.bus_model_id] : [],
      busRouteNumbers: q.bus_route_number ? [q.bus_route_number] : [],
      fleetPrefixes: q.fleet_prefix ? [q.fleet_prefix] : [],
      fleetNumbers: q.fleet_number ? [q.fleet_number] : [],
      licensePlateNumbers: q.license_plate_number ? [q.license_plate_number] : [],
      uploaderNames: q.uploader_name ? [q.uploader_name] : [],
    };

    return usingHkAdBus2(fastify, async (client) =>
      searchPhotos(
        client,
        q.q ? [q.q] : [],
        normalizeOrderBy(q.order_by!),
        q.sort!.toLowerCase() as "asc" | "desc",
        filter,
        q.next_sort_key ?? null,
        size
      )
    );
  });

  fastify.post<{
    Body: PutPhotoRequest;
    Reply: PutPhotoResponse;
  }>("/photo", { preHandler: authHook }, async (request, reply) => {
    const photoId = await usingHkAdBus2(fastify, (client) =>
      putPhoto(client, request.body)
    );
    reply.send({ photoId });
  });

  fastify.get<{
    Reply: GetUsersResponse;
  }>("/users", async (_request, _reply) => {
    return usingHkAdBus2(fastify, async (client) => ({
      users: await getUsers(client),
    }));
  });
}
