import axios from "axios";

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const API_URL = "https://api.rawg.io/api/platforms";
const platformsCache: Record<string, any> = {};
let allPlatformsCached: any[] | null = null;

/**
 * Получает список всех доступных платформ.
 * Использует кеширование и увеличенный размер страницы, чтобы получить полный список за один раз.
 */
export const getPlatforms = async (): Promise<any[]> => {
  if (allPlatformsCached) return allPlatformsCached;
  
  try {
    // RAWG имеет около 51 платформы. page_size=100 гарантирует получение всех платформ одним запросом.
    const response = await axios.get(`${API_URL}?key=${API_KEY}&page_size=100`);
    allPlatformsCached = response.data.results;
    return allPlatformsCached!;
  } catch (error) {
    console.error("Error fetching platforms:", error);
    return [];
  }
};

export const getParentPlatforms = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`https://api.rawg.io/api/platforms/lists/parents?key=${API_KEY}`);
    return response.data.results;
  } catch (error) {
    console.error("Error fetching parent platforms:", error);
    return [];
  }
};

/**
 * Ищет платформы по названию.
 * Если список всех платформ уже загружен, поиск выполняется локально.
 */
export const searchPlatforms = async (query: string): Promise<any[]> => {
  try {
    if (allPlatformsCached) {
      const q = query.toLowerCase();
      return allPlatformsCached.filter(p => p.name.toLowerCase().includes(q));
    }
    const response = await axios.get(`${API_URL}?key=${API_KEY}&search=${query}`);
    return response.data.results;
  } catch (error) {
    console.error("Error searching platforms:", error);
    return [];
  }
};

export const getPlatformDetails = async (id: string): Promise<any | null> => {
  if (platformsCache[id]) {
    return platformsCache[id];
  }

  try {
    const response = await axios.get(`${API_URL}/${id}?key=${API_KEY}`);
    platformsCache[id] = response.data;
    return response.data;
  } catch (error) {
    console.error("Error fetching platform details:", error);
    return null;
  }
};
