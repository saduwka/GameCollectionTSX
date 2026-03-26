import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { 
  getUserCollection, 
  getUserDevices 
} from "../../services/collection/collectionService";
import { fetchGames } from "../../services/games/fetchGames";
import GameCard from "../../components/GameCard/GameCard";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./RecommendationsPage.module.css";
import type { Game } from "../../types/game";

interface RecommendedGame extends Game {
  reason: string;
}

const RecommendationsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser && !loading) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate, loading]);

  useEffect(() => {
    const generateRecommendations = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [collection, devices] = await Promise.all([
          getUserCollection(),
          getUserDevices()
        ]);

        if (collection.length === 0) {
          setRecommendations([]);
          setLoading(false);
          return;
        }

        const collectionIds = new Set(collection.map(g => g.id));
        const platformIds = devices.length > 0 ? devices.join(",") : "";
        
        // Алгоритм:
        // 1. Берем игры с самым высоким личным рейтингом
        const topRated = collection.filter(g => (g.rating || 0) >= 8);
        const sourceGames = topRated.length > 0 ? topRated : collection.slice(0, 5);

        // 2. Собираем жанры и теги из этих игр
        const genres = new Set<string>();
        sourceGames.forEach(g => (g.genres || []).forEach(genre => genres.add(genre)));
        
        // 3. Делаем несколько запросов для разнообразия
        const recsMap = new Map<number, RecommendedGame>();
        
        // Запрос по топовому жанру + фильтр по платформам
        const topGenre = collection[0].genres[0]?.toLowerCase().replace(/ /g, "-") || "";
        if (topGenre) {
          const data = await fetchGames(1, "-rating", "", topGenre, platformIds);
          data.games.forEach(g => {
            if (!collectionIds.has(g.id)) {
              recsMap.set(g.id, { ...g, reason: `Because you enjoyed ${collection[0].name}` });
            }
          });
        }

        // Запрос по случайной игре из коллекции + фильтр по платформам
        const randomGame = collection[Math.floor(Math.random() * collection.length)];
        const randomGenre = randomGame.genres[0]?.toLowerCase().replace(/ /g, "-") || "";
        if (randomGenre) {
          const data = await fetchGames(1, "-relevance", "", randomGenre, platformIds);
          data.games.forEach(g => {
            if (!collectionIds.has(g.id) && !recsMap.has(g.id)) {
              recsMap.set(g.id, { ...g, reason: `Similar to ${randomGame.name}` });
            }
          });
        }

        setRecommendations(Array.from(recsMap.values()).slice(0, 15));
      } catch (err) {
        console.error("Error generating recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [user]);

  if (!user && !loading) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Personalized for You</h1>
      <p className={styles.subtitle}>Based on your collection, ratings and owned hardware</p>

      <LoadingErrorMessage 
        loading={loading} 
        error={null} 
        noResults={!loading && recommendations.length === 0} 
        message="Add more games to your collection to get better recommendations!" 
      />

      {!loading && recommendations.length > 0 && (
        <div className={styles.grid}>
          {recommendations.map((game) => (
            <div key={game.id} className={styles.cardWrapper}>
              <Link to={`/game/${game.id}`} className={styles.link}>
                <GameCard game={game} />
                <div className={styles.reasonBadge}>{game.reason}</div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
