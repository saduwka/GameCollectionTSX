// FILE: src/pages/GamePage/GamePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import DOMPurify from "dompurify";
import { getGameDetails } from "../../services/games/getGameDetails";
import { getWiki } from "../../services/platforms/wikiService";
import { 
  addToCollection, 
  removeFromCollection, 
  isInCollection,
  updateGameMetadata
} from "../../services/collection/collectionService";
import type { GameStatus } from "../../services/collection/collectionService";
import type { Game } from "../../types/game";
import { useAuth } from "../../context/AuthContext";
import { useComparison } from "../../context/ComparisonContext";

import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import ImageModal from "../../components/ImageModal/ImageModal";
import YouTubeSection from "../../components/YouTubeSection/YouTubeSection";
import GamePageSkeleton from "../../components/Skeleton/GamePageSkeleton";
import PageMeta from "../../components/PageMeta/PageMeta";

import { searchGameDeals, getStoreName } from "../../services/stores/cheapSharkService";
import { getGameMedia } from "../../services/media/youtubeService";
import styles from "./GamePage.module.css";

const STATUS_OPTIONS: GameStatus[] = ["Backlog", "Playing", "Completed", "Dropped", "Wishlist", "Not Interested"];

const GamePage: React.FC = () => {
  const { id, platformId } = useParams<{ id: string; platformId?: string }>();
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(platformId || null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToComparison, removeFromComparison, isInComparison } = useComparison();

  const handleToggleCompare = (game: Game) => {
    if (isInComparison(game.id)) {
      removeFromComparison(game.id);
      toast.success("Убрано из сравнения");
    } else {
      addToComparison(game);
      toast.success("Добавлено в сравнение");
    }
  };

  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [imageAnimationKey, setImageAnimationKey] = useState<number>(0);
  
  const [personalRating, setPersonalRating] = useState<number>(0);
  const [personalNote, setPersonalNote] = useState<string>("");
  const [hoursPlayed, setHoursPlayed] = useState<number>(0);
  const [playingOn, setPlayingOn] = useState<string>("");
  const [completedAt, setCompletedAt] = useState<string>("");
  const [isCollectionActionLoading, setIsCollectionActionLoading] = useState<boolean>(false);

  // Queries
  const { data: gameDetails, isLoading: loading, error, isError } = useQuery({
    queryKey: ["game", id],
    queryFn: () => getGameDetails(id!),
    enabled: !!id,
  });

  const currentPlatformInfo = (selectedPlatformId || platformId) && gameDetails
    ? gameDetails.platforms.find(p => p.platform.id === parseInt(selectedPlatformId || platformId!))
    : null;

  const platformName = currentPlatformInfo?.platform.name || "";

  const { data: collectionData, refetch: refetchCollection } = useQuery({
    queryKey: ["collectionStatus", user?.uid, id],
    queryFn: () => isInCollection(parseInt(id!)),
    enabled: !!user && !!id,
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["deals", gameDetails?.name],
    queryFn: () => searchGameDeals(gameDetails!.name),
    enabled: !!gameDetails?.name,
  });

  const { data: youtubeMedia = { ost: [], reviews: [] }, isLoading: youtubeLoading } = useQuery({
    queryKey: ["youtube", gameDetails?.name, platformName],
    queryFn: () => getGameMedia(platformName ? `${gameDetails!.name} ${platformName}` : gameDetails!.name),
    enabled: !!gameDetails?.name,
  });

  const { data: gameWiki, isLoading: loadingWiki } = useQuery({
    queryKey: ["gameWiki", gameDetails?.name, platformName],
    queryFn: () => getWiki(platformName ? `${gameDetails!.name} ${platformName}` : gameDetails!.name),
    enabled: !!gameDetails?.name,
  });

  const collectionStatus = collectionData?.status || null;

  useEffect(() => {
    if (collectionData) {
      setPersonalRating(collectionData.rating || 0);
      setPersonalNote(collectionData.note || "");
      setHoursPlayed(collectionData.hoursPlayed || 0);
      setPlayingOn(collectionData.playingOn || "");
      if (collectionData.completedAt) {
        setCompletedAt(new Date(collectionData.completedAt).toISOString().split('T')[0]);
      } else {
        setCompletedAt("");
      }
    } else {
      setPersonalRating(0);
      setPersonalNote("");
      setHoursPlayed(0);
      setPlayingOn("");
      setCompletedAt("");
    }
  }, [collectionData]);

  const handleStatusChange = async (newStatus: GameStatus) => {
    if (!user) {
      toast.error("Please sign in to add games.");
      return;
    }

    if (!gameDetails) return;

    setIsCollectionActionLoading(true);
    try {
      if (collectionStatus) {
        const updates: Parameters<typeof updateGameMetadata>[1] = { status: newStatus };
        if (newStatus === "Completed" && !completedAt) {
          const now = Date.now();
          updates.completedAt = now;
          setCompletedAt(new Date(now).toISOString().split('T')[0]);
        }
        await updateGameMetadata(gameDetails.id, updates);
        toast.success(`Status updated to ${newStatus}`);
      } else {
        const now = Date.now();
        await addToCollection({
          id: gameDetails.id,
          name: gameDetails.name,
          background_image: gameDetails.background_image,
          genres: gameDetails.genres,
          status: newStatus,
          rating: personalRating,
          note: personalNote,
          hoursPlayed: hoursPlayed,
          playingOn: playingOn || (platformId ? gameDetails.platforms.find(p => p.platform.id === parseInt(platformId))?.platform.name : ""),
          completedAt: newStatus === "Completed" ? now : undefined
        });
        toast.success(`${gameDetails.name} added to collection!`);
        if (newStatus === "Completed") setCompletedAt(new Date(now).toISOString().split('T')[0]);
      }
      refetchCollection();
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update collection.");
    } finally {
      setIsCollectionActionLoading(false);
    }
  };

  const handleMetadataUpdate = async (updates: Parameters<typeof updateGameMetadata>[1]) => {
    if (!user || !collectionStatus) return;
    try {
      await updateGameMetadata(parseInt(id!), updates);
      refetchCollection();
    } catch (err) {
      console.error("Metadata update error:", err);
      toast.error("Failed to save changes.");
    }
  };

  const handleRatingChange = (rating: number) => {
    setPersonalRating(rating);
    handleMetadataUpdate({ rating });
    toast.success(`Rating set to ${rating}/10`);
  };

  const handleNoteSave = () => {
    handleMetadataUpdate({ note: personalNote });
    toast.success("Notes saved!");
  };

  const handleHoursChange = (val: string) => {
    const hours = parseFloat(val) || 0;
    setHoursPlayed(hours);
    handleMetadataUpdate({ hoursPlayed: hours });
  };

  const handlePlatformSelect = (platformName: string) => {
    setPlayingOn(platformName);
    handleMetadataUpdate({ playingOn: platformName });
    toast.success(`Platform set to ${platformName}`);
  };

  const handleCompletionDateChange = (dateStr: string) => {
    setCompletedAt(dateStr);
    const timestamp = dateStr ? new Date(dateStr).getTime() : null;
    handleMetadataUpdate({ completedAt: timestamp });
  };

  const handleRemoveFromCollection = async () => {
    if (!user || !gameDetails) return;
    
    setIsCollectionActionLoading(true);
    try {
      await removeFromCollection(gameDetails.id);
      toast.success("Removed from collection");
      refetchCollection();
    } catch (err) {
      console.error("Remove error:", err);
      toast.error("Failed to remove game.");
    } finally {
      setIsCollectionActionLoading(false);
    }
  };

  const allImages = [
    gameDetails?.background_image,
    gameDetails?.background_image_additional,
    ...(gameDetails?.screenshots || [])
  ].filter(Boolean) as string[];

  const trailers = gameDetails?.trailers || [];

  if (loading) return <GamePageSkeleton />;

  const game = gameDetails as Game | undefined;
  const metaDescription = game?.description
    ? `${game.description.replace(/<[^>]+>/g, "").slice(0, 160)}...`
    : `${game?.name ?? ""} — обзор, оценки, скриншоты и трейлеры на PlayHub`;

  return (
    <>
      {game && (
        <PageMeta
          title={game.name}
          description={metaDescription}
          image={game.background_image}
          type="article"
        />
      )}
      <LoadingErrorMessage
        loading={false}
        error={isError ? (error as Error).message : null}
        noResults={!loading && !isError && !gameDetails}
        message="No game found"
      />

      {!loading && !isError && gameDetails && (
        <div className={styles.gamePageContainer}>
          <div className={styles.topActions}>
            <button onClick={() => navigate(-1)} className={styles.backButton}>
              ← Back
            </button>
            <button
              onClick={() => handleToggleCompare(gameDetails)}
              className={`${styles.compareButton} ${isInComparison(gameDetails.id) ? styles.compareButtonActive : ""}`}
              aria-pressed={isInComparison(gameDetails.id)}
            >
              {isInComparison(gameDetails.id) ? "✓ In compare" : "⚖️ Add to compare"}
            </button>
          </div>

          <h1 className={styles.gamePageHeader}>
            {gameDetails.name}
            {currentPlatformInfo && (
              <span className={styles.platformBadge}>
                {" "}
                [{currentPlatformInfo.platform.name}]
              </span>
            )}
            
            {gameDetails.platforms.length > 1 && (
              <div className={styles.platformSelector}>
                <label>View Version: </label>
                <select 
                  value={selectedPlatformId || ""} 
                  onChange={(e) => setSelectedPlatformId(e.target.value || null)}
                >
                  <option value="">General Info</option>
                  {gameDetails.platforms.map(p => (
                    <option key={p.platform.id} value={p.platform.id}>{p.platform.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className={styles.subscriptionBadges}>
              {gameDetails.tags?.some(t => t.name.toLowerCase().includes("game pass")) && (
                <span className={styles.gamePassBadge}>Game Pass</span>
              )}
              {gameDetails.tags?.some(t => t.name.toLowerCase().includes("ps plus")) && (
                <span className={styles.psPlusBadge}>PS Plus</span>
              )}
            </div>
          </h1>

          <div className={styles.gameWrapper}>
            <div className={styles.gamePageDetails}>
              <div className={styles.statusSection}>
                <label className={styles.statusLabel}>Collection Status:</label>
                <div className={styles.statusButtons}>
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      className={`${styles.statusButton} ${collectionStatus === status ? styles.activeStatus : ""}`}
                      onClick={() => handleStatusChange(status)}
                      disabled={isCollectionActionLoading}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {collectionStatus && (
                <div className={styles.personalSection}>
                  <div className={styles.progressTracker}>
                    <div className={styles.inputGroup}>
                      <label className={styles.statusLabel}>Playing On:</label>
                      <select 
                        className={styles.statusSelect}
                        value={playingOn}
                        onChange={(e) => handlePlatformSelect(e.target.value)}
                      >
                        <option value="">Select Platform...</option>
                        {gameDetails.platforms.map(p => (
                          <option key={p.platform.id} value={p.platform.name}>
                            {p.platform.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.statusLabel}>Hours Played:</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.5"
                        className={styles.hoursInput}
                        value={hoursPlayed}
                        onChange={(e) => handleHoursChange(e.target.value)}
                      />
                    </div>

                    {collectionStatus === "Completed" && (
                      <div className={styles.inputGroup}>
                        <label className={styles.statusLabel}>Completed At:</label>
                        <input 
                          type="date"
                          className={styles.dateInput}
                          value={completedAt}
                          onChange={(e) => handleCompletionDateChange(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className={styles.ratingBox}>
                    <label className={styles.statusLabel}>My Rating:</label>
                    <div className={styles.stars}>
                      {[...Array(10)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`${styles.star} ${i < personalRating ? styles.starActive : ""}`}
                          onClick={() => handleRatingChange(i + 1)}
                        >
                          ★
                        </span>
                      ))}
                      <span className={styles.ratingNumber}>{personalRating || 0} / 10</span>
                    </div>
                  </div>

                  <div className={styles.noteBox}>
                    <label className={styles.statusLabel}>My Notes:</label>
                    <textarea 
                      className={styles.noteInput}
                      placeholder="Write your personal thoughts or progress..."
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      onBlur={handleNoteSave}
                    />
                    <button 
                      className={styles.saveNoteButton}
                      onClick={handleNoteSave}
                      disabled={isCollectionActionLoading}
                    >
                      Save Note
                    </button>
                  </div>

                  <button 
                    className={styles.removeButton}
                    onClick={handleRemoveFromCollection}
                    disabled={isCollectionActionLoading}
                  >
                    Remove from Collection
                  </button>
                </div>
              )}

              <p>
                <strong>Release Date:</strong>{" "}
                {currentPlatformInfo?.released_at || gameDetails.released}
              </p>
              <p>
                <strong>RAWG Rating:</strong> {gameDetails.rating} / 5
              </p>
              {gameDetails.playtime ? (
                <p>
                  <strong>Average Playtime:</strong> {gameDetails.playtime} hours
                </p>
              ) : null}
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
                  <strong>Developers:</strong>{" "}
                  {gameDetails.developers.map((dev, i) => (
                    <React.Fragment key={dev.id}>
                      <Link to={`/games?developer=${dev.id}`} className={styles.platformLink}>
                        {dev.name}
                      </Link>
                      {i < gameDetails.developers!.length - 1 && ", "}
                    </React.Fragment>
                  ))}
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
                    {gameDetails.tags.slice(0, 15).map((tag) => (
                      <Link 
                        key={tag.id} 
                        to={`/games?tag=${tag.id}`} 
                        className={styles.tagBadge}
                        style={{ textDecoration: "none" }}
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.descriptionSection}>
                <strong>Description:</strong>
                {loadingWiki ? (
                  <p>Loading details for this version...</p>
                ) : gameWiki ? (
                  <div className={styles.wikiBox}>
                    <p>{gameWiki.extract}</p>
                    {gameWiki.content_urls?.desktop.page && (
                      <a href={gameWiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer">Read more on Wikipedia →</a>
                    )}
                  </div>
                ) : (
                  <div
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(gameDetails.description) }}
                  />
                )}
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

              {/* Retro Integration */}
              {gameDetails.released && parseInt(gameDetails.released.split("-")[0]) < 2000 && (
                <div className={styles.retroSection}>
                  <strong>Play Retro:</strong>
                  <div className={styles.storesList}>
                    <a
                      href={`https://archive.org/details/softwarelibrary_msdos_games?query=${encodeURIComponent(gameDetails.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.retroBadge}
                    >
                      Search on Internet Archive
                    </a>
                  </div>
                </div>
              )}

              {/* Price Comparison */}
              {(dealsLoading || deals.length > 0) && (
                <div className={styles.dealsSection}>
                  <strong>Best Deals:</strong>
                  {dealsLoading ? (
                    <p className={styles.dealsLoader}>Searching for best prices...</p>
                  ) : (
                    <div className={styles.dealsList}>
                      {deals.map((deal) => (
                        <a
                          key={deal.dealID}
                          href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.dealItem}
                        >
                          <span className={styles.storeName}>{getStoreName(deal.storeID)}</span>
                          <span className={styles.dealPrice}>${deal.price}</span>
                          {parseFloat(deal.savings) > 0 && (
                            <span className={styles.dealSavings}>-{Math.round(parseFloat(deal.savings))}%</span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {gameDetails.stores && gameDetails.stores.length > 0 && (
                <div className={styles.storesSection}>
                  <strong>Official Stores:</strong>
                  <div className={styles.storesList}>
                    {gameDetails.stores.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.storeBadge}
                      >
                        {s.store.name || "Visit Store"}
                      </a>
                    ))}
                  </div>
                </div>
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
              <h2 className={styles.sectionHeading}>Official Trailers</h2>
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

          {/* YouTube Media Section */}
          <YouTubeSection 
            title="Official Soundtracks" 
            videos={youtubeMedia.ost} 
            loading={youtubeLoading} 
          />

          <YouTubeSection 
            title="Game Reviews & Walkthroughs" 
            videos={youtubeMedia.reviews} 
            loading={youtubeLoading} 
          />

          {gameDetails.additions && gameDetails.additions.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.sectionHeading}>DLCs & Additions</h2>
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
