import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getUserCollection, getUserSettings, type CollectedGame, type GameStatus } from "../../services/collection/collectionService";
import { collectionKeys } from "../../services/collection/queryKeys";
import { getCollectionStats } from "../../services/collection/stats";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from "../CollectionPage/CollectionPage.module.scss";
import type { Game } from "../../types/game";

const SECTIONS: { status: GameStatus; label: "section_playing" | "section_completed" | "section_wishlist" }[] = [
  { status: "Playing", label: "section_playing" },
  { status: "Completed", label: "section_completed" },
  { status: "Wishlist", label: "section_wishlist" },
];

const isPermissionDenied = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  return code === "permission-denied";
};

const toCardGame = (game: CollectedGame): Game => ({
  id: game.id,
  name: game.name,
  background_image: game.background_image,
  genres: game.genres,
  coverUrl: game.background_image,
  rating: game.rating || 0,
  platforms: [],
  released: "",
  screenshots: [],
  trailers: [],
  stores: [],
  playtime: game.playtime || 0,
  added: 0,
  description: "",
});

const PublicCollectionPage: React.FC = () => {
  const { t } = useTranslation();
  const { uid } = useParams<{ uid: string }>();

  const settingsQuery = useQuery({
    queryKey: collectionKeys.publicSettings(uid ?? ""),
    queryFn: () => getUserSettings(uid),
    enabled: !!uid,
    retry: false,
  });

  const isPrivate = settingsQuery.data?.isPublic === false || isPermissionDenied(settingsQuery.error);
  const isMissing = settingsQuery.isSuccess && settingsQuery.data == null;
  const canLoadGames = settingsQuery.isSuccess && settingsQuery.data != null && settingsQuery.data.isPublic !== false;

  const collectionQuery = useQuery({
    queryKey: collectionKeys.publicCollection(uid ?? ""),
    queryFn: () => getUserCollection(uid!),
    enabled: canLoadGames,
    retry: false,
  });

  const collection = collectionQuery.data ?? [];
  const stats = getCollectionStats(collection);
  const ownerName = settingsQuery.data?.displayName || t("collection.public_title");
  const description = stats.topGames.length
    ? `${ownerName}: ${stats.topGames.map((game) => game.name).join(", ")}`
    : t("collection.public_description");

  const blockedMessage = isPrivate
    ? t("collection.private")
    : isMissing
      ? t("collection.not_found")
      : settingsQuery.isError
        ? t("collection.unavailable")
        : null;

  return (
    <div className={styles.collectionPage}>
      <PageMeta
        title={ownerName}
        description={description}
        image={stats.topGames[0]?.image || settingsQuery.data?.photoURL}
      />
      <h1 className={styles.title}>{ownerName}</h1>

      {settingsQuery.data && !isPrivate && (
        <div className={styles.ownerRow}>
          {settingsQuery.data.photoURL && (
            <img src={settingsQuery.data.photoURL} alt="" className={styles.ownerAvatar} />
          )}
        </div>
      )}

      <LoadingErrorMessage
        loading={settingsQuery.isLoading}
        error={blockedMessage || (collectionQuery.isError ? t("collection.unavailable") : null)}
        noResults={canLoadGames && collectionQuery.isSuccess && collection.length === 0}
        message={t("collection.empty")}
      />

      {canLoadGames && collectionQuery.isLoading && (
        <div className={styles.gamesGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </div>
      )}

      {canLoadGames && collectionQuery.isSuccess && collection.length > 0 && (
        <>
          <div className={styles.statsRow}>
            <span>{t("collection.avg_rating")}: {stats.avgRating}</span>
            <span>{t("collection.total_hours")}: {stats.totalHours}</span>
            {stats.topGenres.length > 0 && (
              <span>{t("collection.top_genres")}: {stats.topGenres.join(", ")}</span>
            )}
          </div>
          {SECTIONS.map((section) => {
            const games = collection.filter((game) => game.status === section.status);
            if (games.length === 0) return null;
            return (
              <section key={section.status}>
                <h2 className={styles.subtitle}>{t(`collection.${section.label}`)}</h2>
                <div className={styles.gamesGrid}>
                  {games.map((game) => (
                    <Link key={game.id} to={`/game/${game.id}`} className={styles.gameCardWrapper}>
                      <GameCard game={toCardGame(game)} />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
};

export default PublicCollectionPage;
