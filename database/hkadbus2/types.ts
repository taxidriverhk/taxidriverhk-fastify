// Raw row shapes returned by postgres queries.
// Column names match the SQL schema exactly.

export type AdvertisementRow = {
    id: string;
    name: string; // JSON text: { en_us: "...", zh_hk: "..." }
    thumbnail: string;
    hash_key: string;
    category_id: string;
    category_name: string; // JSON text (joined)
    category_hash_key: string;
    category_thumbnail: string;
};

export type BusBrandRow = {
    id: string;
    name: string; // JSON text
    hash_key: string;
};

export type BusModelRow = {
    id: string;
    name: string; // JSON text
    thumbnail: string;
    hash_key: string;
    bus_brand_id: string;
    bus_brand_name: string; // JSON text (joined)
    bus_brand_hash_key: string;
};

export type BusRow = {
    id: string;
    short_id: number;
    bus_company: string;
    fleet_prefix: string;
    fleet_number: string;
    license_plate_number: string;
    bus_model_id: string;
};

export type BusRouteRow = {
    id: string;
    route_number: string;
    bus_companies: string; // JSON text list
    start_location: string; // JSON text
    end_location: string; // JSON text
    hash_key: string;
};

export type CategoryRow = {
    id: string;
    name: string; // JSON text
    thumbnail: string;
    hash_key: string;
};

export type PhotoRow = {
    id: string;
    short_id: number;
    thumbnail: string;
    image: string;
    advertisement_id: string;
    bus_id: string;
    bus_route_id: string;
    user_id: string;
    uploaded_date: Date;
    // joined fields
    adv_hash_key: string;
    adv_name: string; // JSON text
    adv_thumbnail: string;
    cat_hash_key: string;
    cat_name: string; // JSON text
    bus_short_id: number;
    bus_company: string;
    fleet_prefix: string;
    fleet_number: string;
    license_plate_number: string;
    bus_model_hash_key: string;
    bus_model_name: string; // JSON text
    bus_brand_name: string; // JSON text
    route_number: string;
    username: string;
};

export type SearchRecordRow = {
    photo_short_id: number;
    language: string;
    advertisement_hash_key: string;
    advertisement_name: string;
    category_hash_key: string;
    category_name: string;
    bus_company: string;
    bus_model_hash_key: string;
    bus_model_name: string;
    route_hash_key: string;
    route_number: string;
    license_plate_number: string;
    fleet_prefix: string;
    fleet_number: string;
    thumbnail: string;
    username: string;
    uploaded_date: number;
    tags: string;
};

export type UserRow = {
    id: string;
    username: string;
    password_hash: string;
    group: string;
    thumbnail: string;
    last_logged_in_date: Date | null;
    registration_date: Date;
};
