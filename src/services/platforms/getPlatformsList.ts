import apiClient from "../apiClient";
import type { Platform } from "../../types/game";

/**
 * Получает список всех доступных платформ.
 * React Query будет отвечать за кеширование.
 */
export const getPlatforms = async (): Promise<Platform[]> => {
  const { data } = await apiClient.get("/platforms", {
    params: { page_size: 100 }
  });
  return data.results;
};

export const getParentPlatforms = async (): Promise<{ id: number; name: string; slug: string; platforms: Platform[] }[]> => {
  const { data } = await apiClient.get("/platforms/lists/parents");
  return data.results;
};

/**
 * Ищет платформы по названию.
 */
export const searchPlatforms = async (query: string): Promise<Platform[]> => {
  const { data } = await apiClient.get("/platforms", {
    params: { search: query }
  });
  return data.results;
};

export const getPlatformDetails = async (id: string): Promise<Platform> => {
  const { data } = await apiClient.get(`/platforms/${id}`);
  return data;
};
