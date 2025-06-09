const API_URL = "https://api.rawg.io/api/genres";
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export interface Genre {
  id: string;
  name: string;
  // другие поля, если нужны
}

export const getGenres = async (): Promise<Genre[]> => {
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results.map((genre: any) => ({
      id: genre.id.toString(),
      name: genre.name,
    }));
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
};