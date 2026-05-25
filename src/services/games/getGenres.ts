import apiClient from "../apiClient";

export interface Genre {
  id: string;
  name: string;
}

export const getGenres = async (): Promise<Genre[]> => {
  const { data } = await apiClient.get("/genres");
  return data.results.map((genre: { id: number; name: string }) => ({
    id: genre.id.toString(),
    name: genre.name,
  }));
};
