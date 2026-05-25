// FILE: src/pages/CollectionPage/CollectionPage.tsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getUserCollection } from "../../services/collection/collectionService";
import type { GameStatus } from "../../services/collection/collectionService";
import { fetchGames } from "../../services/games/fetchGames";
import GameCard from "../../components/GameCard/GameCard";
import GameCardSkeleton from "../../components/GameCard/GameCardSkeleton";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./CollectionPage.module.css";
import type { Game } from "../../types/game";

const STATUS_OPTIONS: (GameStatus | "All")[] = ["All", "Playing", "Completed", "Backlog", "Wishlist", "Dropped"];

const CollectionPage: React.FC = () => {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | "All">("All");

  const { data: fullCollection = [], isLoading: loading } = useQuery({
    queryKey: ["userCollection", user?.uid],
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  const filteredCollection = useMemo(() => {
    if (selectedStatus === "All") return fullCollection;
    return fullCollection.filter(g => g.status === selectedStatus);
  }, [fullCollection, selectedStatus]);

  const topGenres = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    fullCollection.forEach(game => {
      (game.genres || []).forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);
  }, [fullCollection]);

  const { data: recommendations = [], isLoading: recLoading } = useQuery({
    queryKey: ["recommendations", topGenres],
    queryFn: async () => {
      if (topGenres.length === 0) return [];
      const genreId = topGenres[0].toLowerCase().replace(/ /g, "-");
      const data = await fetchGames(1, "-rating", "", genreId, "");
      
      const collectionIds = new Set(fullCollection.map(g => g.id));
      return data.games
        .filter(g => !collectionIds.has(g.id))
        .slice(0, 10);
    },
    enabled: fullCollection.length > 0 && topGenres.length > 0,
  });

  const getStatusCount = (status: GameStatus | "All") => {
    if (status === "All") return fullCollection.length;
    return fullCollection.filter(g => g.status === status).length;
  };

  if (!authLoading && !user) {
    navigate("/");
    return null;
  }

  if (authLoading) return null;

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

          {selectedStatus === "All" && recommendations.length > 0 && (
            <div className={styles.recommendationsSection}>
              <h2 className={styles.subtitle}>Recommended for You</h2>
              <p className={styles.recReason}>Based on your interest in {topGenres.join(", ")}</p>
              
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
