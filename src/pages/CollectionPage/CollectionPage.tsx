import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./CollectionPage.module.css";
import GameCard from "../../components/GameCard/GameCard";
import type { Game } from "../../types/game";
import {
  getUserCollection,
  removeGameFromCollection
} from "../../services/collection/collectionService";
import { useAuth } from "../../context/AuthContext";
import LoginButton from "../../components/LoginButton/LoginButton";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";



interface FavoriteGame extends Partial<Game> {
  status: string;
}

const CollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [favorites, setFavorites] = useState<Record<string, FavoriteGame>>({});
  const [error, setError] = useState<string | null>(null);
  const statusOrder = ["played", "playing", "wishlist"];

  useEffect(() => {
    if (!user) return;

    const fetchCollection = async () => {
      try {
        const data = await getUserCollection(user.uid);
        const mapped: Record<string, FavoriteGame> = {};
        data.forEach((game: FavoriteGame) => {
          if (game.id) mapped[game.id.toString()] = game;
        });
        setFavorites(mapped);
      } catch (e) {
        setError("Failed to load your collection.");
      }
    };

    fetchCollection();
  }, [user]);

  if (loading)
    return (
      <LoadingErrorMessage
        loading={loading} error={null} noResults={false}        />
    );

  if (!user) {
    return (
      <div className={styles.collectionContainer}>
        <div className={styles.loginWrapper}>
          <h2 className={styles.title}>Log in to view your collection</h2>
          <LoginButton />
        </div>
      </div>
    );
  }

  const handleRemove = (gameId: number) => {
    if (!user) return;

    confirmAlert({
      title: "Remove game?",
      message:
        "Are you sure you want to remove this game from your collection?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            try {
              await removeGameFromCollection(gameId, user.uid);
              setFavorites((prev) => {
                const updated = { ...prev };
                delete updated[gameId.toString()];
                return updated;
              });
              toast.success("Game removed");
            } catch (error) {
              toast.error("Failed to remove the game");
            }
          }
        },
        {
          label: "Cancel"
        }
      ]
    });
  };

  return (
    <div className={styles.collectionContainer}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Back
        </button>
        <LogoutButton />
      </div>

      <h1 className={styles.title}>My Game Collection</h1>

      <LoadingErrorMessage
        loading={false}
        error={error}
        noResults={Object.keys(favorites).length === 0}
      />

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
                ? "🕹️ Currently Playing"
                : "📌 Wishlist"}
            </h2>

            {games.length > 0 ? (
              <div className={styles.cardsRow}>
                {games.map(([id, game]) => {
                  if (!game.name) return null;
                  return (
                    <div key={id} className={styles.cardWrapper}>
                      <Link to={`/game/${id}`} className={styles.link}>
                        <GameCard
                          game={{
                            id: Number(id),
                            name: game.name,
                            background_image:
                              game.background_image || "/fallback.jpg",
                            released: game.released || "Unknown",
                            rating: game.rating || 0,
                            platforms: game.platforms || [],
                            description: game.description || "",
                            coverUrl: game.coverUrl || "",
                            genres: game.genres || []
                          }}
                        />
                      </Link>
                      <button
                        className={styles.removeButton}
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(Number(id));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
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
