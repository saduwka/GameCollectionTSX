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
  requirements?: any;
}

export interface Game {
  id: number;
  name: string;
  description: string;
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
  games: RawGame[];
  nextPageUrl: string | null;
  prevPageUrl: string | null;
}
