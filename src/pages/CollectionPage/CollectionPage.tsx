import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { getUserCollection } from "../../services/collection/collectionService";
import type { CollectedGame, GameStatus } from "../../services/collection/collectionService";
import { fetchGames } from "../../services/games/fetchGames";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./CollectionPage.module.css";
import type { Game } from "../../types/game";

const STATUS_OPTIONS: (GameStatus | "All")[] = ["All", "Playing", "Completed", "Backlog", "Wishlist", "Dropped"];

const CollectionPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [fullCollection, setFullCollection] = useState<CollectedGame[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<CollectedGame[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | "All">("All");
  
  const [recommendations, setRecommendations] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && !loading) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate, loading]);

  useEffect(() => {
    const loadCollection = async () => {
      if (user) {
        setLoading(true);
        try {
          const data = await getUserCollection();
          setFullCollection(data);
          setFilteredCollection(data);
          if (data.length > 0) {
            loadRecommendations(data);
          }
        } catch (err) {
          console.error("Error loading collection:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadCollection();
  }, [user]);

  useEffect(() => {
    if (selectedStatus === "All") {
      setFilteredCollection(fullCollection);
    } else {
      setFilteredCollection(fullCollection.filter(g => g.status === selectedStatus));
    }
  }, [selectedStatus, fullCollection]);

  const loadRecommendations = async (userCollection: CollectedGame[]) => {
    setRecLoading(true);
    try {
      const genreCounts: Record<string, number> = {};
      userCollection.forEach(game => {
        (game.genres || []).forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });

      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(entry => entry[0]);

      if (topGenres.length > 0 && topGenres[0]) {
        const genreId = topGenres[0].toLowerCase().replace(/ /g, "-");
        const data = await fetchGames(1, "-rating", "", genreId, "");
        
        const collectionIds = new Set(userCollection.map(g => g.id));
        const filteredRecs = data.games
          .filter(g => !collectionIds.has(g.id))
          .slice(0, 10);
          
        setRecommendations(filteredRecs);
      }
    } catch (err) {
      console.error("Error loading recommendations:", err);
    } finally {
      setRecLoading(false);
    }
  };

  const getStatusCount = (status: GameStatus | "All") => {
    if (status === "All") return fullCollection.length;
    return fullCollection.filter(g => g.status === status).length;
  };

  if (!user && !loading) return null;

  return (
    <div className={styles.collectionPage}>
      <h1 className={styles.title}>My Collection</h1>

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
        message={selectedStatus === "All" ? "Your collection is empty." : `No games with status "${selectedStatus}".`} 
      />

      {loading && fullCollection.length === 0 && (
        <div className={styles.gamesGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <>
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

          {selectedStatus === "All" && recommendations.length > 0 && (
            <div className={styles.recommendationsSection}>
              <h2 className={styles.subtitle}>Recommended for You</h2>
              <p className={styles.recReason}>Based on your interest in {fullCollection[0]?.genres.join(", ")}</p>
              
              {recLoading ? (
                <p>Finding games you might like...</p>
              ) : (
                <div className={styles.gamesGrid}>
                  {recommendations.map((game) => (
                    <Link key={game.id} to={`/game/${game.id}`} className={styles.gameCardWrapper}>
                      <GameCard game={game} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CollectionPage;
