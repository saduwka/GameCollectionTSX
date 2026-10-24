import apiClient from "../apiClient";
import type { Game, RawGame } from "../../types/game";
import { normalizeGame } from "../games/normalizeGame";
import { isSafeCandidate } from "../recommendations/safeCandidate";

const searchCache: Record<string, Game[]> = {};

export const fetchGames = async (searchQuery: string = ""): Promise<Game[]> => {
  if (!searchQuery.trim()) return [];

  if (searchCache[searchQuery]) {
    return searchCache[searchQuery];
  }

  const { data } = await apiClient.get<{ results: RawGame[] }>("/games", {
    params: { page_size: 20, search: searchQuery },
  });

  if (!Array.isArray(data.results)) {
    throw new Error("API response does not contain a list of games");
  }

  const filteredResults = data.results
    .filter((game) => game.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(normalizeGame)
    .filter((game) => isSafeCandidate(game));

  searchCache[searchQuery] = filteredResults;
  return filteredResults;
};
