import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getUserCollection } from "../../services/collection/collectionService";
import type { GameStatus } from "../../services/collection/collectionService";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from "../CollectionPage/CollectionPage.module.scss";
import type { Game } from "../../types/game";

const STATUS_OPTIONS: (GameStatus | "All")[] = ["All", "Playing", "Completed", "Backlog", "Wishlist", "Liked", "Dropped"];

const PublicCollectionPage: React.FC = () => {
  const { t } = useTranslation();
  const { uid } = useParams<{ uid: string }>();
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | "All">("All");

  const { data: fullCollection = [], isLoading: loading } = useQuery({
    queryKey: ["publicCollection", uid],
    queryFn: () => getUserCollection(uid!),
    enabled: !!uid,
  });

  const filteredCollection = useMemo(() => {
    if (selectedStatus === "All") return fullCollection;
    return fullCollection.filter(g => g.status === selectedStatus);
  }, [fullCollection, selectedStatus]);

  const getStatusCount = (status: GameStatus | "All") => {
    if (status === "All") return fullCollection.length;
    return fullCollection.filter(g => g.status === status).length;
  };

  return (
    <div className={styles.collectionPage}>
      <PageMeta
        title={t('collection.public_title')}
        description={t('collection.public_description')}
      />
      <h1 className={styles.title}>{t('collection.public_title')}</h1>
      <p style={{ textAlign: "center", color: "#aaa", marginBottom: "30px" }}>
        {t('common.results').split(' ')[0]} {uid?.substring(0, 8)}...
      </p>

      <div className={styles.statusFilters}>
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            className={`${styles.filterTab} ${selectedStatus === status ? styles.activeTab : ""}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status === "All" ? t('home.see_all').split(' ')[0] : status} <span className={styles.count}>{getStatusCount(status)}</span>
          </button>
        ))}
      </div>

      <LoadingErrorMessage 
        loading={loading && fullCollection.length === 0} 
        error={null} 
        noResults={!loading && filteredCollection.length === 0} 
        message={t('search.empty_state_hint').split(' ')[0] + ' ' + t('common.nothing_found').split(' ')[0].toLowerCase()} 
      />

      {loading && fullCollection.length === 0 && (
        <div className={styles.gamesGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <div className={styles.gamesGrid}>
          {filteredCollection.map((game) => {
            const gameObj: Game = {
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
              playtime: 0,
              added: 0,
              description: ""
            };
            return (
              <div key={game.id} className={styles.gameCardContainer}>
                <Link to={`/game/${game.id}`} className={styles.gameCardWrapper}>
                  <GameCard game={gameObj} />
                  {game.rating && game.rating > 0 ? (
                    <div className={styles.personalRatingBadge}>
                      ★ {game.rating}
                    </div>
                  ) : null}
                </Link>
                <div className={`${styles.statusBadge} ${styles[(game.status || "Backlog").toLowerCase()]}`}>
                  {game.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PublicCollectionPage;
