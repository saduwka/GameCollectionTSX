import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserCollection } from "../../services/collection/collectionService";
import type { CollectedGame, GameStatus } from "../../services/collection/collectionService";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "../CollectionPage/CollectionPage.module.css";

const STATUS_OPTIONS: (GameStatus | "All")[] = ["All", "Playing", "Completed", "Backlog", "Wishlist", "Dropped"];

const PublicCollectionPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [fullCollection, setFullCollection] = useState<CollectedGame[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<CollectedGame[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | "All">("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollection = async () => {
      if (uid) {
        setLoading(true);
        try {
          const data = await getUserCollection(uid);
          setFullCollection(data);
          setFilteredCollection(data);
        } catch (err) {
          console.error("Error loading public collection:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCollection();
  }, [uid]);

  useEffect(() => {
    if (selectedStatus === "All") {
      setFilteredCollection(fullCollection);
    } else {
      setFilteredCollection(fullCollection.filter(g => g.status === selectedStatus));
    }
  }, [selectedStatus, fullCollection]);

  const getStatusCount = (status: GameStatus | "All") => {
    if (status === "All") return fullCollection.length;
    return fullCollection.filter(g => g.status === status).length;
  };

  return (
    <div className={styles.collectionPage}>
      <h1 className={styles.title}>Public Collection</h1>
      <p style={{ textAlign: "center", color: "#aaa", marginBottom: "30px" }}>
        Viewing collection of user: {uid?.substring(0, 8)}...
      </p>

      <div className={styles.statusFilters}>
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            className={`${styles.filterTab} ${selectedStatus === status ? styles.activeTab : ""}`}
            onClick={() => setSelectedStatus(status)}
          >
            {status} <span className={styles.count}>{getStatusCount(status)}</span>
          </button>
        ))}
      </div>

      <LoadingErrorMessage 
        loading={loading && fullCollection.length === 0} 
        error={null} 
        noResults={!loading && filteredCollection.length === 0} 
        message="This collection is empty or private." 
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
          {filteredCollection.map((game) => (
            <div key={game.id} className={styles.gameCardContainer}>
              <Link to={`/game/${game.id}`} className={styles.gameCardWrapper}>
                <GameCard game={{ ...game, coverUrl: game.background_image, rating: game.rating || 0, platforms: [], released: "", screenshots: [], trailers: [], stores: [] } as any} />
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicCollectionPage;
