import type { RawGame } from "../../types/game";

const API_URL = "https://api.rawg.io/api/games";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY as string;

const searchCache: Record<string, RawGame[]> = {};

export const fetchGames = async (searchQuery: string = ""): Promise<RawGame[]> => {
  if (!searchQuery.trim()) return [];
  
  if (searchCache[searchQuery]) {
    return searchCache[searchQuery];
  }

  const url = `${API_URL}?key=${API_KEY}&page_size=20&search=${encodeURIComponent(searchQuery)}`;

  const response: Response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load data");
  }

  const data: { results: RawGame[] } = await response.json();

  if (!Array.isArray(data.results)) {
    throw new Error("API response does not contain a list of games");
  }

  // Filter results to ensure they match the search query name
  const filteredResults = data.results.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  searchCache[searchQuery] = filteredResults;
  return filteredResults;
};
