import type { Game } from "../../types/game";

export async function getGameDetails(id: string): Promise<Game> {
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
  const res = await fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`);

  if (!res.ok) {
    throw new Error(`Error fetching game details: ${res.statusText}`);
  }

  const game = await res.json();

  return {
    id: game.id,
    name: game.name,
    description: game.description_raw || "",
    coverUrl: game.background_image || "",
    background_image: game.background_image || "",
    background_image_additional: game.background_image_additional || "",
    rating: game.rating ?? 0,
    metacritic: game.metacritic || null,
    platforms: (game.platforms || []).map((p: any) => ({
      platform: p.platform,
      released_at: p.released_at,
      requirements: p.requirements,
    })),
    released: game.released || "Unknown",
    genres: (game.genres || []).map((g: any) => g),
    website: game.website || null,
  };
}