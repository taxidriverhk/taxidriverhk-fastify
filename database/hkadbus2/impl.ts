import { PoolClient } from "pg";
import {
    Advertisement,
    BusCompany,
    BusModel,
    Category,
    EntityOptionType,
    Photo,
    SearchPhotoFilter,
    SearchRecord,
    User,
} from "../../schemas/hkadbus2/schemas";
import {
    AdvertisementRow,
    BusBrandRow,
    BusModelRow,
    BusRow,
    BusRouteRow,
    CategoryRow,
    PhotoRow,
    SearchRecordRow,
    UserRow,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a JSON-encoded localised string column and return the value for the
 *  requested language (falls back to the first available value). */
function localised(jsonText: string, language: string): string {
    try {
        const map: Record<string, string> = JSON.parse(jsonText);
        return map[language] ?? Object.values(map)[0] ?? "";
    } catch {
        return jsonText ?? "";
    }
}

// ─── Category ─────────────────────────────────────────────────────────────────

export async function getCategories(
    client: PoolClient,
    language: string
): Promise<Category[]> {
    const { rows } = await client.query<CategoryRow>(
        "SELECT * FROM category ORDER BY hash_key"
    );
    return rows
        .map((r) => ({
            id: r.hash_key,
            name: localised(r.name, language),
            thumbnail: r.thumbnail,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategoryByHashKey(
    client: PoolClient,
    hashKey: string
): Promise<CategoryRow | null> {
    const { rows } = await client.query<CategoryRow>(
        "SELECT * FROM category WHERE hash_key = $1 LIMIT 1",
        [hashKey]
    );
    return rows[0] ?? null;
}

export async function upsertCategory(
    client: PoolClient,
    hashKey: string,
    nameJson: Record<string, string>,
    thumbnail: string
): Promise<CategoryRow> {
    const { rows } = await client.query<CategoryRow>(
        `INSERT INTO category (id, hash_key, name, thumbnail)
     VALUES (gen_random_uuid(), $1, $2, $3)
     ON CONFLICT (hash_key) DO UPDATE SET name = EXCLUDED.name, thumbnail = EXCLUDED.thumbnail
     RETURNING *`,
        [hashKey, JSON.stringify(nameJson), thumbnail]
    );
    return rows[0];
}

// ─── Advertisement ────────────────────────────────────────────────────────────

export async function getAdvertisementsByCategoryHashKey(
    client: PoolClient,
    categoryHashKey: string,
    language: string
): Promise<Advertisement[]> {
    const { rows } = await client.query<AdvertisementRow>(
        `SELECT a.*, c.hash_key AS category_hash_key, c.name AS category_name, c.thumbnail AS category_thumbnail
     FROM advertisement a
     JOIN category c ON c.id = a.category_id
     WHERE c.hash_key = $1`,
        [categoryHashKey]
    );
    return rows
        .map((r) => ({
            id: r.hash_key,
            name: localised(r.name, language),
            categoryId: r.category_hash_key,
            categoryName: localised(r.category_name, language),
            thumbnail: r.thumbnail,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAdvertisementByHashKey(
    client: PoolClient,
    hashKey: string
): Promise<AdvertisementRow | null> {
    const { rows } = await client.query<AdvertisementRow>(
        `SELECT a.*, c.hash_key AS category_hash_key, c.name AS category_name, c.thumbnail AS category_thumbnail
     FROM advertisement a
     JOIN category c ON c.id = a.category_id
     WHERE a.hash_key = $1 LIMIT 1`,
        [hashKey]
    );
    return rows[0] ?? null;
}

export async function upsertAdvertisement(
    client: PoolClient,
    hashKey: string,
    nameJson: Record<string, string>,
    thumbnail: string,
    categoryUuid: string
): Promise<AdvertisementRow> {
    const { rows } = await client.query<AdvertisementRow>(
        `INSERT INTO advertisement (id, hash_key, name, thumbnail, category_id)
     VALUES (gen_random_uuid(), $1, $2, $3, $4::uuid)
     ON CONFLICT (hash_key) DO UPDATE SET name = EXCLUDED.name, thumbnail = EXCLUDED.thumbnail
     RETURNING *`,
        [hashKey, JSON.stringify(nameJson), thumbnail, categoryUuid]
    );
    return rows[0];
}

// ─── Bus Brand ────────────────────────────────────────────────────────────────

export async function getBusBrands(client: PoolClient): Promise<BusBrandRow[]> {
    const { rows } = await client.query<BusBrandRow>("SELECT * FROM bus_brand");
    return rows;
}

export async function getBusBrandByHashKey(
    client: PoolClient,
    hashKey: string
): Promise<BusBrandRow | null> {
    const { rows } = await client.query<BusBrandRow>(
        "SELECT * FROM bus_brand WHERE hash_key = $1 LIMIT 1",
        [hashKey]
    );
    return rows[0] ?? null;
}

export async function upsertBusBrand(
    client: PoolClient,
    hashKey: string,
    nameJson: Record<string, string>
): Promise<BusBrandRow> {
    const { rows } = await client.query<BusBrandRow>(
        `INSERT INTO bus_brand (id, hash_key, name)
     VALUES (gen_random_uuid(), $1, $2)
     ON CONFLICT (hash_key) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
        [hashKey, JSON.stringify(nameJson)]
    );
    return rows[0];
}

// ─── Bus Model ────────────────────────────────────────────────────────────────

export async function getBusModels(
    client: PoolClient,
    language: string
): Promise<BusModel[]> {
    const { rows } = await client.query<BusModelRow>(
        `SELECT bm.*, bb.hash_key AS bus_brand_hash_key, bb.name AS bus_brand_name
     FROM bus_model bm
     JOIN bus_brand bb ON bb.id = bm.bus_brand_id`
    );
    return rows
        .map((r) => ({
            id: r.hash_key,
            name: localised(r.name, language),
            thumbnail: r.thumbnail,
            busBrandId: r.bus_brand_hash_key,
            busBrandName: localised(r.bus_brand_name, language),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getBusModelByHashKey(
    client: PoolClient,
    hashKey: string
): Promise<BusModelRow | null> {
    const { rows } = await client.query<BusModelRow>(
        `SELECT bm.*, bb.hash_key AS bus_brand_hash_key, bb.name AS bus_brand_name
     FROM bus_model bm
     JOIN bus_brand bb ON bb.id = bm.bus_brand_id
     WHERE bm.hash_key = $1 LIMIT 1`,
        [hashKey]
    );
    return rows[0] ?? null;
}

export async function upsertBusModel(
    client: PoolClient,
    hashKey: string,
    nameJson: Record<string, string>,
    thumbnail: string,
    busBrandUuid: string
): Promise<BusModelRow> {
    const { rows } = await client.query<BusModelRow>(
        `INSERT INTO bus_model (id, hash_key, name, thumbnail, bus_brand_id)
     VALUES (gen_random_uuid(), $1, $2, $3, $4::uuid)
     ON CONFLICT (hash_key) DO UPDATE SET name = EXCLUDED.name, thumbnail = EXCLUDED.thumbnail
     RETURNING *`,
        [hashKey, JSON.stringify(nameJson), thumbnail, busBrandUuid]
    );
    return rows[0];
}

// ─── Bus ──────────────────────────────────────────────────────────────────────

export async function getBusByLicensePlateAndModel(
    client: PoolClient,
    busModelUuid: string,
    licensePlateNumber: string
): Promise<BusRow | null> {
    const { rows } = await client.query<BusRow>(
        `SELECT * FROM bus WHERE bus_model_id = $1::uuid AND license_plate_number = $2 LIMIT 1`,
        [busModelUuid, licensePlateNumber]
    );
    return rows[0] ?? null;
}

export async function upsertBus(
    client: PoolClient,
    busModelUuid: string,
    busCompany: string,
    fleetPrefix: string,
    fleetNumber: string,
    licensePlateNumber: string
): Promise<BusRow> {
    // Generate a numeric short_id from a random UUID (mirrors IdentifierGenerator.kt)
    const shortId = generateNumericId();
    const { rows } = await client.query<BusRow>(
        `INSERT INTO bus (id, short_id, bus_model_id, bus_company, fleet_prefix, fleet_number, license_plate_number)
     VALUES (gen_random_uuid(), $1, $2::uuid, $3, $4, $5, $6)
     ON CONFLICT (bus_model_id, license_plate_number) DO UPDATE
       SET bus_company = EXCLUDED.bus_company,
           fleet_prefix = EXCLUDED.fleet_prefix,
           fleet_number = EXCLUDED.fleet_number
     RETURNING *`,
        [shortId, busModelUuid, busCompany, fleetPrefix, fleetNumber, licensePlateNumber]
    );
    return rows[0];
}

// ─── Bus Route ────────────────────────────────────────────────────────────────

export async function getBusRouteByHashKey(
    client: PoolClient,
    hashKey: string
): Promise<BusRouteRow | null> {
    const { rows } = await client.query<BusRouteRow>(
        "SELECT * FROM bus_route WHERE hash_key = $1 LIMIT 1",
        [hashKey]
    );
    return rows[0] ?? null;
}

export async function upsertBusRoute(
    client: PoolClient,
    hashKey: string,
    routeNumber: string,
    busCompanies: string[],
    startLocationJson: Record<string, string>,
    endLocationJson: Record<string, string>
): Promise<BusRouteRow> {
    const { rows } = await client.query<BusRouteRow>(
        `INSERT INTO bus_route (id, hash_key, route_number, bus_companies, start_location, end_location)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
     ON CONFLICT (hash_key) DO UPDATE
       SET route_number = EXCLUDED.route_number,
           bus_companies = EXCLUDED.bus_companies,
           start_location = EXCLUDED.start_location,
           end_location = EXCLUDED.end_location
     RETURNING *`,
        [
            hashKey,
            routeNumber,
            JSON.stringify(busCompanies),
            JSON.stringify(startLocationJson),
            JSON.stringify(endLocationJson),
        ]
    );
    return rows[0];
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getUsers(
    client: PoolClient
): Promise<User[]> {
    const { rows } = await client.query<UserRow>("SELECT * FROM \"user\"");
    return rows.map((r) => ({
        username: r.username,
        thumbnail: r.thumbnail,
        registrationDate: r.registration_date.getTime(),
    }));
}

export async function getUserByUsername(
    client: PoolClient,
    username: string
): Promise<UserRow | null> {
    const { rows } = await client.query<UserRow>(
        "SELECT * FROM \"user\" WHERE username = $1 LIMIT 1",
        [username]
    );
    return rows[0] ?? null;
}

// ─── Photo ────────────────────────────────────────────────────────────────────

export async function getPhotoByShortId(
    client: PoolClient,
    shortId: number,
    language: string
): Promise<Photo | null> {
    const { rows } = await client.query<PhotoRow>(
        `SELECT
       p.*,
       a.hash_key   AS adv_hash_key,
       a.name       AS adv_name,
       a.thumbnail  AS adv_thumbnail,
       c.hash_key   AS cat_hash_key,
       c.name       AS cat_name,
       b.short_id   AS bus_short_id,
       b.bus_company,
       b.fleet_prefix,
       b.fleet_number,
       b.license_plate_number,
       bm.hash_key  AS bus_model_hash_key,
       bm.name      AS bus_model_name,
       bb.name      AS bus_brand_name,
       br.route_number,
       u.username
     FROM photo p
     JOIN advertisement a  ON a.id  = p.advertisement_id
     JOIN category c       ON c.id  = a.category_id
     JOIN bus b            ON b.id  = p.bus_id
     JOIN bus_model bm     ON bm.id = b.bus_model_id
     JOIN bus_brand bb     ON bb.id = bm.bus_brand_id
     JOIN bus_route br     ON br.id = p.bus_route_id
     JOIN "user" u         ON u.id  = p.user_id
     WHERE p.short_id = $1 LIMIT 1`,
        [shortId]
    );
    const r = rows[0];
    if (!r) return null;
    return {
        photoId: r.short_id,
        advertisementId: r.adv_hash_key,
        advertisement: localised(r.adv_name, language),
        categoryId: r.cat_hash_key,
        category: localised(r.cat_name, language),
        busCompany: r.bus_company as BusCompany,
        busId: r.bus_short_id,
        busModelId: r.bus_model_hash_key,
        busModel: localised(r.bus_model_name, language),
        busBrand: localised(r.bus_brand_name, language),
        routeNumber: r.route_number,
        licensePlateNumber: r.license_plate_number,
        fleetPrefix: r.fleet_prefix,
        fleetNumber: r.fleet_number,
        image: r.image,
        thumbnail: r.thumbnail,
        username: r.username,
        uploadedDate: new Date(r.uploaded_date).getTime(),
    };
}

export async function photoShortIdExists(
    client: PoolClient,
    shortId: number
): Promise<boolean> {
    const { rowCount } = await client.query(
        "SELECT 1 FROM photo WHERE short_id = $1 LIMIT 1",
        [shortId]
    );
    return (rowCount ?? 0) > 0;
}

export async function insertPhoto(
    client: PoolClient,
    shortId: number,
    thumbnail: string,
    image: string,
    advertisementUuid: string,
    busUuid: string,
    busRouteUuid: string,
    userUuid: string,
    uploadedDate: Date
): Promise<number> {
    await client.query(
        `INSERT INTO photo (id, short_id, thumbnail, image, advertisement_id, bus_id, bus_route_id, user_id, uploaded_date)
     VALUES (gen_random_uuid(), $1, $2, $3, $4::uuid, $5::uuid, $6::uuid, $7::uuid, $8)`,
        [shortId, thumbnail, image, advertisementUuid, busUuid, busRouteUuid, userUuid, uploadedDate] as any[]
    );
    return shortId;
}

// ─── Search records ───────────────────────────────────────────────────────────

/** Map of SearchPhotoFilter keys → search_record column names */
const FILTER_COLUMN_MAP: Record<string, string> = {
    advertisementNames: "advertisement_name",
    advertisementIds: "advertisement_hash_key",
    busCompanyNames: "bus_company",
    busModelNames: "bus_model_name",
    busModelIds: "bus_model_hash_key",
    categoryNames: "category_name",
    categoryIds: "category_hash_key",
    busRouteIds: "route_hash_key",
    busRouteNumbers: "route_number",
    fleetPrefixes: "fleet_prefix",
    fleetNumbers: "fleet_number",
    licensePlateNumbers: "license_plate_number",
    uploaderNames: "username",
    thumbnails: "thumbnail",
};

const VALID_ORDER_BY: Record<string, string> = {
    username: "username",
    uploadedDate: "uploaded_date",
    licensePlateNumber: "license_plate_number",
};

export async function searchPhotos(
    client: PoolClient,
    queryTexts: string[],
    orderBy: string,
    sort: "asc" | "desc",
    filter: SearchPhotoFilter,
    nextPageCursor: string | null,
    limit: number
): Promise<{ total: number; results: SearchRecord[]; nextPageCursor: string | null }> {
    const column = VALID_ORDER_BY[orderBy] ?? "uploaded_date";
    const sortDir = sort === "asc" ? "ASC" : "DESC";

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    // Language filter (always required for search_record)
    if (filter.language) {
        conditions.push(`language = $${paramIdx++}`);
        params.push(filter.language);
    }

    // Static field filters
    for (const [key, columnName] of Object.entries(FILTER_COLUMN_MAP)) {
        const values = filter[key as keyof SearchPhotoFilter] as string[] | undefined;
        if (values && values.length > 0) {
            const placeholders = values.map(() => `$${paramIdx++}`).join(", ");
            conditions.push(`LOWER(${columnName}) IN (${placeholders})`);
            params.push(...values.map((v) => v.toLowerCase()));
        }
    }

    // Full-text search on tags
    if (queryTexts.length > 0) {
        const tagConditions = queryTexts.map(() => `LOWER(tags) LIKE $${paramIdx++}`);
        conditions.push(`(${tagConditions.join(" OR ")})`);
        params.push(...queryTexts.map((t) => `%${t.toLowerCase()}%`));
    }

    const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countSql = `SELECT COUNT(*) AS total FROM search_record ${whereClause}`;
    const { rows: countRows } = await client.query<{ total: string }>(countSql, params);
    const total = parseInt(countRows[0].total, 10);

    // Pagination via keyset cursor
    const paginationConditions = [...conditions];
    const paginationParams = [...params];
    if (nextPageCursor) {
        const parts = nextPageCursor.split("-");
        if (parts.length === 2) {
            const [lastSortKey, lastId] = parts;
            if (sort === "asc") {
                paginationConditions.push(
                    `(${column} > $${paramIdx} OR (${column} = $${paramIdx} AND photo_short_id > $${paramIdx + 1}))`
                );
            } else {
                paginationConditions.push(
                    `(${column} < $${paramIdx} OR (${column} = $${paramIdx} AND photo_short_id > $${paramIdx + 1}))`
                );
            }
            paginationParams.push(lastSortKey, parseInt(lastId, 10));
            paramIdx += 2;
        }
    }

    const paginationWhere =
        paginationConditions.length > 0
            ? `WHERE ${paginationConditions.join(" AND ")}`
            : "";

    const selectSql = `
    SELECT * FROM search_record
    ${paginationWhere}
    ORDER BY ${column} ${sortDir}, photo_short_id ASC
    LIMIT $${paramIdx}`;
    paginationParams.push(limit);

    const { rows } = await client.query<SearchRecordRow>(selectSql, paginationParams);

    const results: SearchRecord[] = rows.map((r) => ({
        photoId: r.photo_short_id,
        advertisementId: r.advertisement_hash_key,
        advertisement: r.advertisement_name,
        categoryId: r.category_hash_key,
        category: r.category_name,
        busCompany: r.bus_company as BusCompany,
        busModelId: r.bus_model_hash_key,
        busModel: r.bus_model_name,
        routeId: r.route_hash_key,
        routeNumber: r.route_number,
        licensePlateNumber: r.license_plate_number,
        fleetPrefix: r.fleet_prefix,
        fleetNumber: r.fleet_number,
        thumbnail: r.thumbnail,
        username: r.username,
        uploadedDate: r.uploaded_date,
        tags: r.tags ? r.tags.split(",") : [],
    }));

    // Build next page cursor
    let newCursor: string | null = null;
    if (results.length > 0 && results.length >= limit && total > results.length) {
        const last = results[results.length - 1];
        const lastKey =
            orderBy === "uploadedDate"
                ? String(last.uploadedDate)
                : orderBy === "username"
                    ? last.username
                    : last.licensePlateNumber;
        newCursor = `${lastKey}-${last.photoId}`;
    }

    return { total, results, nextPageCursor: newCursor };
}

export async function insertSearchRecord(
    client: PoolClient,
    record: SearchRecord,
    language: string
): Promise<void> {
    await client.query(
        `INSERT INTO search_record (
       photo_short_id, language,
       advertisement_hash_key, advertisement_name,
       category_hash_key, category_name,
       bus_company, bus_model_hash_key, bus_model_name,
       route_hash_key, route_number,
       license_plate_number, fleet_prefix, fleet_number,
       thumbnail, username, uploaded_date, tags
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (photo_short_id, language) DO NOTHING`,
        [
            record.photoId,
            language,
            record.advertisementId,
            record.advertisement,
            record.categoryId,
            record.category,
            record.busCompany,
            record.busModelId,
            record.busModel,
            record.routeId,
            record.routeNumber,
            record.licensePlateNumber,
            record.fleetPrefix,
            record.fleetNumber,
            record.thumbnail,
            record.username,
            record.uploadedDate,
            record.tags.join(","),
        ] as any[]
    );
}

// ─── Entity Options ───────────────────────────────────────────────────────────

const ENTITY_OPTION_COLUMNS: Partial<
    Record<EntityOptionType, { hashKey: string; name: string }>
> = {
    [EntityOptionType.ADVERTISEMENT]: {
        hashKey: "advertisement_hash_key",
        name: "advertisement_name",
    },
    [EntityOptionType.BUS_MODEL]: {
        hashKey: "bus_model_hash_key",
        name: "bus_model_name",
    },
    [EntityOptionType.CATEGORY]: {
        hashKey: "category_hash_key",
        name: "category_name",
    },
    [EntityOptionType.LICENSE_PLATE_NUMBER]: {
        hashKey: "license_plate_number",
        name: "license_plate_number",
    },
    [EntityOptionType.ROUTE]: {
        hashKey: "route_hash_key",
        name: "route_number",
    },
};

export async function getEntityOptions(
    client: PoolClient,
    entityType: EntityOptionType,
    language: string
): Promise<Record<string, string>> {
    if (entityType === EntityOptionType.LOCATION) {
        return getLocationOptions(client, language);
    }

    const cols = ENTITY_OPTION_COLUMNS[entityType];
    if (!cols) return {};

    const { rows } = await client.query<{ hash_key: string; name: string }>(
        `SELECT DISTINCT ${cols.hashKey} AS hash_key, ${cols.name} AS name
     FROM search_record
     WHERE language = $1
     ORDER BY name`,
        [language]
    );
    return Object.fromEntries(rows.map((r) => [r.hash_key, r.name]));
}

async function getLocationOptions(
    client: PoolClient,
    language: string
): Promise<Record<string, string>> {
    const { rows } = await client.query<BusRouteRow>(
        "SELECT start_location, end_location FROM bus_route"
    );
    const result: Record<string, string> = {};
    for (const r of rows) {
        for (const col of [r.start_location, r.end_location]) {
            try {
                const map: Record<string, string> = JSON.parse(col);
                const enKey = map["en_us"];
                const localValue = map[language] ?? enKey;
                if (enKey) result[enKey] = localValue;
            } catch {
                // ignore malformed rows
            }
        }
    }
    return result;
}

// ─── Identifier generator (mirrors IdentifierGenerator.kt) ───────────────────

export function generateNumericId(): number {
    // Use crypto.randomUUID if available, otherwise fall back to Math.random
    const uuid =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Math.random().toString(16).slice(2)}-${Math.random()
                .toString(16)
                .slice(2)}-${Math.random().toString(16).slice(2)}-${Math.random()
                    .toString(16)
                    .slice(2)}-${Math.random().toString(16).slice(2)}`;
    const hex = uuid.replace(/-/g, "");
    const bigNum = BigInt("0x" + hex);
    const str = bigNum.toString();
    const digits = str.length;
    return parseInt(str.substring(digits - 9, digits), 10);
}
