// FILE: src/pages/RecommendationsPage/RecommendationsPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { 
  getUserCollection, 
  getUserDevices,
  addToCollection
} from "../../services/collection/collectionService";
import { fetchGames } from "../../services/games/fetchGames";
import GameCard from "../../components/GameCard/GameCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./RecommendationsPage.module.css";
import type { Game } from "../../types/game";
import { toast } from "react-hot-toast";

interface RecommendedGame extends Game {
  reason: string;
}

const RecommendationsPage: React.FC = () => {
  const { user, authLoading } = useAuth();
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  const {
    data: recommendations = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
    error
  } = useQuery({
    queryKey: ["recommendations", user?.uid, manualRefreshKey],
    queryFn: async () => {
      const [collection, devices] = await Promise.all([
        getUserCollection(user?.uid),
        getUserDevices(user?.uid)
      ]);

      const collectionIds = new Set(collection.map(g => g.id));
      const notInterestedIds = new Set(collection.filter(g => g.status === "Not Interested").map(g => g.id));
      const platformIds = devices.length > 0 ? devices.join(",") : "";
      const recsMap = new Map<number, RecommendedGame>();
      
      const isManualRefresh = manualRefreshKey > 0;

      if (collection.length === 0) {
        if (devices.length > 0) {
          const data = await fetchGames(1, "-rating", "", "", platformIds);
          data.games.forEach(g => {
            if (!notInterestedIds.has(g.id)) {
              recsMap.set(g.id, { ...g, reason: "Popular on your hardware" });
            }
          });
        } else {
          const data = await fetchGames(1, "-rating");
          data.games.forEach(g => {
            recsMap.set(g.id, { ...g, reason: "Community favorite" });
          });
        }
      } else {
        const genreStats: Record<string, { weight: number, name: string }> = {};
        const meaningfulGames = collection.filter(g => g.status !== "Not Interested");
        
        if (meaningfulGames.length === 0 && collection.length > 0) {
          const data = await fetchGames(1, "-rating", "", "", platformIds);
          data.games.forEach(g => {
            if (!notInterestedIds.has(g.id)) {
              recsMap.set(g.id, { ...g, reason: "Popular on your hardware" });
            }
          });
        } else {
          meaningfulGames.forEach(game => {
            const weight = (game.rating || 5) / 5;
            (game.genres || []).forEach(genreName => {
              const slug = genreName.toLowerCase().replace(/ /g, "-");
              if (!genreStats[slug]) {
                genreStats[slug] = { weight: 0, name: genreName };
              }
              genreStats[slug].weight += weight;
            });
          });

          const sortedGenres = Object.entries(genreStats)
            .sort((a, b) => b[1].weight - a[1].weight)
            .slice(0, 3);

          for (const [slug, info] of sortedGenres) {
            const ordering = isManualRefresh ? (Math.random() > 0.5 ? "-metacritic" : "-rating") : "-metacritic";
            const data = await fetchGames(1, ordering, "", slug, platformIds);
            data.games.forEach(g => {
              if (!collectionIds.has(g.id) && !recsMap.has(g.id)) {
                recsMap.set(g.id, { ...g, reason: `Top rated ${info.name} game` });
              }
            });
          }

          const shuffledMeaningful = [...meaningfulGames].sort(() => Math.random() - 0.5);
          const topGame = isManualRefresh 
            ? shuffledMeaningful.find(g => (g.rating || 0) >= 7) || shuffledMeaningful[0]
            : [...meaningfulGames].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
            
          const topGameGenre = topGame?.genres?.[0]?.toLowerCase().replace(/ /g, "-");
          
          if (topGame && topGameGenre) {
            const data = await fetchGames(1, "-relevance", "", topGameGenre, platformIds);
            data.games.forEach(g => {
              if (!collectionIds.has(g.id) && !recsMap.has(g.id)) {
                recsMap.set(g.id, { ...g, reason: `Because you liked ${topGame.name}` });
              }
            });
          }
        }
        
        if (recsMap.size < 10 && platformIds) {
          const data = await fetchGames(1, "-added", "", "", platformIds);
          data.games.forEach(g => {
            if (!collectionIds.has(g.id) && !recsMap.has(g.id)) {
              recsMap.set(g.id, { ...g, reason: "Trending on your platforms" });
            }
          });
        }
      }

      return Array.from(recsMap.values())
        .sort(() => Math.random() - 0.5)
        .slice(0, 18);
    },
    enabled: !authLoading,
  });

  const handleRefresh = () => {
    setManualRefreshKey(prev => prev + 1);
    toast.promise(refetch(), {
      loading: "Updating recommendations...",
      success: "Recommendations updated!",
      error: "Failed to update recommendations",
    });
  };

  const handleNotInterested = async (e: React.MouseEvent, game: Game) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Sign in to filter games");
      return;
    }

    try {
      await addToCollection({
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        genres: game.genres,
        status: "Not Interested"
      });
      
      refetch();
      toast.success(`${game.name} will not be shown again`);
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>{!authLoading && user ? "Personalized for You" : "Recommended Games"}</h1>
          <p className={styles.subtitle}>
            {!authLoading && user 
              ? "Based on your collection, ratings and owned hardware" 
              : "Sign in to get personalized recommendations based on your collection"}
          </p>
        </div>
        <button 
          className={styles.refreshButton} 
          onClick={handleRefresh}
          disabled={isRefetching || isLoading}
        >
          {isRefetching ? "Updating..." : "↻ Update"}
        </button>
      </header>

      <LoadingErrorMessage 
        loading={isLoading || authLoading} 
        error={isError ? (error as Error).message : null} 
        noResults={!isLoading && !authLoading && recommendations.length === 0} 
        message="Add more games to your collection to get better recommendations!" 
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
             >
               Not interested
             </button>
           </div>
         ))}
       </div>
      )}    </div>
  );
};

export default RecommendationsPage;
