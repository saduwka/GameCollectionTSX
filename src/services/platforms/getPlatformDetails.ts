const API_URL = "https://api.rawg.io/api";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;


export const getPlatformDetails = async (id: string) => {
  const response = await fetch(`${API_URL}/platforms/${id}?key=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Failed to fetch console details');
  }
  return response.json();
};

export const getGamesForPlatform = async (id: string, page: number = 1) => {
  const response = await fetch(`https://api.rawg.io/api/games?platforms=${id}&page=${page}&key=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Failed to fetch games');
  }
  return response.json();
};