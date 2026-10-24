// Stage 0 (2026-10-18), probed via the live proxy:
// relaxing 21579, atmospheric 39696, cute 39733, story-rich 27268, open-world 9276,
// exploration 29229, great-soundtrack 3443, short 57992, linear 9772, singleplayer 250311,
// co-op 14412, local-co-op 6079, online-co-op 7724, local-multiplayer 14013,
// roguelike 15107, roguelite 8714, card-game 3707, turn-based 5592, difficult 14286,
// souls-like 1861, horror 49053, competitive 1320, pvp 12060, nsfw 4967,
// sexual-content 8744, nudity 8811, mmo 2285.
// steam-deck-verified has 0 games and arcade has 0, so Steam Deck is platform 4 only.
// A 40-game indie sample had 0 missing playtimes, so the time weight stays at 2.

export type Mood = "calm" | "deep" | "finish" | "coop";
export type TonightTime = 30 | 120 | 300;

export interface RecipeQuery {
  tags?: string[];
  genres?: string[];
  metacritic?: string;
  ordering: "-rating" | "-added" | "-metacritic";
}

export interface Recipe {
  queries: RecipeQuery[];
  excludeTags: string[];
  excludeGenres?: string[];
  playtimeRange?: [number, number];
}

export const RECIPES: Record<Mood, Recipe> = {
  calm: {
    queries: [
      { tags: ["relaxing", "atmospheric"], metacritic: "75,100", ordering: "-rating" },
      { tags: ["cute"], metacritic: "75,100", ordering: "-added" },
      { genres: ["puzzle", "casual", "simulation"], metacritic: "75,100", ordering: "-metacritic" },
      { tags: ["atmospheric"], genres: ["puzzle"], metacritic: "75,100", ordering: "-rating" },
    ],
    excludeTags: ["difficult", "souls-like", "horror"],
  },
  deep: {
    queries: [
      { tags: ["story-rich", "open-world"], metacritic: "80,100", ordering: "-rating" },
      { tags: ["exploration", "great-soundtrack"], metacritic: "80,100", ordering: "-added" },
      { genres: ["role-playing-games-rpg", "adventure"], metacritic: "80,100", ordering: "-metacritic" },
      { tags: ["story-rich"], metacritic: "80,100", ordering: "-added" },
    ],
    excludeGenres: ["sports", "racing"],
    excludeTags: [],
  },
  finish: {
    queries: [
      { tags: ["short", "linear"], metacritic: "75,100", ordering: "-rating" },
      { tags: ["singleplayer", "short"], metacritic: "75,100", ordering: "-added" },
      { tags: ["linear"], metacritic: "75,100", ordering: "-metacritic" },
      { genres: ["adventure", "puzzle"], metacritic: "75,100", ordering: "-rating" },
    ],
    excludeTags: ["roguelike", "roguelite", "mmo"],
    playtimeRange: [2, 12],
  },
  coop: {
    queries: [
      { tags: ["co-op", "local-co-op"], ordering: "-rating" },
      { tags: ["online-co-op"], ordering: "-added" },
      { tags: ["local-multiplayer"], ordering: "-metacritic" },
      { tags: ["local-co-op"], ordering: "-rating" },
    ],
    excludeTags: ["competitive", "pvp"],
  },
};

export const NSFW_TAGS = new Set(["nsfw", "sexual-content", "nudity"]);
export const SESSION_TAGS = new Set(["roguelike", "roguelite", "arcade", "card-game", "turn-based", "deckbuilder"]);

export type ReasonCode =
  | "time:sessional"
  | "time:evening"
  | "time:long"
  | "time:unknown"
  | `mood:${string}`
  | "quality:metacritic"
  | "quality:rating"
  | "personal:genre"
  | "shelf:backlog"
  | "shelf:age";

export interface TonightGame {
  id: number;
  name: string;
  slug: string;
  background_image: string;
  released: string;
  playtime: number;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  genres: string[];
  tags: string[];
  platforms: number[];
  score: number;
  reasons: ReasonCode[];
}

export interface RawListGame {
  id: number;
  name: string;
  slug?: string;
  background_image?: string | null;
  released?: string | null;
  playtime?: number | null;
  rating?: number | null;
  ratings_count?: number | null;
  metacritic?: number | null;
  genres?: { slug?: string; name?: string }[];
  tags?: { slug?: string; language?: string }[];
  platforms?: { platform?: { id?: number } }[];
}

const EDITION = /\b(edition|goty|definitive|complete|remastered)\b/gi;

export const includeTags = (recipe: Recipe) =>
  [...new Set(recipe.queries.flatMap((query) => query.tags ?? []))];

