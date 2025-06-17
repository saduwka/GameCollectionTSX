const API_URL = "https://api.rawg.io/api/games";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY as string;

const searchCache: Record<string, any[]> = {};

export const fetchGames = async (searchQuery: string = ""): Promise<any[]> => {
  if (searchCache[searchQuery]) {
    return searchCache[searchQuery];
  }

  const allGames: any[] = [];
  let nextUrl: string | null = `${API_URL}?key=${API_KEY}&page_size=100&search=${encodeURIComponent(searchQuery)}`;

  while (nextUrl && allGames.length < 120) {
    const response: Response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error("Failed to load data");
    }

    const data: { results: any[]; next: string | null } = await response.json();
    console.log("API response:", data);

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