export interface Platform {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
  description: string;
  image: string | null;
  year_start: number | null;
  year_end: number | null;
}

export interface GamePlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
  released_at?: string;
  requirements?: {
    minimum?: string;
    recommended?: string;
  };
}

export interface GameStore {
  id: number;
  url: string;
  store: {
    id: number;
    name: string;
    slug: string;
    domain: string;
  };
}

export interface Game {
  id: number;
  name: string;
  description: string;
  description_raw?: string;
  background_image: string;
  background_image_additional?: string;
  coverUrl: string;
  rating: number;
  platforms: GamePlatform[];
  released: string;
  genres: string[];
  metacritic?: number | null;
  website?: string | null;
  added?: number;
  screenshots: string[];
  trailers: string[];
  stores: GameStore[];
  developers?: string[];
  publishers?: string[];
  tags?: string[];
  esrb_rating?: string | null;
  game_series?: { id: number; name: string; background_image: string }[];
  additions?: { id: number; name: string; background_image: string }[];
}

export interface RawGame {
  id: number;
  name: string;
  description_raw: string;
  background_image: string;
  rating: number;
  released: string;
  metacritic?: number | null;
  added?: number;
  platforms: {
    platform: {
      id: number;
      name: string;
    };
  }[];
  genres: {
    id: number;
    name: string;
  }[];
}

export interface FetchGamesResponse {
  games: Game[];
  nextPageUrl: string | null;
  prevPageUrl: string | null;
}
