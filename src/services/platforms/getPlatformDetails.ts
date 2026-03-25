const API_URL = "https://api.rawg.io/api";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;


export const getPlatformDetails = async (id: string) => {
  const response = await fetch(`${API_URL}/platforms/${id}?key=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Failed to fetch console details');
  }
  return response.json();
};

export const getGamesForPlatform = async (id: string, page: number = 1, genreId?: string, ordering?: string) => {
  const url = new URL(`https://api.rawg.io/api/games`);
  url.searchParams.append('platforms', id);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('key', API_KEY);
  if (genreId) {
    url.searchParams.append('genres', genreId);
  }
  if (ordering) {
    url.searchParams.append('ordering', ordering);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch games');
  }
  return response.json();
};