export const seriesKey = (name: string) =>
  name
    .split(/[:\-–]/)[0]
    .replace(EDITION, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const toCandidate = (game: RawListGame): TonightGame | null => {
  if (!game?.id || !game.name) return null;
  const tags = (game.tags ?? [])
    .map((tag) => tag.slug)
    .filter((slug): slug is string => Boolean(slug))
    .slice(0, 8);
  return {
    id: game.id,
    name: game.name,
    slug: game.slug || "",
    background_image: game.background_image || "",
    released: game.released || "",
    playtime: game.playtime ?? 0,
    rating: game.rating ?? 0,
    ratings_count: game.ratings_count ?? 0,
    metacritic: game.metacritic ?? null,
    genres: (game.genres ?? []).map((genre) => genre.slug || genre.name || "").filter(Boolean).slice(0, 8),
    tags,
    platforms: (game.platforms ?? []).map((item) => item.platform?.id).filter((id): id is number => typeof id === "number"),
    score: 0,
    reasons: [],
  };
};

export const dedupeEditions = (games: TonightGame[]) => {
  const best = new Map<string, TonightGame>();
  for (const game of games) {
    const key = seriesKey(game.name) || String(game.id);
    const current = best.get(key);
    if (!current || game.ratings_count > current.ratings_count) best.set(key, game);
  }
  return [...best.values()];
};

export const filterPool = (games: TonightGame[], recipe: Recipe) => {
  const excludedTags = new Set([...(recipe.excludeTags ?? []), ...NSFW_TAGS]);
  const excludedGenres = new Set(recipe.excludeGenres ?? []);
  const cleaned = games.filter((game) => {
    if (game.ratings_count < 50) return false;
    if (game.tags.some((tag) => excludedTags.has(tag))) return false;
    if (game.genres.some((genre) => excludedGenres.has(genre))) return false;
    if (recipe.playtimeRange && game.playtime > 0) {
      const [min, max] = recipe.playtimeRange;
      if (game.playtime < min || game.playtime > max) return false;
    }
    return true;
  });
  return dedupeEditions(cleaned);
};

export const fitsTime = (game: Pick<TonightGame, "playtime" | "tags">, minutes: TonightTime): 0 | 1 | 2 => {
  const sessional = game.tags.some((tag) => SESSION_TAGS.has(tag));
  const hours = game.playtime ?? 0;
  if (hours === 0) return 1;
  if (minutes === 30) return sessional ? 2 : hours <= 2 ? 1 : 0;
  if (minutes === 120) return hours <= 4 ? 2 : sessional || hours <= 10 ? 1 : 0;
  return hours >= 4 ? 2 : 1;
};

export const moodMatch = (game: Pick<TonightGame, "tags">, recipe: Recipe) =>
  Math.min(3, includeTags(recipe).filter((tag) => game.tags.includes(tag)).length);

export const eveningMoods = (tags: string[]): Mood[] =>
  (Object.keys(RECIPES) as Mood[]).filter((mood) => moodMatch({ tags }, RECIPES[mood]) > 0);

const qualityScore = (game: Pick<TonightGame, "metacritic" | "rating">) => {
  const metacritic = game.metacritic ?? Math.round((game.rating || 0) * 20);
  return Math.max(0, Math.min(1, (metacritic - 70) / 30));
};

export const dayJitter = (id: number, day = Math.floor(Date.now() / 86_400_000)) => {
  const mixed = Math.imul(id ^ day, 0x9e3779b1) >>> 0;
  return (mixed % 1000) / 100_000;
};

const timeReason = (game: TonightGame, minutes: TonightTime, fit: 0 | 1 | 2): ReasonCode => {
  if ((game.playtime ?? 0) === 0) return "time:unknown";
  if (minutes === 30 && fit === 2) return "time:sessional";
  if (minutes === 300 && (game.playtime ?? 0) >= 4) return "time:long";
  return "time:evening";
};

export const scoreCandidate = (
  game: TonightGame,
  recipe: Recipe,
  minutes: TonightTime,
  seen: Set<number>,
) => {
  const fit = fitsTime(game, minutes);
  if (fit === 0) return null;
  const mood = moodMatch(game, recipe);
  const quality = qualityScore(game);
  const reasons: ReasonCode[] = [timeReason(game, minutes, fit)];
  const matched = includeTags(recipe).find((tag) => game.tags.includes(tag));
  if (matched) reasons.push(`mood:${matched}`);
  reasons.push(game.metacritic ? "quality:metacritic" : "quality:rating");
  const score = fit * 2 + mood + quality - (seen.has(game.id) ? 0.5 : 0);
  return { ...game, score, reasons };
};

export const rankTonight = (
  games: TonightGame[],
  recipe: Recipe,
  minutes: TonightTime,
  options: { exclude?: number[]; seen?: number[]; day?: number; limit?: number } = {},
) => {
  const exclude = new Set(options.exclude ?? []);
  const seen = new Set(options.seen ?? []);
  return games
    .filter((game) => !exclude.has(game.id))
    .map((game) => scoreCandidate(game, recipe, minutes, seen))
    .filter((game): game is TonightGame => Boolean(game))
    .sort((a, b) => {
      const delta = b.score + dayJitter(b.id, options.day) - (a.score + dayJitter(a.id, options.day));
      if (Math.abs(delta) > 0.0001) return delta;
      return b.ratings_count - a.ratings_count;
    })
    .slice(0, options.limit ?? 20);
};

export const poolCacheKey = (mood: Mood, platforms: number[]) =>
  `tonight:pool:v1:${mood}:${[...platforms].sort((a, b) => a - b).join(",") || "all"}`;

const numbers = (value: string | null, limit: number) => {
  if (!value) return [] as number[];
  const parsed = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parsed.some((part) => !/^\d+$/.test(part))) return null;
  return parsed.slice(0, limit).map((part) => Number(part));
};

