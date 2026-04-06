// FILE: src/services/search/searchServices.ts
import type { RawGame } from "../../types/game";

const API_URL = "https://api.rawg.io/api/games";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY as string;

const searchCache: Record<string, RawGame[]> = {};

export const fetchGames = async (searchQuery: string = ""): Promise<RawGame[]> => {
  if (searchCache[searchQuery]) {
    return searchCache[searchQuery];
  }

  const allGames: RawGame[] = [];
  let nextUrl: string | null = `${API_URL}?key=${API_KEY}&page_size=100&search=${encodeURIComponent(searchQuery)}`;

  while (nextUrl && allGames.length < 120) {
    const response: Response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error("Failed to load data");
    }

    const data: { results: RawGame[]; next: string | null } = await response.json();

    if (Array.isArray(data.results)) {
      allGames.push(...data.results);
      nextUrl = data.next;
    } else {
      throw new Error("API response does not contain a list of games");
    }
  }

  searchCache[searchQuery] = allGames.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return searchCache[searchQuery];
};
