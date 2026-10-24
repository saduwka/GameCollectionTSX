// FILE: src/pages/GamePage/GamePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { getGameDetails } from "../../services/games/getGameDetails";
import { getWiki } from "../../services/platforms/wikiService";
import { 
  addToCollection, 
  removeFromCollection, 
  isInCollection,
  updateGameMetadata
} from "../../services/collection/collectionService";
import type { GameStatus } from "../../services/collection/collectionService";
import { invalidateUserLibrary } from "../../services/collection/queryKeys";
import type { Game } from "../../types/game";
import { useAuth } from "../../context/AuthContext";
import { useComparison } from "../../context/ComparisonContext";

import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import ImageModal from "../../components/ImageModal/ImageModal";
import YouTubeSection from "../../components/YouTubeSection/YouTubeSection";
import GamePageSkeleton from "../../components/Skeleton/GamePageSkeleton";
import PageMeta from "../../components/PageMeta/PageMeta";
import JsonLd, { breadcrumbJsonLd, videoGameJsonLd } from "../../components/JsonLd/JsonLd";
import RawgCredit from "../../components/RawgCredit/RawgCredit";
import { RAWG_DETAIL_STALE_TIME } from "../../services/rawgCache";
import { canonicalUrl, gamePath, gamesPath, genrePath } from "../../seo/canonicalUrl";
import { SITE_ORIGIN } from "../../site";

import { searchGameDeals, getStoreName } from "../../services/stores/cheapSharkService";
import { getGameMedia } from "../../services/media/youtubeService";
import styles from './GamePage.module.scss';

const STATUS_OPTIONS: GameStatus[] = ["Backlog", "Playing", "Completed", "Dropped", "Wishlist", "Liked", "Not Interested"];

const firstSentence = (raw: string, fallback: string) => {
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : fallback;
};

