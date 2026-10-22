import apiClient from "../apiClient";
import { updateGameMetadata, type CollectedGame } from "./collectionService";

const platformIds = (platforms?: { platform?: { id?: number } }[]) =>
  (platforms ?? []).map((item) => item.platform?.id).filter((id): id is number => typeof id === "number").slice(0, 12);

export const hydrateShelfTags = async (games: CollectedGame[]) => {
  const missing = games
    .filter((game) => (game.status === "Backlog" || game.status === "Wishlist") && (!game.tags?.length || game.platforms == null))
    .slice(0, 10);
  for (const game of missing) {
    try {
      const { data } = await apiClient.get<{
        tags?: { slug?: string }[];
        playtime?: number;
        metacritic?: number | null;
        ratings_count?: number;
        platforms?: { platform?: { id?: number } }[];
      }>(`/games/${game.id}`);
      const tags = (data.tags ?? []).map((tag) => tag.slug).filter((slug): slug is string => Boolean(slug)).slice(0, 8);
      await updateGameMetadata(game.id, {
        tags: tags.length ? tags : ["_none"],
        playtime: data.playtime || 0,
        metacritic: data.metacritic ?? null,
        ratings_count: data.ratings_count || 0,
        platforms: platformIds(data.platforms),
      });
    } catch {
      /* the next visit can retry this id */
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return missing.length;
};
