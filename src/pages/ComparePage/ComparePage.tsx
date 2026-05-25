// FILE: src/pages/ComparePage/ComparePage.tsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useComparison } from "../../context/ComparisonContext";
import { getGameDetails } from "../../services/games/getGameDetails";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import styles from "./ComparePage.module.css";
import type { Game } from "../../types/game";

interface AttributeRow {
  label: string;
  getValue: (game: Game) => React.ReactNode;
  highlight?: "max" | "min";
}

const formatRating = (rating: number): string => (rating ? rating.toFixed(2) : "—");
const formatPlaytime = (hours?: number): string => (hours ? `${hours} ч` : "—");
const formatYear = (released: string): string => {
  if (!released || released === "Unknown") return "—";
  const year = released.split("-")[0];
  return year || "—";
};
const formatList = (items: string[] | undefined, max = 4): string => {
  if (!items || items.length === 0) return "—";
  const head = items.slice(0, max).join(", ");
  return items.length > max ? `${head}…` : head;
};
const formatMetacritic = (score: number | null | undefined): React.ReactNode => {
  if (score === null || score === undefined) return "—";
  const color = score >= 75 ? "#6bcb77" : score >= 50 ? "#ffd93d" : "#ff6b6b";
  return <span style={{ color, fontWeight: 700 }}>{score}</span>;
};

const ATTRIBUTES: AttributeRow[] = [
  { label: "Год выхода", getValue: (g) => formatYear(g.released) },
  { label: "Рейтинг RAWG", getValue: (g) => formatRating(g.rating), highlight: "max" },
  { label: "Metacritic", getValue: (g) => formatMetacritic(g.metacritic), highlight: "max" },
  { label: "Среднее время прохождения", getValue: (g) => formatPlaytime(g.playtime), highlight: "min" },
  { label: "Жанры", getValue: (g) => formatList(g.genres) },
  { label: "Платформы", getValue: (g) => formatList((g.platforms || []).map((p) => p.platform.name)) },
  { label: "Разработчики", getValue: (g) => formatList((g.developers || []).map((d) => d.name)) },
  { label: "Издатели", getValue: (g) => formatList(g.publishers) },
  { label: "ESRB", getValue: (g) => g.esrb_rating || "—" },
  {
    label: "Тегов",
    getValue: (g) => (g.tags && g.tags.length > 0 ? String(g.tags.length) : "—"),
    highlight: "max",
  },
];

const compareNumeric = (
  values: (number | null | undefined)[],
  mode: "max" | "min"
): number | null => {
  const cleaned = values.filter((v): v is number => typeof v === "number" && !isNaN(v) && v > 0);
  if (cleaned.length < 2) return null;
  return mode === "max" ? Math.max(...cleaned) : Math.min(...cleaned);
};

const ComparePage: React.FC = () => {
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  const detailQueries = useQueries({
    queries: comparisonList.map((game) => ({
      queryKey: ["gameDetails", game.id],
      queryFn: () => getGameDetails(String(game.id)),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const games: Game[] = useMemo(
    () =>
      detailQueries.map((q, i) => q.data ?? comparisonList[i]).filter(Boolean) as Game[],
    [detailQueries, comparisonList]
  );

  const isLoading = detailQueries.some((q) => q.isLoading);
  const hasError = detailQueries.some((q) => q.isError);

  const highlights = useMemo(() => {
    const map = new Map<string, number | null>();
    if (games.length < 2) return map;
    ATTRIBUTES.forEach((attr) => {
      if (!attr.highlight) return;
      if (attr.label === "Рейтинг RAWG") {
        map.set(attr.label, compareNumeric(games.map((g) => g.rating), attr.highlight));
      } else if (attr.label === "Metacritic") {
        map.set(attr.label, compareNumeric(games.map((g) => g.metacritic ?? null), attr.highlight));
      } else if (attr.label === "Среднее время прохождения") {
        map.set(attr.label, compareNumeric(games.map((g) => g.playtime ?? null), attr.highlight));
      } else if (attr.label === "Тегов") {
        map.set(attr.label, compareNumeric(games.map((g) => g.tags?.length ?? 0), attr.highlight));
      }
    });
    return map;
  }, [games]);

  const isHighlighted = (attr: AttributeRow, game: Game): boolean => {
    if (!attr.highlight) return false;
    const winner = highlights.get(attr.label);
    if (winner === null || winner === undefined) return false;
    if (attr.label === "Рейтинг RAWG") return game.rating === winner;
    if (attr.label === "Metacritic") return game.metacritic === winner;
    if (attr.label === "Среднее время прохождения") return game.playtime === winner;
    if (attr.label === "Тегов") return (game.tags?.length ?? 0) === winner;
    return false;
  };

  if (comparisonList.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyEmoji} aria-hidden="true">⚖️</div>
        <h1 className={styles.emptyTitle}>Сравнивать пока нечего</h1>
        <p className={styles.emptyMessage}>
          Добавьте от 2 до 4 игр в сравнение с карточек игр или из деталей. Они появятся
          здесь рядом.
        </p>
        <button className={styles.btnPrimary} onClick={() => navigate("/games")}>
          Перейти к играм
        </button>
      </div>
    );
  }

  if (comparisonList.length === 1) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyEmoji} aria-hidden="true">🎮</div>
        <h1 className={styles.emptyTitle}>Нужна ещё хотя бы одна игра</h1>
        <p className={styles.emptyMessage}>
          В сравнении сейчас только «{comparisonList[0].name}». Добавьте ещё одну, чтобы
          увидеть отличия.
        </p>
        <button className={styles.btnPrimary} onClick={() => navigate("/games")}>
          Найти другую игру
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Сравнение игр</h1>
          <p className={styles.subtitle}>
            {games.length} {games.length === 1 ? "игра" : games.length < 5 ? "игры" : "игр"}{" "}
            рядом. Лучшие показатели подсвечены.
          </p>
        </div>
        <button className={styles.clearBtn} onClick={clearComparison}>
          Очистить сравнение
        </button>
      </header>

      {hasError && (
        <div className={styles.errorBanner} role="alert">
          Не удалось загрузить часть данных. Показываем то, что есть.
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.attrCol} scope="col">
                Параметр
              </th>
              {games.map((game) => (
                <th key={game.id} className={styles.gameCol} scope="col">
                  <div className={styles.gameHeader}>
                    <Link to={`/game/${game.id}`} className={styles.gameImageLink}>
                      <img
                        src={game.background_image || game.coverUrl}
                        alt={game.name}
                        className={styles.gameImage}
                        loading="lazy"
                      />
                    </Link>
                    <Link to={`/game/${game.id}`} className={styles.gameName}>
                      {game.name}
                    </Link>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromComparison(game.id)}
                      aria-label={`Убрать ${game.name} из сравнения`}
                    >
                      Убрать
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={games.length + 1} className={styles.loadingRow}>
                  <div className={styles.skeletonRow}>
                    {games.map((_, i) => (
                      <GameCardSkeleton key={i} />
                    ))}
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              ATTRIBUTES.map((attr) => (
                <tr key={attr.label}>
                  <th className={styles.attrCell} scope="row">
                    {attr.label}
                  </th>
                  {games.map((game) => (
                    <td
                      key={game.id}
                      className={`${styles.valueCell} ${
                        isHighlighted(attr, game) ? styles.winnerCell : ""
                      }`}
                    >
                      {attr.getValue(game)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
