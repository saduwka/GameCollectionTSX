import apiClient from "../apiClient";
import type { RawGame, Game, FetchGamesResponse } from "../../types/game";
import { normalizeGame } from "./normalizeGame";

export const fetchGames = async (
  page = 1,
  ordering = "-rating",
  year?: string,
  genreId?: string,
  platformId?: string,
  developerId?: string,
  tagId?: string,
  playtimeRange?: string,
  metacriticMin?: string,
  yearTo?: string
): Promise<FetchGamesResponse> => {
  const params: Record<string, string | number> = {
    page,
    page_size: 20,
    ordering,
  };

  // Год: отдельные year + yearTo (новый), либо legacy "YYYY,YYYY", либо один год
  if (year && /^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/.test(year)) {
    params.dates = year;
  } else if (year && yearTo) {
    params.dates = `${year}-01-01,${yearTo}-12-31`;
  } else if (year) {
    params.dates = year.includes(",")
      ? `${year.split(",")[0]}-01-01,${year.split(",")[1]}-12-31`
      : `${year}-01-01,${year}-12-31`;
  }
  if (genreId) params.genres = genreId;
  if (platformId) params.platforms = platformId;
  if (developerId) params.developers = developerId;
  if (tagId) params.tags = tagId;
  if (playtimeRange) params.playtime = playtimeRange;
  if (metacriticMin) params.metacritic = `${metacriticMin},100`;

  const { data } = await apiClient.get("/games", { params });

  return {
    games: data.results
      .filter((raw: RawGame) => /[A-Za-zА-Яа-яЁё]/.test(raw.name))
      .map(normalizeGame),
    nextPageUrl: data.next,
    prevPageUrl: data.previous,
    count: data.count,
  };
};

export const fetchRandomGame = async (filters: { year?: string; genre?: string; platform?: string }): Promise<Game | null> => {
  const data = await fetchGames(1, "-rating", filters.year, filters.genre, filters.platform);
  if (data.games.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * data.games.length);
  return data.games[randomIndex];
};
