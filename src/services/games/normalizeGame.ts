import type { Game, GamePlatform, RawGame } from "../../types/game";

export const genreName = (genre: unknown) => {
  if (typeof genre === "string") return genre.trim();
  if (genre && typeof genre === "object" && "name" in genre) {
    const name = (genre as { name?: unknown }).name;
    if (typeof name === "string") return name.trim();
  }
  return "";
};

export const normalizeGame = (raw: RawGame): Game => ({
  id: raw.id,
  name: raw.name,
  description: raw.description_raw || "",
  description_raw: raw.description_raw || "",
  background_image: raw.background_image || "",
  background_image_additional: raw.background_image_additional || "",
  coverUrl: raw.background_image || "",
  rating: raw.rating ?? 0,
  ratings_count: raw.ratings_count,
  playtime: raw.playtime || 0,
  added: raw.added ?? 0,
  metacritic: raw.metacritic ?? null,
  platforms: (raw.platforms || []).map(
    (item): GamePlatform => ({
      platform: {
        id: item.platform.id,
        name: item.platform.name,
        slug: item.platform.slug || "",
      },
      released_at: item.released_at,
      requirements: item.requirements,
    }),
  ),
  released: raw.released || "",
  genres: (raw.genres || []).map(genreName).filter(Boolean),
  primaryGenre: raw.genres?.[0]?.slug
    ? { name: raw.genres[0].name, slug: raw.genres[0].slug }
    : undefined,
  tags: (raw.tags || []).map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    language: tag.language,
  })),
  esrb_rating: raw.esrb_rating?.slug || raw.esrb_rating?.name || null,
  screenshots: [],
  trailers: [],
  stores: [],
});
