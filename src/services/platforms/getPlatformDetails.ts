import apiClient from "../apiClient";

export const getPlatformDetails = async (id: string) => {
  const { data } = await apiClient.get(`/platforms/${id}`);
  return data;
};

export const getGamesForPlatform = async (id: string, page: number = 1, genreId?: string, ordering?: string) => {
  const params: Record<string, string | number> = {
    platforms: id,
    page,
  };
  if (genreId) params.genres = genreId;
  if (ordering) params.ordering = ordering;

  const { data } = await apiClient.get("/games", { params });
  return data;
};
