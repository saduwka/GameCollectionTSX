import apiClient from "../apiClient";
import type { RawGame } from "../../types/game";

const searchCache: Record<string, RawGame[]> = {};

export const fetchGames = async (searchQuery: string = ""): Promise<RawGame[]> => {
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

  const filteredResults = data.results.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  searchCache[searchQuery] = filteredResults;
  return filteredResults;
};
