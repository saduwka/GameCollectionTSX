// FILE: src/services/match/feedAlgorithm.ts
// Алгоритм подбора следующих карточек для свайпа.
// Реактивный: учится на последних N свайпах, сдвигая выдачу к жанрам/тегам, которые юзер лайкает.

import type { Game } from "../../types/game";
import type { SwipeRecord } from "./swipeStore";

const RECENT_SWIPES_WINDOW = 20;
const LIKE_WEIGHT = 1.2;
const DISLIKE_WEIGHT = -2.5; // дизлайк весит значительно больше
const RANDOM_NOISE = 0.1; // чуть меньше случайности для более точного соответствия

export interface GenreScore {
  [genre: string]: number;
}

/**
 * Считает веса жанров и тегов по последним N свайпам.
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
 */
const scoreGame = (
  game: Game,
  genreScores: GenreScore,
  tagScores: GenreScore
): number => {
  let score = 0;

  // Базовый рейтинг RAWG и Metacritic как основа качества
  const qualityScore = (game.rating || 0) * 0.4 + (game.metacritic ? game.metacritic / 20 : 0);
  score += qualityScore;

  // Бонус за совпадение жанров
  for (const g of game.genres || []) {
    score += genreScores[g] || 0;
  }

  // Бонус за совпадение тегов (теперь весят больше)
  const gameTags = (game as Game & { tags?: { name: string }[] }).tags;
  if (gameTags) {
    for (const t of gameTags) {
      score += (tagScores[t.name] || 0) * 0.8;
    }
  }

  // Случайность для разнообразия
  score += (Math.random() - 0.5) * RANDOM_NOISE;

  return score;
};

/**
 * Принимает пул игр и историю свайпов — возвращает отсортированный по релевантности список.
 * Включает жесткую фильтрацию качества.
 */
export const rankFeed = (
  pool: Game[],
  swipes: SwipeRecord[],
  excludeIds: Set<number> = new Set()
): Game[] => {
  const swipedIds = new Set(swipes.map((s) => String(s.gameId)));
  const excludedStrings = new Set(Array.from(excludeIds).map((id) => String(id)));
  
  // ФИЛЬТРАЦИЯ КАЧЕСТВА
  const candidates = pool.filter(
    (g) => {
      const gIdStr = String(g.id);
      
      // Базовые проверки
      if (swipedIds.has(gIdStr) || excludedStrings.has(gIdStr) || !g.background_image) {
        return false;
      }

      // Проверка качества: рейтинг не ниже 3.0 (если есть) и наличие отзывов
      const minRating = g.rating || 0;
      if (minRating > 0 && minRating < 2.5) return false; // Совсем плохие игры не берем
      
      return true;
    }
  );

  const { genreScores, tagScores } = computeTasteProfile(swipes);
  const hasProfile = Object.keys(genreScores).length > 0 || Object.keys(tagScores).length > 0;

  if (!hasProfile) {
    // Для новичков: приоритет играм с Metacritic и высоким рейтингом
    return [...candidates].sort(
      (a, b) => {
        const scoreA = (a.rating || 0) + (a.metacritic ? a.metacritic / 20 : 0);
        const scoreB = (b.rating || 0) + (b.metacritic ? b.metacritic / 20 : 0);
        return scoreB - scoreA + (Math.random() - 0.5) * 0.2;
      }
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
