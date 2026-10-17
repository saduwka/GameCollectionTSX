import type { Game } from "../../types/game";
import type { CollectedGame } from "../collection/collectionService";
import { fetchGames } from "../games/fetchGames";
import type { SwipeRecord } from "../match/swipeStore";

export const PICKS_AFTER_SWIPES = 10;
export const RECOMMENDATION_STALE_TIME = 30 * 60 * 1000;

const STATUS_WEIGHTS: Record<string, number> = {
  Completed: 1.4,
  Playing: 1.3,
  Liked: 1.2,
  Wishlist: 1.1,
  Backlog: 0.9,
  Dropped: 0.4,
  "Not Interested": 0,
};

export type ReasonKey = "genre" | "platform" | "similar_to" | "trending" | "community";

export interface ScoredRecommendation extends Game {
  reasonKey: ReasonKey;
  reasonParams: { name?: string };
  score: number;
}

interface GenreStat {
  weight: number;
  name: string;
  slug: string;
}

const slugify = (name: string) => name.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");

export const effectiveRating = (rating?: number | null): number =>
  rating && rating > 0 ? rating : 5;

export async function fetchScoredRecommendations(options: {
  collection: CollectedGame[];
  swipes?: SwipeRecord[];
  platformIds?: number[];
  refreshOrdering?: boolean;
  limit?: number;
}): Promise<ScoredRecommendation[]> {
  const swipes = options.swipes ?? [];
  const collection = options.collection;
  const platformIds = options.platformIds ?? [];
  const limit = options.limit ?? 18;
  const platformParam = platformIds.length > 0 ? platformIds.join(",") : "";

  const collectionIds = new Set(collection.map((game) => game.id));
  const notInterestedIds = new Set(
    collection.filter((game) => game.status === "Not Interested").map((game) => game.id)
  );
  const swipedIds = new Set(swipes.map((swipe) => swipe.gameId));

  const excluded = (id: number) =>
    collectionIds.has(id) || notInterestedIds.has(id) || swipedIds.has(id);

  const candidates = new Map<number, ScoredRecommendation>();

  const addCandidate = (
    game: Game,
    addedScore: number,
    reasonKey: ReasonKey,
    reasonParams: { name?: string } = {}
  ) => {
    if (excluded(game.id)) return;
    const existing = candidates.get(game.id);
    if (existing) {
      existing.score += addedScore;
      return;
    }
    candidates.set(game.id, { ...game, score: addedScore, reasonKey, reasonParams });
  };

  const likedFromSwipes: CollectedGame[] = swipes
    .filter((swipe) => swipe.action === "like" && !collectionIds.has(swipe.gameId))
    .map((swipe) => ({
      id: swipe.gameId,
      name: swipe.gameName,
      background_image: swipe.background_image || "",
      genres: swipe.genres || [],
      addedAt: swipe.timestamp,
      status: "Liked",
    }));

  const meaningfulGames = [
    ...collection.filter((game) => game.status !== "Not Interested"),
    ...likedFromSwipes,
  ];

  if (meaningfulGames.length === 0) {
    const ordering = options.refreshOrdering ? "-added" : "-rating";
    const data = await fetchGames(1, ordering, "", "", platformParam);
    data.games.forEach((game, index) => {
      addCandidate(game, 1 - index * 0.02, platformParam ? "platform" : "community");
    });
  } else {
    const genreStats: Record<string, GenreStat> = {};
    meaningfulGames.forEach((game) => {
      const statusWeight = STATUS_WEIGHTS[game.status] ?? 1;
      const ratingWeight = (effectiveRating(game.rating) / 5) * statusWeight;
      (game.genres || []).forEach((genreName) => {
        const slug = slugify(genreName);
        if (!slug) return;
        if (!genreStats[slug]) {
          genreStats[slug] = { weight: 0, name: genreName, slug };
        }
        genreStats[slug].weight += ratingWeight;
      });
    });

    const topGenres = Object.values(genreStats)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    const totalWeight = topGenres.reduce((sum, genre) => sum + genre.weight, 0) || 1;

    await Promise.all(
      topGenres.map(async (genre) => {
        const ordering = options.refreshOrdering
          ? Math.random() > 0.5
            ? "-metacritic"
            : "-rating"
          : "-metacritic";
        const data = await fetchGames(1, ordering, "", genre.slug, platformParam);
        const weightShare = genre.weight / totalWeight;
        data.games.forEach((game, index) => {
          const positionFactor = 1 - index * 0.03;
          const rawScore =
            (1 + weightShare * 2) * positionFactor + (game.rating ? game.rating / 10 : 0) * 0.3;
          addCandidate(game, rawScore, "genre", { name: genre.name });
        });
      })
    );

    const favorite = [...meaningfulGames].sort((a, b) => {
      const left = effectiveRating(a.rating) * (STATUS_WEIGHTS[a.status] ?? 1);
      const right = effectiveRating(b.rating) * (STATUS_WEIGHTS[b.status] ?? 1);
      return right - left;
    })[0];

    if (favorite?.genres?.[0]) {
      const data = await fetchGames(1, "-relevance", "", slugify(favorite.genres[0]), platformParam);
      data.games.forEach((game, index) => {
        addCandidate(game, 1.5 * (1 - index * 0.03), "similar_to", { name: favorite.name });
      });
    }

    if (candidates.size < 12 && platformParam) {
      const data = await fetchGames(1, "-added", "", "", platformParam);
      data.games.forEach((game, index) => {
        addCandidate(game, 0.6 * (1 - index * 0.02), "trending");
      });
    }
  }

  const sorted = Array.from(candidates.values()).sort((a, b) => b.score - a.score);

  if (options.refreshOrdering && sorted.length > 4) {
    for (let index = 0; index < Math.min(sorted.length - 1, 10); index += 2) {
      if (Math.random() > 0.5) {
        [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
      }
    }
  }

  return sorted.slice(0, limit);
}
