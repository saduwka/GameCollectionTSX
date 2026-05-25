// FILE: src/pages/RecommendationsPage/RecommendationsPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import {
  getUserCollection,
  getUserDevices,
  addToCollection,
} from "../../services/collection/collectionService";
import { fetchGames } from "../../services/games/fetchGames";
import GameCard from "../../components/GameCard/GameCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./RecommendationsPage.module.css";
import type { Game } from "../../types/game";
import { toast } from "react-hot-toast";

interface ScoredRecommendation extends Game {
  reason: string;
  score: number;
}

interface GenreStat {
  weight: number;
  name: string;
  slug: string;
}

const slugify = (name: string) => name.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");

const STATUS_WEIGHTS: Record<string, number> = {
  Completed: 1.4,
  Playing: 1.3,
  Backlog: 0.9,
  Wishlist: 1.1,
  Dropped: 0.4,
  "Not Interested": 0,
};

const RecommendationsPage: React.FC = () => {
  const { user, authLoading } = useAuth();
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  const {
    data: recommendations = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommendations-v2", user?.uid, manualRefreshKey],
    queryFn: async () => {
      const [collection, devices] = await Promise.all([
        getUserCollection(user?.uid),
        getUserDevices(user?.uid),
      ]);

      const collectionIds = new Set(collection.map((g) => g.id));
      const notInterestedIds = new Set(
        collection.filter((g) => g.status === "Not Interested").map((g) => g.id)
      );
      const platformIds = devices.length > 0 ? devices.join(",") : "";
      const isManualRefresh = manualRefreshKey > 0;

      // Cold start: пустая коллекция -> популярное / на их платформах
      const meaningfulGames = collection.filter(
        (g) => g.status !== "Not Interested"
      );

      const candidates = new Map<number, ScoredRecommendation>();

      const addCandidate = (
        game: Game,
        addedScore: number,
        reason: string
      ) => {
        if (collectionIds.has(game.id) || notInterestedIds.has(game.id)) return;
        const existing = candidates.get(game.id);
        if (existing) {
          existing.score += addedScore;
          // Сохраняем reason с наибольшим вкладом
          if (addedScore > 0.5 && !existing.reason.includes(reason)) {
            // keep original strongest reason
          }
        } else {
          candidates.set(game.id, { ...game, score: addedScore, reason });
        }
      };

      if (meaningfulGames.length === 0) {
        // Cold start
        const ordering = isManualRefresh ? "-added" : "-rating";
        const data = await fetchGames(1, ordering, "", "", platformIds);
        data.games.forEach((g, i) => {
          addCandidate(
            g,
            1 - i * 0.02,
            platformIds ? "Популярно на вашем железе" : "Хит сообщества"
          );
        });
      } else {
        // 1) Считаем веса жанров по коллекции
        const genreStats: Record<string, GenreStat> = {};
        meaningfulGames.forEach((game) => {
          const statusW = STATUS_WEIGHTS[game.status] ?? 1;
          const ratingW = ((game.rating ?? 5) / 5) * statusW;
          (game.genres || []).forEach((genreName) => {
            const slug = slugify(genreName);
            if (!slug) return;
            if (!genreStats[slug]) {
              genreStats[slug] = { weight: 0, name: genreName, slug };
            }
            genreStats[slug].weight += ratingW;
          });
        });

        const sortedGenres = Object.values(genreStats).sort(
          (a, b) => b.weight - a.weight
        );
        const topGenres = sortedGenres.slice(0, 3);
        const totalWeight =
          topGenres.reduce((s, g) => s + g.weight, 0) || 1;

        // 2) Тянем кандидатов из топ-3 жанров, score пропорционален weight
        for (const genre of topGenres) {
          const ordering = isManualRefresh
            ? Math.random() > 0.5
              ? "-metacritic"
              : "-rating"
            : "-metacritic";
          const data = await fetchGames(1, ordering, "", genre.slug, platformIds);
          const weightShare = genre.weight / totalWeight; // 0..1
          data.games.forEach((g, i) => {
            const positionFactor = 1 - i * 0.03; // первые позиции важнее
            const rawScore =
              (1 + weightShare * 2) * positionFactor +
              (g.rating ? g.rating / 10 : 0) * 0.3;
            addCandidate(g, rawScore, `Топ в жанре ${genre.name}`);
          });
        }

        // 3) «Похоже на любимое»: берём самую высоко оценённую/Completed игру и тянем её жанр в -relevance
        const favorite = [...meaningfulGames].sort((a, b) => {
          const aw =
            (a.rating ?? 0) * (STATUS_WEIGHTS[a.status] ?? 1);
          const bw =
            (b.rating ?? 0) * (STATUS_WEIGHTS[b.status] ?? 1);
          return bw - aw;
        })[0];
        const favGenreName = favorite?.genres?.[0];
        if (favorite && favGenreName) {
          const favSlug = slugify(favGenreName);
          const data = await fetchGames(
            1,
            "-relevance",
            "",
            favSlug,
            platformIds
          );
          data.games.forEach((g, i) => {
            addCandidate(
              g,
              1.5 * (1 - i * 0.03),
              `Похоже на ${favorite.name}`
            );
          });
        }

        // 4) Добивка: тренды на их платформах, если кандидатов мало
        if (candidates.size < 12 && platformIds) {
          const data = await fetchGames(1, "-added", "", "", platformIds);
          data.games.forEach((g, i) => {
            addCandidate(
              g,
              0.6 * (1 - i * 0.02),
              "В тренде на ваших платформах"
            );
          });
        }
      }

      // 5) Сортируем по score и обрезаем
      const sorted = Array.from(candidates.values()).sort(
        (a, b) => b.score - a.score
      );

      // Лёгкая стохастика только при manual refresh: меняем местами 2 соседних кейса в первой десятке
      if (isManualRefresh && sorted.length > 4) {
        for (let i = 0; i < Math.min(sorted.length - 1, 10); i += 2) {
          if (Math.random() > 0.5) {
            [sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]];
          }
        }
      }

      return sorted.slice(0, 18);
    },
    enabled: !authLoading,
  });

  const handleRefresh = () => {
    setManualRefreshKey((prev) => prev + 1);
    toast.promise(refetch(), {
      loading: "Обновляем рекомендации...",
      success: "Рекомендации обновлены",
      error: "Не удалось обновить рекомендации",
    });
  };

  const handleNotInterested = async (e: React.MouseEvent, game: Game) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Войдите, чтобы скрывать игры");
      return;
    }

    try {
      await addToCollection({
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        genres: game.genres,
        status: "Not Interested",
      });

      refetch();
      toast.success(`${game.name} больше не будет показана`);
    } catch {
      toast.error("Не удалось выполнить действие");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>
            {!authLoading && user ? "Подобрано для вас" : "Рекомендованные игры"}
          </h1>
          <p className={styles.subtitle}>
            {!authLoading && user
              ? "На основе вашей коллекции, оценок и устройств"
              : "Войдите, чтобы получить персональные рекомендации по вашей коллекции"}
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={isRefetching || isLoading}
          aria-label="Обновить рекомендации"
        >
          {isRefetching ? "Обновляем..." : "↻ Обновить"}
        </button>
      </header>

      <LoadingErrorMessage
        loading={isLoading || authLoading}
        error={isError ? (error as Error).message : null}
        noResults={!isLoading && !authLoading && recommendations.length === 0}
        message="Добавьте больше игр в коллекцию — рекомендации станут точнее"
      />

      {!isLoading && !authLoading && recommendations.length > 0 && (
        <div className={styles.grid}>
          {recommendations.map((game) => (
            <div key={game.id} className={styles.cardWrapper}>
              <Link to={`/game/${game.id}`} className={styles.link}>
                <div className={styles.cardContainer}>
                  <GameCard game={game} />
                </div>
                <div className={styles.reasonBadge}>{game.reason}</div>
              </Link>
              <button
                className={styles.notInterestedButton}
                onClick={(e) => handleNotInterested(e, game)}
                aria-label={`Скрыть ${game.name} из рекомендаций`}
              >
                Не интересно
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
