import { PoolClient } from "pg";
import {
    PutPhotoRequest,
    SearchRecord,
    BusCompany,
} from "../../schemas/hkadbus2/schemas";
import {
    getCategoryByHashKey,
    upsertCategory,
    getAdvertisementByHashKey,
    upsertAdvertisement,
    getBusBrandByHashKey,
    upsertBusBrand,
    getBusModelByHashKey,
    upsertBusModel,
    getBusByLicensePlateAndModel,
    upsertBus,
    getBusRouteByHashKey,
    upsertBusRoute,
    getUserByUsername,
    photoShortIdExists,
    insertPhoto,
    insertSearchRecord,
    generateNumericId,
    searchPhotos,
} from "../../database/hkadbus2/impl";

const VALID_LANGUAGES = ["en_us", "zh_hk"];
const MAX_RETRY = 3;

export async function putPhoto(
    client: PoolClient,
    request: PutPhotoRequest
): Promise<number> {
    // ── Validate user ────────────────────────────────────────────────────────
    const userRow = await getUserByUsername(client, request.username);
    if (!userRow) {
        throw Object.assign(new Error(`Username not found: ${request.username}`), { status: 400 });
    }

    // ── Skip-duplicate check ─────────────────────────────────────────────────
    if (request.skipInsertionWithSameThumbnail) {
        const existing = await searchPhotos(
            client,
            [],
            "uploadedDate",
            "asc",
            { thumbnails: [request.thumbnail] },
            null,
            1
        );
        if (existing.total > 0 && existing.results[0]) {
            return existing.results[0].photoId;
        }
    }

    // ── Get-or-create related entities ───────────────────────────────────────
    const thumbnail = request.thumbnail;

    let catRow = await getCategoryByHashKey(client, request.categoryId);
    if (!catRow) {
        catRow = await upsertCategory(client, request.categoryId, request.categoryNames, thumbnail);
    }

    let advRow = await getAdvertisementByHashKey(client, request.advertisementId);
    if (!advRow) {
        advRow = await upsertAdvertisement(
            client,
            request.advertisementId,
            request.advertisementNames,
            thumbnail,
            catRow.id
        );
    }

    let brandRow = await getBusBrandByHashKey(client, request.busBrandId);
    if (!brandRow) {
        brandRow = await upsertBusBrand(client, request.busBrandId, request.busBrandNames);
    }

    let modelRow = await getBusModelByHashKey(client, request.busModelId);
    if (!modelRow) {
        modelRow = await upsertBusModel(
            client,
            request.busModelId,
            request.busModelNames,
            thumbnail,
            brandRow.id
        );
    }

    let busRow = await getBusByLicensePlateAndModel(
        client,
        modelRow.id,
        request.licensePlateNumber
    );
    if (!busRow) {
        busRow = await upsertBus(
            client,
            modelRow.id,
            request.busCompany,
            request.fleetPrefix,
            request.fleetNumber,
            request.licensePlateNumber
        );
    }

    let routeRow = await getBusRouteByHashKey(client, request.busRouteId);
    if (!routeRow) {
        routeRow = await upsertBusRoute(
            client,
            request.busRouteId,
            request.routeNumber,
            [request.busCompany],
            request.busRouteStartLocationNames,
            request.busRouteEndLocationNames
        );
    }

    // ── Generate a unique short ID ────────────────────────────────────────────
    let shortId: number;
    let attempts = 0;
    do {
        shortId = generateNumericId();
        attempts++;
        if (attempts > 10) throw new Error("Could not generate a unique photo short ID");
    } while (await photoShortIdExists(client, shortId));

    // ── Insert photo ──────────────────────────────────────────────────────────
    const uploadedDate = new Date();
    await insertPhoto(
        client,
        shortId,
        thumbnail,
        request.image,
        advRow.id,
        busRow.id,
        routeRow.id,
        userRow.id,
        uploadedDate
    );

    // ── Insert search records asynchronously ─────────────────────────────────
    // Fire-and-forget: we don't want a search record failure to fail the write.
    setImmediate(() => {
        insertSearchRecordsWithRetry(client, request, uploadedDate, shortId, modelRow!, brandRow!);
    });

    return shortId;
}

function insertSearchRecordsWithRetry(
    client: PoolClient,
    request: PutPhotoRequest,
    uploadedDate: Date,
    shortId: number,
    modelRow: { hash_key: string },
    brandRow: { name: string }
): void {
    for (const language of VALID_LANGUAGES) {
        const record: SearchRecord = {
            photoId: shortId,
            advertisementId: request.advertisementId,
            advertisement: request.advertisementNames[language] ?? "",
            categoryId: request.categoryId,
            category: request.categoryNames[language] ?? "",
            busCompany: request.busCompany as BusCompany,
            busModelId: request.busModelId,
            busModel: request.busModelNames[language] ?? "",
            routeId: request.busRouteId,
            routeNumber: request.routeNumber,
            licensePlateNumber: request.licensePlateNumber,
            fleetPrefix: request.fleetPrefix,
            fleetNumber: request.fleetNumber,
            thumbnail: request.thumbnail,
            username: request.username,
            uploadedDate: uploadedDate.getTime(),
            tags: generateTags(request, language),
        };

        let attempts = 0;
        const tryInsert = (): void => {
            insertSearchRecord(client, record, language).catch((err) => {
                attempts++;
                if (attempts < MAX_RETRY) {
                    setTimeout(tryInsert, 200 * attempts);
                } else {
                    console.error(
                        `[hkadbus2] Failed to insert search record for photo ${shortId} lang ${language} after ${MAX_RETRY} retries:`,
                        err
                    );
                }
            });
        };
        tryInsert();
    }
}

function generateTags(request: PutPhotoRequest, language: string): string[] {
    const tags: string[] = [];
    const addWords = (s?: string) => {
        if (s) tags.push(...s.toLowerCase().split(/\s+/));
    };
    addWords(request.advertisementNames[language]);
    addWords(request.categoryNames[language]);
    addWords(request.busBrandNames[language]);
    addWords(request.busModelNames[language]);
    tags.push(request.busCompany.toLowerCase());
    tags.push(request.routeNumber.toLowerCase());
    if (request.fleetPrefix) tags.push(request.fleetPrefix.toLowerCase());
    if (request.fleetPrefix && request.fleetNumber) {
        tags.push(`${request.fleetPrefix.toLowerCase()}${request.fleetNumber}`);
    }
    tags.push(request.username.toLowerCase());
    if (request.additionalTags) addWords(request.additionalTags);
    return tags;
}
