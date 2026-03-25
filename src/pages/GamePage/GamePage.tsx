import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getGameDetails } from "../../services/games/getGameDetails";

import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import ImageModal from "../../components/ImageModal/ImageModal";

import type { Game } from "../../types/game";
import styles from "./GamePage.module.css";

const GamePage: React.FC = () => {
  const { id, platformId } = useParams<{ id: string; platformId?: string }>();
  const navigate = useNavigate();

  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [imageAnimationKey, setImageAnimationKey] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No game ID provided");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const game = await getGameDetails(id);
        setGameDetails(game);
      } catch (err) {
        setError("Failed to fetch game details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const allImages = [
    gameDetails?.background_image,
    gameDetails?.background_image_additional,
    ...(gameDetails?.screenshots || [])
  ].filter(Boolean) as string[];

  const trailers = gameDetails?.trailers || [];

  const currentPlatformInfo = platformId && gameDetails
    ? gameDetails.platforms.find(p => p.platform.id === parseInt(platformId))
    : null;

  // Filter stores based on platform context
  const filteredStores = gameDetails?.stores.filter(s => {
    if (!platformId) return true;
    const slug = s.store.slug;
    const pSlug = currentPlatformInfo?.platform.slug || "";

    if (pSlug.includes("pc")) return ["steam", "epic-games", "gog", "itch", "origin", "uplay"].includes(slug);
    if (pSlug.includes("playstation")) return slug === "playstation-store";
    if (pSlug.includes("xbox")) return slug === "xbox-store" || slug === "xbox360";
    if (pSlug.includes("nintendo")) return slug === "nintendo";
    if (pSlug.includes("ios") || pSlug.includes("apple")) return slug === "apple-appstore";
    if (pSlug.includes("android")) return slug === "google-play";
    
    return true;
  });

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

          <h1 className={styles.gamePageHeader}>
            {gameDetails.name}
            {currentPlatformInfo && (
              <span className={styles.platformBadge}>
                {" "}
                [{currentPlatformInfo.platform.name}]
              </span>
            )}
          </h1>

          <div className={styles.gameWrapper}>
            <div className={styles.gamePageDetails}>
              <p>
                <strong>Release Date:</strong>{" "}
                {currentPlatformInfo?.released_at || gameDetails.released}
              </p>
              <p>
                <strong>RAWG Rating:</strong> {gameDetails.rating} / 5
              </p>
              {gameDetails.metacritic && (
                <p>
                  <strong>Metacritic:</strong> {gameDetails.metacritic}
                </p>
              )}

              {gameDetails.esrb_rating && (
                <p>
                  <strong>ESRB Rating:</strong> {gameDetails.esrb_rating}
                </p>
              )}

              {gameDetails.developers && gameDetails.developers.length > 0 && (
                <p>
                  <strong>Developers:</strong> {gameDetails.developers.join(", ")}
                </p>
              )}

              {gameDetails.publishers && gameDetails.publishers.length > 0 && (
                <p>
                  <strong>Publishers:</strong> {gameDetails.publishers.join(", ")}
                </p>
              )}

              {gameDetails.tags && gameDetails.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <strong>Tags:</strong>
                  <div className={styles.tags}>
                    {gameDetails.tags.slice(0, 15).map((tag, i) => (
                      <span key={i} className={styles.tagBadge}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {currentPlatformInfo?.requirements && (
                <div className={styles.requirements}>
                  <strong>Requirements:</strong>
                  {currentPlatformInfo.requirements.minimum && (
                    <p className={styles.requirementText}>
                      {currentPlatformInfo.requirements.minimum}
                    </p>
                  )}
                  {currentPlatformInfo.requirements.recommended && (
                    <p className={styles.requirementText}>
                      {currentPlatformInfo.requirements.recommended}
                    </p>
                  )}
                </div>
              )}

              {filteredStores && filteredStores.length > 0 && (
                <div className={styles.storesSection}>
                  <strong>Available at:</strong>
                  <div className={styles.storesList}>
                    {filteredStores.map(s => (
                      <a 
                        key={s.id} 
                        href={s.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.storeButton}
                      >
                        {s.store.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.descriptionSection}>
                <strong>Description:</strong>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{ __html: gameDetails.description }}
                />
              </div>

              <p>
                <strong>Platforms:</strong>{" "}
                {gameDetails.platforms?.length
                  ? gameDetails.platforms.map((p, i, arr) => (
                      <span key={p.platform.id}>
                        <Link
                          to={`/game/${gameDetails.id}/${p.platform.id}`}
                          className={`${styles.platformLink} ${
                            parseInt(platformId || "0") === p.platform.id
                              ? styles.activePlatform
                              : ""
                          }`}
                        >
                          {p.platform.name}
                        </Link>
                        {i < arr.length - 1 && ", "}
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

            <div className={styles.gameMediaContainer}>
              {allImages.length > 0 && (
                <div className={styles.screenshotsSection}>
                  <h2 className={styles.sectionHeading}>Gallery</h2>
                  <div className={styles.screenshotsGallery}>
                    {allImages.map((src, index) => (
                      <img
                        key={index}
                        className={styles.screenshotImage}
                        src={src}
                        alt={`${gameDetails.name} screenshot ${index + 1}`}
                        onClick={() => setModalIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {trailers.length > 0 && (
            <div className={styles.trailersSection}>
              <h2 className={styles.sectionHeading}>Trailers</h2>
              <div className={styles.trailersGallery}>
                {trailers.map((src, index) => (
                  <div key={index} className={styles.trailerItem}>
                    <video
                      controls
                      width="100%"
                      src={src}
                      title={`${gameDetails.name} trailer ${index + 1}`}
                    >
                      Sorry, your browser doesn't support embedded videos.
                    </video>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameDetails.game_series && gameDetails.game_series.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.sectionHeading}>More from this series</h2>
              <div className={styles.relatedGrid}>
                {gameDetails.game_series.map((seriesGame) => (
                  <Link 
                    to={`/game/${seriesGame.id}`} 
                    key={seriesGame.id} 
                    className={styles.relatedItem}
                  >
                    <img 
                      src={seriesGame.background_image} 
                      alt={seriesGame.name} 
                      className={styles.relatedImage} 
                    />
                    <span className={styles.relatedName}>{seriesGame.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {gameDetails.additions && gameDetails.additions.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.sectionHeading}>DLCs & Add-ons</h2>
              <div className={styles.relatedGrid}>
                {gameDetails.additions.map((addition) => (
                  <Link 
                    to={`/game/${addition.id}`} 
                    key={addition.id} 
                    className={styles.relatedItem}
                  >
                    <img 
                      src={addition.background_image} 
                      alt={addition.name} 
                      className={styles.relatedImage} 
                    />
                    <span className={styles.relatedName}>{addition.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {modalIndex !== null && (
            <ImageModal
              images={allImages}
              currentIndex={modalIndex}
              onClose={() => setModalIndex(null)}
              onPrev={() => {
                setModalIndex((prev) =>
                  prev !== null
                    ? (prev - 1 + allImages.length) % allImages.length
                    : 0
                );
                setImageAnimationKey((prev) => prev + 1);
              }}
              onNext={() => {
                setModalIndex((prev) =>
                  prev !== null ? (prev + 1) % allImages.length : 0
                );
                setImageAnimationKey((prev) => prev + 1);
              }}
              animationKey={imageAnimationKey}
            />
          )}
        </div>
      )}
    </>
  );
};

export default GamePage;
