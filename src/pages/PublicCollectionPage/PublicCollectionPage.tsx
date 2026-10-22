import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getUserCollection, getPublicProfile, type CollectedGame } from "../../services/collection/collectionService";
import { collectionKeys } from "../../services/collection/queryKeys";
import { getCollectionStats } from "../../services/collection/stats";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import PageMeta from "../../components/PageMeta/PageMeta";
import Ticket from "../../components/ui/Ticket";
import styles from "../CollectionPage/CollectionPage.module.scss";
import { gamePath } from "../../seo/canonicalUrl";
import type { Game } from "../../types/game";

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
    queryFn: () => getPublicProfile(uid),
    enabled: !!uid,
    retry: false,
  });

  const canLoadGames = settingsQuery.isSuccess && settingsQuery.data?.isPublic === true;
  const isBlocked = !settingsQuery.isLoading && !canLoadGames && (!!uid);

  const collectionQuery = useQuery({
    queryKey: collectionKeys.publicCollection(uid ?? ""),
    queryFn: () => getUserCollection(uid!),
    enabled: canLoadGames,
    retry: false,
  });

  const collection = collectionQuery.data ?? [];
  const stats = getCollectionStats(collection);
  const ownerName = (canLoadGames && settingsQuery.data?.displayName) || t("collection.public_title");
  const description = stats.topGames.length
    ? `${ownerName}: ${stats.topGames.map((game) => game.name).join(", ")}`
    : t("collection.public_description");

  const blockedMessage = isBlocked ? t("collection.private") : null;

  return (
    <div className={styles.collectionPage}>
      <PageMeta
        title={ownerName}
        description={description}
        image={stats.topGames[0]?.image || settingsQuery.data?.photoURL}
      />
      <Ticket
        heading="h1"
        kicker={t("collection.public_title")}
        title={ownerName}
        meta={canLoadGames ? (
          <span>
            {t("collection.public_summary", {
              done: collection.filter((game) => game.status === "Completed").length,
              planned: collection.filter((game) => game.status === "Wishlist" || game.status === "Backlog").length,
              hours: stats.totalHours,
            })}
          </span>
        ) : undefined}
        foot={
          <span className={styles.coverRow}>
            {stats.topGames.slice(0, 3).map((game) => (
              game.image ? <img key={game.name} src={game.image} alt="" className={styles.coverThumb} /> : null
            ))}
          </span>
        }
      />

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
          {([
            { key: "segment_playing", statuses: ["Playing"] as const },
            { key: "segment_want", statuses: ["Wishlist", "Backlog"] as const },
            { key: "segment_done", statuses: ["Completed"] as const },
            { key: "segment_more", statuses: ["Liked", "Dropped", "Not Interested"] as const },
          ]).map((section) => {
            const games = collection.filter((game) => (section.statuses as readonly string[]).includes(game.status));
            if (games.length === 0) return null;
            return (
              <section key={section.key}>
                <h2 className={styles.subtitle}>{t(`collection.${section.key}`)}</h2>
                <div className={styles.gamesGrid}>
                  {games.map((game) => (
                    <Link key={game.id} to={gamePath(game.id)} className={styles.gameCardWrapper}>
                      <GameCard game={toCardGame(game)} status={game.status} />
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
