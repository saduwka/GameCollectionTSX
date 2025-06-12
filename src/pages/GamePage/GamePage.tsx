import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGameDetails } from "../../services/games/getGameDetails";
import type { Game } from "../../types/game";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./GamePage.module.css";
import {
  addGameToCollection,
  removeGameFromCollection
} from "../../services/collection/collectionService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [status, setStatus] = useState<string>("");
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAnimationKey, setImageAnimationKey] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("No game ID provided");
          setLoading(false);
          return;
        }
        const data: Game = await getGameDetails(id);
        setGameDetails(data);
        setLoading(false);

        const saved = localStorage.getItem("favorites");
        const parsed = saved ? JSON.parse(saved) : {};
        if (parsed[id]) {
          setStatus(parsed[id].status);
        }
      } catch (error) {
        setError("Failed to fetch game details");
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [id]);

  const handleClick = async (clickedStatus: string) => {
    if (!gameDetails || !user) return;

    setSaving(true);

    try {
      if (status === clickedStatus) {
        await removeGameFromCollection(gameDetails.id, user.uid);
        setStatus("");
        toast.success("Game removed from collection");
      } else {
        await addGameToCollection(
          {
            ...gameDetails,
            status: clickedStatus
          },
          user.uid
        );
        setStatus(clickedStatus);
        toast.success("Game status updated");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <LoadingErrorMessage
        loading={loading}
        error={error}
        noResults={!loading && !error && !gameDetails}
        message="No game found"
      />
      {!loading && !error && gameDetails && (
        <div className={styles.gamePageContainer}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.gamePageHeader}>{gameDetails.name}</h1>
          <div className={styles.gameWrapper}>
            <div className={styles.gameImgWrapper}>
              <div className={styles.gamePageImageContainer}>
                {gameDetails.background_image && (
                  <img
                    className={styles.gamePageImage}
                    src={gameDetails.background_image}
                    alt={gameDetails.name}
                    onClick={() => setModalIndex(0)}
                  />
                )}
                {gameDetails.background_image_additional && (
                  <img
                    className={styles.gamePageImage}
                    src={gameDetails.background_image_additional}
                    alt={gameDetails.name}
                    onClick={() => setModalIndex(1)}
                  />
                )}
              </div>
              <div className={styles.statusButtons}>
                <button
                  disabled={saving}
                  className={status === "played" ? styles.active : ""}
                  onClick={() => handleClick("played")}
                >
                  ✅ {saving && status === "played" ? "Saving…" : "Played"}
                </button>
                <button
                  disabled={saving}
                  className={status === "playing" ? styles.active : ""}
                  onClick={() => handleClick("playing")}
                >
                  🕹️ {saving && status === "playing" ? "Saving…" : "Playing"}
                </button>
                <button
                  disabled={saving}
                  className={status === "wishlist" ? styles.active : ""}
                  onClick={() => handleClick("wishlist")}
                >
                  📌{" "}
                  {saving && status === "wishlist" ? "Saving…" : "Want to Play"}
                </button>
              </div>
            </div>
            <div className={styles.gamePageDetails}>
              <p>
                <strong>Release Date:</strong> {gameDetails.released}
              </p>
              <p>
                <strong>Rating:</strong> {gameDetails.rating}
              </p>
              <p>
                <strong>Metacritic:</strong> {gameDetails.metacritic || "N/A"}
              </p>
              <div>
                <strong>Description:</strong>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: gameDetails.description }}
                />
              </div>
              <p>
                <strong>Platforms:</strong>{" "}
                {gameDetails.platforms?.length
                  ? gameDetails.platforms.map((platformObj, index, arr) => (
                      <span key={platformObj.platform.id}>
                        <a
                          href={`/platform/${platformObj.platform.id}`}
                          className={styles.platformLink}
                        >
                          {platformObj.platform.name}
                        </a>
                        {index < arr.length - 1 && ", "}
                      </span>
                    ))
                  : "N/A"}
              </p>
              {gameDetails.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={gameDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          </div>

          {modalIndex !== null &&
            (() => {
              const images = [
                gameDetails.background_image,
                gameDetails.background_image_additional
              ].filter(Boolean) as string[];

              return (
                <div
                  className={styles.modalOverlay}
                  onClick={() => setModalIndex(null)}
                >
                  <div
                    className={styles.modalContent}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.modalNavButton}
                      onClick={() => {
                        setModalIndex((prev) =>
                          prev !== null
                            ? (prev - 1 + images.length) % images.length
                            : 0
                        );
                        setImageAnimationKey((prev) => prev + 1);
                      }}
                    >
                      ‹
                    </button>
                    <img
                      key={imageAnimationKey}
                      src={images[modalIndex]}
                      alt="Game Fullscreen"
                      className={`${styles.modalImage} ${styles.modalImageAnimated}`}
                    />
                    <button
                      className={styles.modalNavButton}
                      onClick={() => {
                        setModalIndex((prev) =>
                          prev !== null ? (prev + 1) % images.length : 0
                        );
                        setImageAnimationKey((prev) => prev + 1);
                      }}
                    >
                      ›
                    </button>
                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </>
  );
};

export default GamePage;