export const parseTonightQuery = (params: URLSearchParams) => {
  const mood = params.get("mood");
  const time = Number(params.get("time"));
  if (mood !== "calm" && mood !== "deep" && mood !== "finish" && mood !== "coop") return null;
  if (time !== 30 && time !== 120 && time !== 300) return null;
  const platforms = numbers(params.get("platforms"), 5);
  const exclude = numbers(params.get("exclude"), 200);
  const seen = numbers(params.get("seen"), 50);
  if (!platforms || !exclude || !seen) return null;
  return { mood: mood as Mood, time: time as TonightTime, platforms, exclude, seen };
};

export const shelfQualifies = (game: Pick<TonightGame, "tags" | "playtime">, recipe: Recipe, minutes: TonightTime) => {
  if (fitsTime(game, minutes) === 0) return false;
  if (moodMatch(game, recipe) >= 1) return true;
  if (!recipe.playtimeRange || game.playtime <= 0) return false;
  const [min, max] = recipe.playtimeRange;
  return game.playtime >= min && game.playtime <= max;
};

export interface LibraryHint {
  id: number;
  name: string;
  status: string;
  genres?: string[];
  addedAt?: number;
  tags?: string[];
  playtime?: number;
  metacritic?: number | null;
  ratings_count?: number;
  rating?: number;
  background_image?: string;
  platforms?: number[];
}

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const topGenreNames = (library: LibraryHint[]) => {
  const counts = new Map<string, number>();
  for (const game of library) {
    if (game.status === "Not Interested" || game.status === "Dropped") continue;
    for (const genre of game.genres ?? []) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
};

export const libraryCandidate = (game: LibraryHint): TonightGame => ({
  id: game.id,
  name: game.name,
  slug: "",
  background_image: game.background_image || "",
  released: "",
  playtime: game.playtime ?? 0,
  rating: game.rating ?? 0,
  ratings_count: game.ratings_count ?? 0,
  metacritic: game.metacritic ?? null,
  genres: game.genres ?? [],
  tags: game.tags ?? [],
  platforms: (game.platforms ?? []).slice(0, 12),
  score: 0,
  reasons: [],
});

const genreHit = (game: TonightGame, names: string[]) =>
  game.genres.some((genre) => names.some((name) => slug(genre).includes(slug(name)) || slug(name).includes(slug(genre))));

const onSelectedPlatform = (game: TonightGame, platformIds: number[]) =>
  platformIds.length === 0 || game.platforms.some((id) => platformIds.includes(id));

export const composeTonight = (
  catalog: TonightGame[],
  library: LibraryHint[],
  mood: Mood,
  minutes: TonightTime,
  platformIds: number[] = [],
) => {
  const recipe = RECIPES[mood];
  const favorites = topGenreNames(library);
  const personal = catalog.map((game) => {
    if (!genreHit(game, favorites)) return game;
    return { ...game, score: game.score + 1.5, reasons: [...game.reasons, "personal:genre" as ReasonCode] };
  });
  const shelf = library.filter((game) => game.status === "Backlog" || game.status === "Wishlist");
  const rankedShelf = shelf
    .map(libraryCandidate)
    .filter((game) => game.tags.length > 0 && shelfQualifies(game, recipe, minutes) && onSelectedPlatform(game, platformIds))
    .map((game) => {
      const scored = scoreCandidate(game, recipe, minutes, new Set());
      if (!scored) return null;
      return {
        ...scored,
        score: scored.score + 1,
        reasons: [...scored.reasons, "shelf:backlog" as ReasonCode, "shelf:age" as ReasonCode],
      };
    })
    .filter((game): game is TonightGame => Boolean(game))
    .sort((a, b) => b.score - a.score);

  if (rankedShelf.length > 0) {
    const ids = new Set(rankedShelf.map((game) => game.id));
    const rest = personal.filter((game) => !ids.has(game.id)).sort((a, b) => b.score - a.score);
    return { games: [...rankedShelf, ...rest], fromShelf: true, shelfMiss: false };
  }

  const owned = new Set(library.map((game) => game.id));
  return {
    games: personal.filter((game) => !owned.has(game.id)).sort((a, b) => b.score - a.score),
    fromShelf: false,
    shelfMiss: shelf.length > 0,
  };
};
