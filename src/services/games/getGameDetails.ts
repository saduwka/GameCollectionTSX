import type { Game } from "../../types/game";

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

  const gameData = await gameRes.json();
  const screenshotsData = screenshotsRes.ok ? await screenshotsRes.json() : { results: [] };
  const moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
  const storesData = storesRes.ok ? await storesRes.json() : { results: [] };
  const seriesData = seriesRes.ok ? await seriesRes.json() : { results: [] };
  const additionsData = additionsRes.ok ? await additionsRes.json() : { results: [] };

  return {
    id: gameData.id,
    name: gameData.name,
    description: gameData.description_raw || "",
    description_raw: gameData.description_raw || "",
    coverUrl: gameData.background_image || "",
    background_image: gameData.background_image || "",
    background_image_additional: gameData.background_image_additional || "",
    rating: gameData.rating ?? 0,
    metacritic: gameData.metacritic || null,
    platforms: (gameData.platforms || []).map((p: any) => ({
      platform: p.platform,
      released_at: p.released_at,
      requirements: p.requirements,
    })),
    released: gameData.released || "Unknown",
    genres: (gameData.genres || []).map((g: any) => g.name),
    website: gameData.website || null,
    screenshots: screenshotsData.results.map((s: any) => s.image) || [],
    trailers: moviesData.results.map((m: any) => m.data.max) || [],
    stores: storesData.results.map((s: any) => ({
      id: s.id,
      url: s.url,
      store: {
        id: s.store_id, // Note: In stores list, it's often store_id
        name: s.store?.name || "",
        slug: s.store?.slug || "",
        domain: s.store?.domain || ""
      }
    })),
    developers: (gameData.developers || []).map((d: any) => d.name),
    publishers: (gameData.publishers || []).map((p: any) => p.name),
    tags: (gameData.tags || []).map((t: any) => t.name),
    esrb_rating: gameData.esrb_rating?.name || null,
    game_series: seriesData.results.map((s: any) => ({
      id: s.id,
      name: s.name,
      background_image: s.background_image
    })),
    additions: additionsData.results.map((a: any) => ({
      id: a.id,
      name: a.name,
      background_image: a.background_image
    }))
  };
}