const GamePage: React.FC = () => {
  const { id, platformId } = useParams<{ id: string; platformId?: string }>();
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(platformId || null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [wideLayout, setWideLayout] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToComparison, removeFromComparison, isInComparison } = useComparison();
  const { t, i18n } = useTranslation();

  const handleToggleCompare = (game: Game) => {
    if (isInComparison(game.id)) {
      removeFromComparison(game.id);
      toast.success(t('compare.removed'));
    } else {
      addToComparison(game);
      toast.success(t('compare.added'));
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
    staleTime: RAWG_DETAIL_STALE_TIME,
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
    queryKey: ["youtube", gameDetails?.name, platformName, i18n.language],
    queryFn: () => getGameMedia(platformName ? `${gameDetails!.name} ${platformName}` : gameDetails!.name, i18n.language.startsWith('ru') ? 'ru' : 'en'),
    enabled: !!gameDetails?.name,
  });

  const { data: gameWiki, isLoading: loadingWiki } = useQuery({
    queryKey: ["gameWiki", gameDetails?.name, platformName, i18n.language],
    queryFn: () => getWiki(platformName ? `${gameDetails!.name} ${platformName}` : gameDetails!.name, i18n.language.startsWith('ru') ? 'ru' : 'en'),
    enabled: !!gameDetails?.name,
  });

  const collectionStatus = collectionData?.status || null;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setWideLayout(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

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
      toast.error(t('game_page.toasts.sign_in'));
      return;
    }

    if (!gameDetails) return;

    const previousCompletedAt = completedAt;
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
        await invalidateUserLibrary(queryClient, user.uid);
        toast.success(t('game_page.toasts.status_updated', { status: newStatus }));
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
          completedAt: newStatus === "Completed" ? now : undefined,
          tags: (gameDetails.tags || []).map((tag) => tag.slug).filter((slug): slug is string => Boolean(slug)).slice(0, 8),
          playtime: gameDetails.playtime,
          metacritic: gameDetails.metacritic,
          ratings_count: gameDetails.ratings_count,
          platforms: gameDetails.platforms.map((item) => item.platform.id).slice(0, 12),
        });
        await invalidateUserLibrary(queryClient, user.uid);
        toast.success(t('game_page.toasts.added_to_collection', { name: gameDetails.name }));
        if (newStatus === "Completed") setCompletedAt(new Date(now).toISOString().split('T')[0]);
      }
      refetchCollection();
    } catch (err) {
      console.error("Status update error:", err);
      setCompletedAt(previousCompletedAt);
      toast.error(t('game_page.toasts.update_failed'));
    } finally {
      setIsCollectionActionLoading(false);
    }
  };

  const handleMetadataUpdate = async (updates: Parameters<typeof updateGameMetadata>[1]) => {
    if (!user || !id || !collectionStatus) {
      throw new Error("Cannot save");
    }
    try {
      await updateGameMetadata(parseInt(id, 10), updates);
      await invalidateUserLibrary(queryClient, user.uid);
      refetchCollection();
    } catch (err) {
      console.error("Metadata update error:", err);
      toast.error(t('game_page.toasts.save_failed'));
      throw err;
    }
  };

  const handleRatingChange = async (rating: number) => {
    const previous = personalRating;
    setPersonalRating(rating);
    try {
      await handleMetadataUpdate({ rating });
      toast.success(t('game_page.toasts.rating_set', { rating }));
    } catch {
      setPersonalRating(previous);
    }
  };

  const handleNoteSave = async () => {
    const previous = personalNote;
    try {
      await handleMetadataUpdate({ note: personalNote });
      toast.success(t('game_page.toasts.notes_saved'));
    } catch {
      setPersonalNote(previous);
    }
  };

  const handleHoursChange = async (val: string) => {
    const hours = parseFloat(val) || 0;
    const previous = hoursPlayed;
    setHoursPlayed(hours);
    try {
      await handleMetadataUpdate({ hoursPlayed: hours });
    } catch {
      setHoursPlayed((current) => (current === hours ? previous : current));
    }
  };

  const handlePlatformSelect = async (platformName: string) => {
    const previous = playingOn;
    setPlayingOn(platformName);
    try {
      await handleMetadataUpdate({ playingOn: platformName });
      toast.success(t('game_page.toasts.platform_set', { name: platformName }));
    } catch {
      setPlayingOn(previous);
    }
  };

  const handleCompletionDateChange = async (dateStr: string) => {
    const previous = completedAt;
    setCompletedAt(dateStr);
    const timestamp = dateStr ? new Date(dateStr).getTime() : null;
    try {
      await handleMetadataUpdate({ completedAt: timestamp });
    } catch {
      setCompletedAt(previous);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!user || !gameDetails) return;
    
    setIsCollectionActionLoading(true);
    try {
      await removeFromCollection(gameDetails.id);
      await invalidateUserLibrary(queryClient, user.uid);
      toast.success(t('game_page.toasts.removed_from_collection'));
      refetchCollection();
    } catch (err) {
      console.error("Remove error:", err);
      toast.error(t('game_page.toasts.remove_failed'));
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
  const metaDescription = firstSentence(
    game?.description || "",
    `${game?.name ?? "Игра"} — обзор, платформы и похожие игры на gameevening.`,
  );

  return (
    <>
      {game && (
        <>
          <PageMeta
            title={`${game.name} — обзор, платформы, похожие игры | gameevening`}
            description={metaDescription}
            image={game.background_image}
            type="article"
            exactTitle
          />
          <JsonLd data={videoGameJsonLd(game)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: t("common.home"), url: `${SITE_ORIGIN}/` },
              { name: t("common.games"), url: canonicalUrl(SITE_ORIGIN, gamesPath()) },
              ...(game.primaryGenre
                ? [{ name: game.primaryGenre.name, url: canonicalUrl(SITE_ORIGIN, genrePath(game.primaryGenre.slug)) }]
                : []),
              { name: game.name, url: canonicalUrl(SITE_ORIGIN, gamePath(game.id)) },
            ])}
          />
        </>
      )}
      <LoadingErrorMessage
        loading={false}
        error={isError ? (error as Error).message : null}
        noResults={!loading && !isError && !gameDetails}
        message="No game found"
      />

      {!loading && !isError && gameDetails && (
        <div className={styles.gamePageContainer} data-seo-ready="true">
          <div className={styles.topActions}>
            <button onClick={() => navigate(-1)} className={styles.backButton}>
              {t("game_page.back")}
            </button>
            <button
              onClick={() => handleToggleCompare(gameDetails)}
              className={`${styles.compareButton} ${isInComparison(gameDetails.id) ? styles.compareButtonActive : ""}`}
              aria-pressed={isInComparison(gameDetails.id)}
            >
              {isInComparison(gameDetails.id) ? t("game_page.in_compare") : t("compare.add_hint")}
            </button>
          </div>

          <nav className={styles.crumbs} aria-label="breadcrumb">
            <Link to="/">{t("common.home")}</Link>
            <span aria-hidden="true">/</span>
            <Link to={gamesPath()}>{t("common.games")}</Link>
            {gameDetails.primaryGenre ? (
              <>
                <span aria-hidden="true">/</span>
                <Link to={genrePath(gameDetails.primaryGenre.slug)}>{gameDetails.primaryGenre.name}</Link>
              </>
            ) : null}
            <span aria-hidden="true">/</span>
            <span>{gameDetails.name}</span>
          </nav>
          <h1 className={styles.gamePageHeader}>{gameDetails.name}</h1>
          {gameDetails.platforms.length > 0 && (
            <div className={styles.platformChips}>
              <button
                type="button"
                className={!selectedPlatformId ? styles.platformChipActive : styles.platformChip}
                onClick={() => setSelectedPlatformId(null)}
              >
                {t("game_page.general_info")}
              </button>
              {gameDetails.platforms.map((platform) => (
                <button
                  key={platform.platform.id}
                  type="button"
                  className={String(platform.platform.id) === selectedPlatformId ? styles.platformChipActive : styles.platformChip}
                  onClick={() => setSelectedPlatformId(String(platform.platform.id))}
                >
                  {platform.platform.name}
                </button>
              ))}
            </div>
          )}

          <div className={styles.statusSection}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => setStatusMenuOpen((open) => !open)}
              disabled={isCollectionActionLoading}
            >
              {collectionStatus ? t(`game_page.status.${collectionStatus}`) : t("game_page.add_to_collection")}
            </button>
            {statusMenuOpen && (
              <div className={styles.statusMenu}>
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusMenuOpen(false);
                      handleStatusChange(status);
                    }}
                  >
                    {t(`game_page.status.${status}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.gameWrapper}>
            <div className={styles.gamePageDetails}>
              {collectionStatus && (
                <div className={styles.personalSection}>
                  <h2 className={styles.sectionHeading}>{t("game_page.my_game")}</h2>
                  <div className={styles.progressTracker}>
                    <div className={styles.inputGroup}>
                      <label className={styles.statusLabel}>{t('game_page.playing_on')}</label>
                      <select 
                        className={styles.statusSelect}
                        value={playingOn}
                        onChange={(e) => handlePlatformSelect(e.target.value)}
                      >
                        <option value="">{t('game_page.select_platform')}</option>
                        {gameDetails.platforms.map(p => (
                          <option key={p.platform.id} value={p.platform.name}>
                            {p.platform.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.statusLabel}>{t('game_page.hours_played')}</label>
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
                        <label className={styles.statusLabel}>{t('game_page.completed_at')}</label>
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
                    <label className={styles.statusLabel}>{t('game_page.my_rating')}</label>
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

                  <details className={styles.noteBox}>
                    <summary>{t('game_page.my_notes')}</summary>
                    <textarea 
                      className={styles.noteInput}
                      placeholder={t('game_page.note_placeholder')}
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      onBlur={handleNoteSave}
                    />
                    <button 
                      className={styles.saveNoteButton}
                      onClick={handleNoteSave}
                      disabled={isCollectionActionLoading}
                    >
                      {t('game_page.save_note')}
                    </button>
                  </details>

                  <button 
                    className={styles.removeButton}
                    onClick={handleRemoveFromCollection}
                    disabled={isCollectionActionLoading}
                  >
                    {t('game_page.remove_from_collection')}
                  </button>
                </div>
              )}

              <p>
                <strong>{t('game_page.details.release_date')}</strong>{" "}
                {currentPlatformInfo?.released_at || gameDetails.released}
              </p>
              <p>
                <strong>{t('game_page.details.rawg_rating')}</strong> {gameDetails.rating} / 5
              </p>
              {gameDetails.playtime ? (
                <p>
                  <strong>{t('game_page.details.avg_playtime')}</strong> {t('game_page.details.hours', { hours: gameDetails.playtime })}
                </p>
              ) : null}
              {gameDetails.metacritic && (
                <p>
                  <strong>{t('game_page.details.metacritic')}</strong> {gameDetails.metacritic}
                </p>
              )}

              {gameDetails.esrb_rating && (
                <p>
                  <strong>{t('game_page.details.esrb')}</strong> {gameDetails.esrb_rating}
                </p>
              )}

              {gameDetails.developers && gameDetails.developers.length > 0 && (
                <p>
                  <strong>{t('game_page.details.developers')}</strong>{" "}
                  {gameDetails.developers.map((dev, i) => (
                    <React.Fragment key={dev.id}>
                      <Link to={`${gamesPath()}?developer=${dev.id}`} className={styles.platformLink}>
                        {dev.name}
                      </Link>
                      {i < gameDetails.developers!.length - 1 && ", "}
                    </React.Fragment>
                  ))}
                </p>
              )}

              {gameDetails.publishers && gameDetails.publishers.length > 0 && (
                <p>
                  <strong>{t('game_page.details.publishers')}</strong> {gameDetails.publishers.join(", ")}
                </p>
              )}

              {gameDetails.tags && gameDetails.tags.length > 0 && (
                <div className={styles.tagsSection}>
                  <strong>{t('game_page.details.tags')}</strong>
                  <div className={styles.tags}>
                    {gameDetails.tags.slice(0, 15).map((tag) => (
                      <Link 
                        key={tag.id} 
                        to={`${gamesPath()}?tag=${tag.id}`} 
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
                <strong>{t('game_page.details.description')}</strong>
                {loadingWiki ? (
                  <p>{t('game_page.details.loading_wiki')}</p>
                ) : (
                  <div className={descriptionOpen ? styles.descriptionOpen : styles.descriptionClamp}>
                    {gameWiki ? (
                      <p>{gameWiki.extract}</p>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(gameDetails.description) }} />
                    )}
                  </div>
                )}
                <button type="button" className={styles.textButton} onClick={() => setDescriptionOpen((open) => !open)}>
                  {descriptionOpen ? t("common.collapse") : t("common.read_more")}
                </button>
                {gameWiki?.content_urls?.desktop.page && (
                  <a href={gameWiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer">{t('game_page.details.read_more_wiki')}</a>
                )}
              </div>

              <p>
                <strong>{t('game_page.details.platforms')}</strong>{" "}
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
                  <strong>{t('game_page.details.website')}</strong>{" "}
                  <a
                    href={gameDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('game_page.details.visit_website')}
                  </a>
                </p>
              )}

              {/* Retro Integration */}
              {gameDetails.released && parseInt(gameDetails.released.split("-")[0]) < 2000 && (
                <div className={styles.retroSection}>
                  <strong>{t('game_page.details.play_retro')}</strong>
                  <div className={styles.storesList}>
                    <a
                      href={`https://archive.org/details/softwarelibrary_msdos_games?query=${encodeURIComponent(gameDetails.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.retroBadge}
                    >
                      {t('game_page.details.search_archive')}
                    </a>
                  </div>
                </div>
              )}

              {/* Price Comparison */}
              {(dealsLoading || deals.length > 0) && (
                <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
                  <summary>{t('game_page.details.best_deals')}</summary>
                <div className={styles.dealsSection}>
                  {dealsLoading ? (
                    <p className={styles.dealsLoader}>{t('game_page.details.searching_deals')}</p>
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
                </details>
              )}

              {gameDetails.stores && gameDetails.stores.length > 0 && (
                <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
                  <summary>{t('game_page.details.official_stores')}</summary>
                <div className={styles.storesSection}>
                  <div className={styles.storesList}>
                    {gameDetails.stores.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.storeBadge}
                      >
                        {s.store.name || t('game_page.details.visit_store')}
                      </a>
                    ))}
                  </div>
                </div>
                </details>
              )}
            </div>

            <div className={styles.gameMediaContainer}>
              {allImages.length > 0 && (
                <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
                  <summary>{t('game_page.details.gallery')}</summary>
                <div className={styles.screenshotsSection}>
                  <div className={styles.screenshotsGallery}>
                    {allImages.map((src, index) => (
                      <img
                        key={index}
                        className={styles.screenshotImage}
                        src={src}
                        alt={`${gameDetails.name} screenshot ${index + 1}`}
                        loading="lazy"
                        width={1280}
                        height={720}
                        onClick={() => setModalIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                </details>
              )}
            </div>
          </div>

          {trailers.length > 0 && (
            <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
              <summary>{t('game_page.details.trailers')}</summary>
            <div className={styles.trailersSection}>
              <div className={styles.trailersGallery}>
                {trailers.map((src, index) => (
                  <div key={index} className={styles.trailerItem}>
                    <video
                      controls
                      width="100%"
                      src={src}
                      title={`${gameDetails.name} trailer ${index + 1}`}
                    >
                      {t('game_page.details.browser_unsupported')}
                    </video>
                  </div>
                ))}
              </div>
            </div>
            </details>
          )}

          <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
            <summary>{t('game_page.details.soundtracks')}</summary>
          <YouTubeSection 
            title={t('game_page.details.soundtracks')} 
            videos={youtubeMedia.ost} 
            loading={youtubeLoading} 
          />
          </details>

          <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
            <summary>{t('game_page.details.reviews')}</summary>
          <YouTubeSection 
            title={t('game_page.details.reviews')} 
            videos={youtubeMedia.reviews} 
            loading={youtubeLoading} 
          />
          </details>

          {gameDetails.additions && gameDetails.additions.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.sectionHeading}>{t('game_page.details.dlcs')}</h2>
              <div className={styles.relatedGrid}>
                {gameDetails.additions.map((addition) => (
                  <Link 
                    to={gamePath(addition.id)} 
                    key={addition.id} 
                    className={styles.relatedItem}
                  >
                    <img 
                      src={addition.background_image} 
                      alt={addition.name} 
                      className={styles.relatedImage}
                      loading="lazy"
                      width={320}
                      height={180}
                    />
                    <span className={styles.relatedName}>{addition.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {gameDetails.game_series && gameDetails.game_series.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.sectionHeading}>{t('game_page.details.series')}</h2>
              <div className={styles.relatedGrid}>
                {gameDetails.game_series.map((seriesGame) => (
                  <Link 
                    to={gamePath(seriesGame.id)} 
                    key={seriesGame.id} 
                    className={styles.relatedItem}
                  >
                    <img 
                      src={seriesGame.background_image} 
                      alt={seriesGame.name} 
                      className={styles.relatedImage}
                      loading="lazy"
                      width={320}
                      height={180}
                    />
                    <span className={styles.relatedName}>{seriesGame.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <RawgCredit />

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
