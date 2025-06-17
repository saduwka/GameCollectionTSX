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
  added: raw.added ?? 0,
  platforms: raw.platforms?.map(p => ({
    platform: {
      id: p.platform.id,
      name: p.platform.name,
      slug: "", // <- slug отсутствует в RawGame, ставим пустую строку или добавь fetch отдельного Platform
    }
  })) || [],
  released: raw.released || "Unknown",
  genres: raw.genres?.map(g => g.name) || [],
  coverUrl: "", // <- добавь заполнение, если нужно
});


export const fetchGames = async (
  page = 1,
  ordering = "-rating",
  year?: string,
  genreId?: string,
  platformId?: string
): Promise<FetchGamesResponse> => {
  const cacheKey = `${page}-${ordering}-${year ?? "all"}-${genreId ?? "all"}-${platformId ?? "all"}`;
  if (gameListCache[cacheKey]) {
    return gameListCache[cacheKey];
  }

  try {
    let url = `${API_URL}?key=${API_KEY}&page=${page}&ordering=${ordering}`;
    if (year) {
      url += `&dates=${year}-01-01,${year}-12-31`;
    }
    if (genreId) {
      url += `&genres=${genreId}`;
    }
    if (platformId) {
      url += `&platforms=${platformId}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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