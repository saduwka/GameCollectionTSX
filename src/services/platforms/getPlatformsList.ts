import axios from "axios";

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const API_URL = "https://api.rawg.io/api/platforms";
const platformsCache: Record<string, any> = {};

export const getPlatforms = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}?key=${API_KEY}`);
    return response.data.results;
  } catch (error) {
    console.error("Error fetching platforms:", error);
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