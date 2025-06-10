import type { Game } from "../../types/game";

export async function getPopularGames(): Promise<Game[]> {
  const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
  const res = await fetch(`https://api.rawg.io/api/games?ordering=-rating&page_size=10&key=${API_KEY}`);

  if (!res.ok) {
    throw new Error(`Error fetching popular games: ${res.statusText}`);
  }

  const data = await res.json();

  return data.results.map((game: any) => ({
    id: game.id,
    name: game.name,
    description: game.description_raw || "",
    coverUrl: game.background_image || "",
    background_image: game.background_image || "",
    background_image_additional: game.background_image_additional || "",
    rating: game.rating ?? 0,
    platforms: (game.platforms || []).map((p: any) => ({
      platform: {
        id: p.platform.id,
        name: p.platform.name,
        slug: p.platform.slug || "", // добавляем, чтобы тип соответствовал
      },
      released_at: p.released_at,
      requirements: p.requirements,
    })),
    released: game.released || "Unknown",
    genres: (game.genres || []).map((g: any) => g.name),
    metacritic: game.metacritic ?? null,
    website: game.website || null,
    added: game.added ?? 0,
  }));
}
