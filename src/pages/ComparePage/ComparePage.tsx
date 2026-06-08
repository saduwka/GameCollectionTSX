import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useComparison } from "../../context/ComparisonContext";
import { getGameDetails } from "../../services/games/getGameDetails";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from './ComparePage.module.scss';
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

const compareNumeric = (
  values: (number | null | undefined)[],
  mode: "max" | "min"
): number | null => {
  const cleaned = values.filter((v): v is number => typeof v === "number" && !isNaN(v) && v > 0);
  if (cleaned.length < 2) return null;
  return mode === "max" ? Math.max(...cleaned) : Math.min(...cleaned);
};

const ComparePage: React.FC = () => {
  const { t } = useTranslation();
  const { comparisonList, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  const ATTRIBUTES: AttributeRow[] = [
    { label: t('compare.year'), getValue: (g) => formatYear(g.released) },
    { label: t('compare.rating_rawg'), getValue: (g) => formatRating(g.rating), highlight: "max" },
    { label: "Metacritic", getValue: (g) => formatMetacritic(g.metacritic), highlight: "max" },
    { label: t('compare.playtime_avg'), getValue: (g) => formatPlaytime(g.playtime), highlight: "min" },
    { label: t('compare.genres'), getValue: (g) => formatList(g.genres) },
    { label: t('compare.platforms'), getValue: (g) => formatList((g.platforms || []).map((p) => p.platform.name)) },
    { label: t('compare.developers'), getValue: (g) => formatList((g.developers || []).map((d) => d.name)) },
    { label: t('compare.publishers'), getValue: (g) => formatList(g.publishers) },
    { label: "ESRB", getValue: (g) => g.esrb_rating || "—" },
    {
      label: t('compare.tags_count'),
      getValue: (g) => (g.tags && g.tags.length > 0 ? String(g.tags.length) : "—"),
      highlight: "max",
    },
  ];

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
      map.set(attr.label, compareNumeric(games.map((g) => {
        if (attr.label === t('compare.rating_rawg')) return g.rating;
        if (attr.label === "Metacritic") return g.metacritic ?? null;
        if (attr.label === t('compare.playtime_avg')) return g.playtime ?? null;
        if (attr.label === t('compare.tags_count')) return g.tags?.length ?? 0;
        return null;
      }), attr.highlight));
    });
    return map;
  }, [games, t]);

  const isHighlighted = (attr: AttributeRow, game: Game): boolean => {
    if (!attr.highlight) return false;
    const winner = highlights.get(attr.label);
    if (winner === null || winner === undefined) return false;
    if (attr.label === t('compare.rating_rawg')) return game.rating === winner;
    if (attr.label === "Metacritic") return game.metacritic === winner;
    if (attr.label === t('compare.playtime_avg')) return game.playtime === winner;
    if (attr.label === t('compare.tags_count')) return (game.tags?.length ?? 0) === winner;
    return false;
  };

  if (comparisonList.length === 0) {
    return (
      <div className={styles.empty}>
        <PageMeta title={t('compare.title')} description={t('compare.description')} />
        <div className={styles.emptyEmoji} aria-hidden="true">⚖️</div>
        <h1 className={styles.emptyTitle}>{t('compare.removed').split(' ')[0]} {t('common.nothing_found').toLowerCase()}</h1>
        <p className={styles.emptyMessage}>
          {t('compare.description')}
        </p>
        <button className={styles.btnPrimary} onClick={() => navigate("/games")}>
          {t('common.games')}
        </button>
      </div>
    );
  }

  if (comparisonList.length === 1) {
    return (
      <div className={styles.empty}>
        <PageMeta title={t('compare.title')} description={t('compare.description')} />
        <div className={styles.emptyEmoji} aria-hidden="true">🎮</div>
        <h1 className={styles.emptyTitle}>{t('common.game')} {t('common.searching').split(' ')[0]}</h1>
        <p className={styles.emptyMessage}>
          {t('compare.description')}
        </p>
        <button className={styles.btnPrimary} onClick={() => navigate("/games")}>
          {t('common.games')}
        </button>
      </div>
    );
  }

  const gameCountLabel = games.length === 1 ? t('common.game') : games.length < 5 ? t('common.games_plural_1') : t('common.games_plural_2');

  return (
    <div className={styles.page}>
      <PageMeta title={t('compare.title')} description={t('compare.description')} />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('compare.title')}</h1>
          <p className={styles.subtitle}>
            {games.length} {gameCountLabel} {t('common.results').toLowerCase()}
          </p>
        </div>
        <button className={styles.clearBtn} onClick={clearComparison}>
          {t('common.clear')}
        </button>
      </header>

      {hasError && (
        <div className={styles.errorBanner} role="alert">
          {t('common.error')}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.attrCol} scope="col">
                {t('common.error').charAt(0).toUpperCase() + t('common.error').slice(1)}...
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
                      aria-label={`${t('compare.removed')} ${game.name}`}
                    >
                      {t('common.clear')}
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
