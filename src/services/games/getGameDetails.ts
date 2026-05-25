import apiClient from "../apiClient";
import type { Game, RawGame, RawScreenshot, RawMovie, RawStore } from "../../types/game";

export async function getGameDetails(id: string): Promise<Game> {
  const [
    gameRes,
    screenshotsRes,
    moviesRes,
    storesRes,
    seriesRes,
    additionsRes
  ] = await Promise.all([
    apiClient.get<RawGame>(`/games/${id}`),
    apiClient.get<{ results: RawScreenshot[] }>(`/games/${id}/screenshots`),
    apiClient.get<{ results: RawMovie[] }>(`/games/${id}/movies`),
    apiClient.get<{ results: RawStore[] }>(`/games/${id}/stores`),
    apiClient.get<{ results: { id: number; name: string; background_image: string }[] }>(`/games/${id}/game-series`),
    apiClient.get<{ results: { id: number; name: string; background_image: string }[] }>(`/games/${id}/additions`)
  ]);

  const gameData = gameRes.data;
  const screenshotsData = screenshotsRes.data;
  const moviesData = moviesRes.data;
  const storesData = storesRes.data;
  const seriesData = seriesRes.data;
  const additionsData = additionsRes.data;

  return {
    id: gameData.id,
    name: gameData.name,
    description: gameData.description_raw || "",
    description_raw: gameData.description_raw || "",
    coverUrl: gameData.background_image || "",
    background_image: gameData.background_image || "",
    background_image_additional: gameData.background_image_additional || "",
    rating: gameData.rating ?? 0,
    playtime: gameData.playtime || 0,
    metacritic: gameData.metacritic || null,
    platforms: (gameData.platforms || []).map((p) => ({
      platform: {
        id: p.platform.id,
        name: p.platform.name,
        slug: p.platform.slug || "",
      },
      released_at: p.released_at,
      requirements: p.requirements,
    })),
    released: gameData.released || "Unknown",
    genres: (gameData.genres || []).map((g) => g.name),
    website: gameData.website || null,
    screenshots: screenshotsData.results.map((s) => s.image) || [],
    trailers: moviesData.results.map((m) => m.data.max) || [],
    stores: storesData.results.map((s) => ({
      id: s.id,
      url: s.url,
      store: {
        id: s.store_id, 
        name: s.store?.name || "",
        slug: s.store?.slug || "",
        domain: s.store?.domain || ""
      }
    })),
    developers: (gameData.developers || []).map((d) => ({ id: d.id, name: d.name })),
    publishers: (gameData.publishers || []).map((p) => p.name),
    tags: (gameData.tags || []).map((t) => ({ id: t.id, name: t.name })),
    esrb_rating: gameData.esrb_rating?.name || null,
    game_series: seriesData.results.map((s) => ({
      id: s.id,
      name: s.name,
      background_image: s.background_image
    })),
    additions: additionsData.results.map((a) => ({
      id: a.id,
      name: a.name,
      background_image: a.background_image
    }))
  };
}
