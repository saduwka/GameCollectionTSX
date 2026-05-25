// FILE: src/services/match/feedAlgorithm.ts
// Алгоритм подбора следующих карточек для свайпа.
// Реактивный: учится на последних N свайпах, сдвигая выдачу к жанрам/тегам, которые юзер лайкает.

import type { Game } from "../../types/game";
import type { SwipeRecord } from "./swipeStore";

const RECENT_SWIPES_WINDOW = 15;
const LIKE_WEIGHT = 1;
const DISLIKE_WEIGHT = -1.5; // дизлайк весит больше — пользователь явно говорит "нет"
const RANDOM_NOISE = 0.15; // чтобы не приелось — лёгкая случайность

export interface GenreScore {
  [genre: string]: number;
}

/**
 * Считает веса жанров и тегов по последним N свайпам.
 * Используется и для подбора, и для будущего "профиля вкуса".
 */
export const computeTasteProfile = (swipes: SwipeRecord[]): {
  genreScores: GenreScore;
  tagScores: GenreScore;
} => {
  const recent = swipes.slice(0, RECENT_SWIPES_WINDOW);
  const genreScores: GenreScore = {};
  const tagScores: GenreScore = {};

  for (const swipe of recent) {
    const weight = swipe.action === "like" ? LIKE_WEIGHT : DISLIKE_WEIGHT;
    for (const g of swipe.genres) {
      genreScores[g] = (genreScores[g] || 0) + weight;
    }
    for (const t of swipe.tags) {
      tagScores[t] = (tagScores[t] || 0) + weight;
    }
  }

  return { genreScores, tagScores };
};

/**
 * Считает score для одной игры на основе профиля вкуса.
 * Чем выше — тем сильнее должна быть показана.
 */
const scoreGame = (
  game: Game,
  genreScores: GenreScore,
  tagScores: GenreScore
): number => {
  let score = 0;

  // Базовый рейтинг RAWG как floor — чтобы не показывать совсем мусор
  score += (game.rating || 0) * 0.5;

  // Бонус за совпадение жанров
  for (const g of game.genres || []) {
    score += genreScores[g] || 0;
  }

  // Бонус за совпадение тегов (если есть)
  const gameTags = (game as Game & { tags?: { name: string }[] }).tags;
  if (gameTags) {
    for (const t of gameTags) {
      score += (tagScores[t.name] || 0) * 0.5; // теги весят вдвое меньше жанров
    }
  }

  // Случайность для разнообразия
  score += (Math.random() - 0.5) * RANDOM_NOISE * 2;

  return score;
};

/**
 * Принимает пул игр и историю свайпов — возвращает отсортированный по релевантности список.
 * Уже свайпнутые игры исключаются.
 */
export const rankFeed = (
  pool: Game[],
  swipes: SwipeRecord[],
  excludeIds: Set<number> = new Set()
): Game[] => {
  const swipedIds = new Set(swipes.map((s) => s.gameId));
  const blocked = new Set([...swipedIds, ...excludeIds]);

  const candidates = pool.filter(
    (g) => !blocked.has(g.id) && g.background_image // отсеиваем без обложек — некрасиво
  );

  const { genreScores, tagScores } = computeTasteProfile(swipes);

  // Если профиля ещё нет (новичок) — отдаём по rating + лёгкой случайности
  const hasProfile =
    Object.keys(genreScores).length > 0 || Object.keys(tagScores).length > 0;

  if (!hasProfile) {
    return [...candidates].sort(
      (a, b) =>
        (b.rating || 0) - (a.rating || 0) + (Math.random() - 0.5) * 0.5
    );
  }

  return [...candidates].sort(
    (a, b) => scoreGame(b, genreScores, tagScores) - scoreGame(a, genreScores, tagScores)
  );
};

/**
 * Топ-3 жанра по позитивному score. Для отображения "профиля вкуса".
 */
export const getTopGenres = (swipes: SwipeRecord[], limit = 3): string[] => {
  const { genreScores } = computeTasteProfile(swipes);
  return Object.entries(genreScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([genre]) => genre);
};
