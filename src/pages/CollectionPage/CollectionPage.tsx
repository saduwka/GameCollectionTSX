import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CollectionPage.module.css";
import GameCard from "../../components/GameCard/GameCard";
import type { Game } from "../../types/game";
import { getUserCollection } from "../../services/collectionService";


interface FavoriteGame extends Partial<Game> {
  status: string;
}

const CollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Record<string, FavoriteGame>>({});

  const statusOrder = ["played", "playing", "wishlist"];

  useEffect(() => {
    const fetchCollection = async () => {
      const data = await getUserCollection();
      const mapped: Record<string, FavoriteGame> = {};
      data.forEach((game) => {
        if (game.id) mapped[game.id.toString()] = game;
      });
      setFavorites(mapped);
    };

    fetchCollection();
  }, []);

  return (
    <div className={styles.collectionContainer}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Back
      </button>
      <h1 className={styles.title}>My Game Collection</h1>
      <button disabled className={styles.clearButton}>
        🗑️ Clear Collection (disabled)
      </button>
      {statusOrder.map((status) => {
        const games = Object.entries(favorites).filter(
          ([, value]) => value.status === status
        );

        return (
          <div key={status} className={styles.section}>
            <h2>
              {status === "played"
                ? "✅ Played"
                : status === "playing"
                ? "🕹️ Playing"
                : "📌 Want to Play"}
            </h2>
            {games.length > 0 ? (
              <ul>
              {games.map(([id, game]) => {
  if (!game.name) return null;
  return (
    <li key={id}>
      <GameCard
        game={{
          id: Number(id),
          name: game.name,
          background_image: game.background_image || "/fallback.jpg",
          released: game.released || "Unknown",
          rating: game.rating || 0,
          platforms: game.platforms || [],
        }}
        onClick={() => navigate(`/game/${id}`)}
      />
    </li>
  );
})}
            </ul>
            ) : (
              <p>No games in this category.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CollectionPage;