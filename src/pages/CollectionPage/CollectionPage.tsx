import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getUserCollection, type CollectedGame, type GameStatus } from "../../services/collection/collectionService";
import { collectionKeys } from "../../services/collection/queryKeys";
import BacklogPicker from "./BacklogPicker";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import PageMeta from "../../components/PageMeta/PageMeta";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import LoginButton from "../../components/LoginButton/LoginButton";
import { gamePath, gamesPath } from "../../seo/canonicalUrl";
import type { Game } from "../../types/game";
import styles from "./CollectionPage.module.scss";

type Segment = "playing" | "want" | "done" | "more";
type SortKey = "recent" | "rating" | "hours" | "name";

const WANT: GameStatus[] = ["Wishlist", "Backlog"];
const MORE: GameStatus[] = ["Liked", "Dropped", "Not Interested"];

const matches = (status: GameStatus, segment: Segment) => {
  if (segment === "playing") return status === "Playing";
  if (segment === "want") return WANT.includes(status);
  if (segment === "done") return status === "Completed";
  return MORE.includes(status);
};

const toCardGame = (game: CollectedGame): Game => ({
  id: game.id,
  name: game.name,
  background_image: game.background_image,
  genres: game.genres,
  coverUrl: game.background_image,
  rating: 0,
  platforms: [],
  released: "",
  screenshots: [],
  trailers: [],
  stores: [],
  playtime: game.playtime || 0,
  added: 0,
  description: "",
});

const CollectionPage = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const [segment, setSegment] = useState<Segment>("playing");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");

  const collectionQuery = useQuery({
    queryKey: collectionKeys.user(user?.uid ?? "guest"),
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });
  const collection = collectionQuery.data ?? [];

  const topGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    collection.forEach((game) => {
      (game.genres || []).forEach((genre) => {
        counts[genre] = (counts[genre] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
  }, [collection]);

  const visible = useMemo(() => {
    const filtered = collection.filter((game) => matches(game.status, segment));
    return [...filtered].sort((a, b) => {
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sort === "hours") return (b.hoursPlayed || 0) - (a.hoursPlayed || 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      return (b.addedAt || 0) - (a.addedAt || 0);
    });
  }, [collection, segment, sort]);

  const counts = {
    playing: collection.filter((game) => game.status === "Playing").length,
    want: collection.filter((game) => WANT.includes(game.status)).length,
    done: collection.filter((game) => game.status === "Completed").length,
    more: collection.filter((game) => MORE.includes(game.status)).length,
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className={styles.collectionPage}>
        <PageMeta title={t("collection.title")} description={t("collection.description")} />
        <h1 className={styles.title}>{t("collection.title")}</h1>
        <EmptyState
          title={t("collection.guest_title")}
          text={t("collection.guest_body")}
          action={<LoginButton />}
        />
      </div>
    );
  }

  return (
    <div className={styles.collectionPage}>
      <PageMeta title={t("collection.title")} description={t("collection.description")} />
      <h1 className={styles.title}>{t("collection.title")}</h1>

      <BacklogPicker collection={collection} topGenres={topGenres} />
      <p className={styles.budget}>
        {t("collection.budget", {
          count: collection.length,
          hours: Math.round(collection.reduce((sum, game) => sum + (game.hoursPlayed || game.playtime || 0), 0)),
          years: Math.max(1, Math.round(collection.reduce((sum, game) => sum + (game.hoursPlayed || game.playtime || 0), 0) / (6 * 52)) || 1),
        })}
      </p>

      <div className={styles.toolbar}>
        <div className={styles.statusFilters}>
          {(["playing", "want", "done", "more"] as Segment[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.filterTab} ${segment === item ? styles.activeTab : ""}`}
              aria-pressed={segment === item}
              onClick={() => setSegment(item)}
            >
              {t(`collection.segment_${item}`)} <span className={styles.count}>{counts[item]}</span>
            </button>
          ))}
        </div>
        <label className={styles.sort}>
          <span>{t("common.sort")}</span>
          <select className={styles.sortSelect} value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="recent">{t("collection.sort_recent")}</option>
            <option value="rating">{t("collection.sort_rating")}</option>
            <option value="hours">{t("collection.sort_hours")}</option>
            <option value="name">{t("collection.sort_name")}</option>
          </select>
        </label>
        <div className={styles.statusFilters}>
          <button type="button" className={`${styles.filterTab} ${view === "grid" ? styles.activeTab : ""}`} aria-pressed={view === "grid"} onClick={() => setView("grid")}>{t("collection.view_grid")}</button>
          <button type="button" className={`${styles.filterTab} ${view === "list" ? styles.activeTab : ""}`} aria-pressed={view === "list"} onClick={() => setView("list")}>{t("collection.view_list")}</button>
        </div>
      </div>

      {collectionQuery.isLoading && (
        <div className={styles.gamesGrid}>
          {Array.from({ length: 8 }).map((_, index) => <GameCardSkeleton key={index} />)}
        </div>
      )}
      {collectionQuery.isError && (
        <ErrorState title={t("collection.load_error")} onRetry={() => collectionQuery.refetch()} />
      )}
      {collectionQuery.isSuccess && collection.length === 0 && (
        <EmptyState
          title={t("collection.empty_title")}
          text={t("collection.empty")}
          action={
            <>
              <Button to="/match">{t("collection.empty_action")}</Button>
              <Button to={gamesPath()} variant="secondary">{t("common.catalog")}</Button>
            </>
          }
        />
      )}
      {collectionQuery.isSuccess && collection.length > 0 && (
        <div className={view === "list" ? styles.list : styles.gamesGrid}>
          {visible.map((game) => (
            <Link key={game.id} to={gamePath(game.id)}>
              <GameCard game={toCardGame(game)} variant={view === "list" ? "row" : "default"} status={game.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
