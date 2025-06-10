import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGameDetails } from "../../services/games/getGameDetails";
import type { Game } from "../../types/game";
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import styles from "./GamePage.module.css";

const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [status, setStatus] = useState<string>("");
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAnimationKey, setImageAnimationKey] = useState<number>(0);

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

  const handleClick = (newStatus: string) => {
    if (!gameDetails) return;
    const updatedStatus = status === newStatus ? "" : newStatus;
    setStatus(updatedStatus);

    const saved = localStorage.getItem("favorites");
    const parsed = saved ? JSON.parse(saved) : {};
    const updated = {
      ...parsed,
      [gameDetails.id]: { name: gameDetails.name, status: updatedStatus }
    };

    if (updatedStatus === "") {
      delete updated[gameDetails.id];
    }

    localStorage.setItem("favorites", JSON.stringify(updated));
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
                  className={status === "played" ? styles.active : ""}
                  onClick={() => handleClick("played")}
                >
                  ✅ Played
                </button>
                <button
                  className={status === "playing" ? styles.active : ""}
                  onClick={() => handleClick("playing")}
                >
                  🕹️ Playing
                </button>
                <button
                  className={status === "wishlist" ? styles.active : ""}
                  onClick={() => handleClick("wishlist")}
                >
                  📌 Want to Play
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
                {gameDetails.platforms && gameDetails.platforms.length > 0
                  ? gameDetails.platforms.map((platformObj, index, arr) => {
                      const platformName = platformObj.platform.name;
                      const platformId = platformObj.platform.id;
                      return (
                        <span key={platformId}>
                          <a
                            href={`/platform/${platformId}`}
                            className={styles.platformLink}
                          >
                            {platformName}
                          </a>
                          {index < arr.length - 1 && ", "}
                        </span>
                      );
                    })
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
              const images: string[] = [
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
                      src={images[modalIndex ?? 0]}
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
