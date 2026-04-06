// FILE: src/services/games/getGameDetails.ts
import type { Game, RawGame, RawScreenshot, RawMovie, RawStore } from "../../types/game";

export async function getGameDetails(id: string): Promise<Game> {
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
  
  const gamePromise = fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);
  const screenshotsPromise = fetch(`https://api.rawg.io/api/games/${id}/screenshots?key=${API_KEY}`);
  const moviesPromise = fetch(`https://api.rawg.io/api/games/${id}/movies?key=${API_KEY}`);
  const storesPromise = fetch(`https://api.rawg.io/api/games/${id}/stores?key=${API_KEY}`);
  const seriesPromise = fetch(`https://api.rawg.io/api/games/${id}/game-series?key=${API_KEY}`);
  const additionsPromise = fetch(`https://api.rawg.io/api/games/${id}/additions?key=${API_KEY}`);

  const [gameRes, screenshotsRes, moviesRes, storesRes, seriesRes, additionsRes] = await Promise.all([
    gamePromise,
    screenshotsPromise,
    moviesPromise,
    storesPromise,
    seriesPromise,
    additionsPromise
  ]);

  if (!gameRes.ok) throw new Error(`Error fetching game details: ${gameRes.statusText}`);

  const gameData: RawGame = await gameRes.json();
  const screenshotsData: { results: RawScreenshot[] } = screenshotsRes.ok ? await screenshotsRes.json() : { results: [] };
  const moviesData: { results: RawMovie[] } = moviesRes.ok ? await moviesRes.json() : { results: [] };
  const storesData: { results: RawStore[] } = storesRes.ok ? await storesRes.json() : { results: [] };
  const seriesData: { results: { id: number; name: string; background_image: string }[] } = seriesRes.ok ? await seriesRes.json() : { results: [] };
  const additionsData: { results: { id: number; name: string; background_image: string }[] } = additionsRes.ok ? await additionsRes.json() : { results: [] };

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
