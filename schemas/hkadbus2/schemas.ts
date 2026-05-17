// ─── Enums ───────────────────────────────────────────────────────────────────

export enum BusCompany {
  KMB = "kmb",
  CMB = "cmb",
  CTB = "ctb",
  LWB = "lwb",
  NLB = "nlb",
  NWFB = "nwfb",
}

export enum EntityOptionType {
  ADVERTISEMENT = "advertisement",
  BUS_MODEL = "bus-model",
  CATEGORY = "category",
  LICENSE_PLATE_NUMBER = "license-plate-number",
  LOCATION = "location",
  ROUTE = "route",
}

// ─── Domain models ────────────────────────────────────────────────────────────

export type Advertisement = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  thumbnail: string;
};

export type BusModel = {
  id: string;
  name: string;
  thumbnail: string;
  busBrandId: string;
  busBrandName: string;
};

export type Category = {
  id: string;
  name: string;
  thumbnail: string;
};

export type Photo = {
  photoId: number;
  advertisementId: string;
  advertisement: string;
  categoryId: string;
  category: string;
  busCompany: BusCompany;
  busId: number;
  busBrand: string;
  busModelId: string;
  busModel: string;
  routeNumber: string;
  licensePlateNumber: string;
  fleetPrefix: string;
  fleetNumber: string;
  image: string;
  thumbnail: string;
  username: string;
  uploadedDate: number;
};

export type SearchRecord = {
  photoId: number;
  advertisementId: string;
  advertisement: string;
  categoryId: string;
  category: string;
  busCompany: BusCompany;
  busModelId: string;
  busModel: string;
  routeId: string;
  routeNumber: string;
  licensePlateNumber: string;
  fleetPrefix: string;
  fleetNumber: string;
  thumbnail: string;
  username: string;
  uploadedDate: number;
  tags: string[];
};

export type User = {
  username: string;
  thumbnail: string;
  registrationDate: number;
};

export type SearchPhotoFilter = {
  categoryNames?: string[];
  categoryIds?: string[];
  advertisementNames?: string[];
  advertisementIds?: string[];
  busCompanyNames?: string[];
  busModelNames?: string[];
  busModelIds?: string[];
  busRouteNumbers?: string[];
  busRouteIds?: string[];
  fleetPrefixes?: string[];
  fleetNumbers?: string[];
  licensePlateNumbers?: string[];
  uploaderNames?: string[];
  thumbnails?: string[];
  language?: string;
};

// ─── API request / response models ────────────────────────────────────────────

export type GetAdvertisementsResponse = {
  advertisements: Advertisement[];
};

export type GetBusModelsResponse = {
  busModels: BusModel[];
};

export type GetCategoriesResponse = {
  categories: Category[];
};

export type GetEntityOptionsResponse = {
  entityType: string;
  options: Record<string, string>;
};

export type GetPhotoResponse = {
  photo: Photo;
};

export type GetUsersResponse = {
  users: User[];
};

export type PutPhotoRequest = {
  advertisementId: string;
  advertisementNames: Record<string, string>;
  categoryId: string;
  categoryNames: Record<string, string>;
  busBrandId: string;
  busBrandNames: Record<string, string>;
  busModelId: string;
  busModelNames: Record<string, string>;
  busCompany: BusCompany;
  routeNumber: string;
  busRouteId: string;
  busRouteStartLocationNames: Record<string, string>;
  busRouteEndLocationNames: Record<string, string>;
  licensePlateNumber: string;
  fleetPrefix: string;
  fleetNumber: string;
  image: string;
  thumbnail: string;
  username: string;
  additionalTags?: string;
  /** If true, skip insert when a photo with the same thumbnail URL already exists */
  skipInsertionWithSameThumbnail?: boolean;
};

export type PutPhotoResponse = {
  photoId: number;
};

export type SearchPhotosResponse = {
  total: number;
  results: SearchRecord[];
  nextPageCursor: string | null;
};
