const API_URL = "https://api.rawg.io/api/games";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

import type { RawGame, Game, FetchGamesResponse } from "../../types/game";

const gameListCache: Record<string, FetchGamesResponse> = {};

const mapRawGameToGame = (raw: RawGame): Game => ({
  id: raw.id,
  name: raw.name,
  description: raw.description_raw || "",
  background_image: raw.background_image || "",
  rating: raw.rating ?? 0,
  playtime: raw.playtime || 0,
  added: raw.added ?? 0,
  platforms: raw.platforms?.map(p => ({
    platform: {
      id: p.platform.id,
      name: p.platform.name,
      slug: p.platform.slug || "",
    }
  })) || [],
  released: raw.released || "Unknown",
  genres: raw.genres?.map(g => g.name) || [],
  coverUrl: raw.background_image || "",
  screenshots: [],
  trailers: [],
  stores: []
});

export const fetchGames = async (
  page = 1,
  ordering = "-rating",
  year?: string,
  genreId?: string, // Можно передавать через запятую для мультиселекта
  platformId?: string,
  developerId?: string,
  tagId?: string,
  playtimeRange?: string // "0,10", "10,30", "30,100"
): Promise<FetchGamesResponse> => {
  const cacheKey = `${page}-${ordering}-${year ?? "all"}-${genreId ?? "all"}-${platformId ?? "all"}-${developerId ?? "all"}-${tagId ?? "all"}-${playtimeRange ?? "all"}`;
  if (gameListCache[cacheKey]) {
    return gameListCache[cacheKey];
  }

  try {
    let url = `${API_URL}?key=${API_KEY}&page=${page}&page_size=20`;
    if (ordering) url += `&ordering=${ordering}`;
    if (year) {
      // Поддержка диапазона лет или одного года
      url += year.includes(",") ? `&dates=${year.split(",")[0]}-01-01,${year.split(",")[1]}-12-31` : `&dates=${year}-01-01,${year}-12-31`;
    }
    if (genreId) url += `&genres=${genreId}`;
    if (platformId) url += `&platforms=${platformId}`;
    if (developerId) url += `&developers=${developerId}`;
    if (tagId) url += `&tags=${tagId}`;
    if (playtimeRange) url += `&playtime=${playtimeRange}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const result: FetchGamesResponse = {
      games: data.results
        .filter((raw: RawGame) => /[A-Za-zА-Яа-яЁё]/.test(raw.name))
        .map(mapRawGameToGame),
      nextPageUrl: data.next,
      prevPageUrl: data.previous,
    };

    gameListCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error("Error fetching games:", error);
    return { games: [], nextPageUrl: null, prevPageUrl: null };
  }
};

export const fetchRandomGame = async (filters: any): Promise<Game | null> => {
  // Получаем первую страницу с учетом фильтров, чтобы узнать общее кол-во
  const data = await fetchGames(1, "-rating", filters.year, filters.genre, filters.platform);
  if (data.games.length === 0) return null;
  
  // RAWG не дает честный random по API, поэтому берем случайную игру из первых 20
  const randomIndex = Math.floor(Math.random() * data.games.length);
  return data.games[randomIndex];
};
