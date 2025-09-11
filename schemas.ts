// Data models
export enum ReleaseStatus {
  Released = 0,
  InProgress,
  Unavailable,
}

export enum GameVersion {
  COUNTER_STRIKE_1_6 = 0,
  COUNTER_STRIKE_2,
}

export type Category = {
  abbr: string;
  full_name: string;
  id: number;
};

export type Map = {
  category_id: number;
  download_links?: Array<string>;
  full_name: string;
  icon: string;
  id: number;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  max_players: number;
  name: string;
  progress_percentage?: number;
  release_date?: Date;
  status: ReleaseStatus;
  target_game_version: GameVersion;
  update_date: Date;
  version: string;
};

export type Statistics = {
  num_released_maps: number;
  num_in_progress_maps: number;
  num_unavailable_maps: number;
  num_tutorials: number;
};

export type Tutorial = {
  content: string;
  creation_date: Date;
  is_draft: boolean;
  hash_key: string;
  last_update_date?: Date;
  target_game_version: GameVersion;
  thumbnail: string;
  title: string;
};

export type StockDocument = {
  price: string;
  profile: {
    net_expense_ratio: string;
  };
  dividends: Array<{
    amount: string;
    ex_dividend_date: string;
  }>;
};

// API models
export type GetMapsResponse = {
  categories: Array<Category>;
  maps: Array<Partial<Map>>;
};

export type GetStatisticsResponse = {
  statistics: Statistics;
};

export type GetTutorialsResponse = {
  tutorials: Array<Tutorial>;
};

export type GetStockDataResponse = StockDocument | string;
