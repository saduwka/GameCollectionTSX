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
import { gameMetaDescription } from "../../seo/gameMetaDescription";
import { SITE_ORIGIN } from "../../site";
import { collectionsByGameId } from "../../data/collections";
import { track } from "../../services/analytics/track";
import { useMyDevices } from "../../hooks/useMyDevices";
import EveningFacts from "./EveningFacts";

import { searchGameDeals, getStoreName, fetchCheapSharkStores } from "../../services/stores/cheapSharkService";
import { getGameMedia } from "../../services/media/youtubeService";
import { fetchGames } from "../../services/games/fetchGames";
import { isSafeCandidate, MIN_RATINGS } from "../../services/recommendations/safeCandidate";
import { esrbKey, formatRelease, localizedGenre, localizedTag } from "../../seo/labels";
import LoginButton from "../../components/LoginButton/LoginButton";
import styles from './GamePage.module.scss';

const STATUS_OPTIONS: GameStatus[] = ["Backlog", "Playing", "Completed", "Dropped", "Wishlist", "Liked", "Not Interested"];

const GamePage: React.FC = () => {
  const { id, platformId } = useParams<{ id: string; platformId?: string }>();
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(platformId || null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [extraTrailers, setExtraTrailers] = useState(false);
  const [wideLayout, setWideLayout] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deviceIds } = useMyDevices();
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

  const { data: storeCatalog = [] } = useQuery({
    queryKey: ["cheapshark-stores"],
    queryFn: fetchCheapSharkStores,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const namedDeals = deals.flatMap((deal) => {
    const name = getStoreName(deal.storeID, storeCatalog);
    return name ? [{ ...deal, name }] : [];
  });

  const { data: similarGames = [], isFetched: similarFetched, isError: similarFailed } = useQuery({
    queryKey: ["similar", gameDetails?.id, gameDetails?.primaryGenre?.slug],
    queryFn: async () => {
      const page = await fetchGames(1, "-added", undefined, gameDetails!.primaryGenre!.slug);
      return page.games
        .filter((game) => game.id !== gameDetails!.id && isSafeCandidate(game, { minRatings: MIN_RATINGS }))
        .slice(0, 8);
    },
    enabled: Boolean(gameDetails?.primaryGenre?.slug),
    retry: false,
  });
  const [similarWaited, setSimilarWaited] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSimilarWaited(true), 8000);
    return () => window.clearTimeout(timer);
  }, [id]);

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

  useEffect(() => {
    if (platformId || !deviceIds[0] || !gameDetails) return;
    const match = gameDetails.platforms.some((item) => item.platform.id === deviceIds[0]);
    if (match) setSelectedPlatformId(String(deviceIds[0]));
  }, [deviceIds, gameDetails, platformId]);

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
        track("collection_add", { game_id: gameDetails.id, status: newStatus });
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
  const listed = game ? collectionsByGameId(game.id) : [];
  const platformNames = game
    ? (game.parentPlatforms?.length ? game.parentPlatforms : game.platforms.map((item) => item.platform.name))
    : [];
  const metaDescription = game
    ? gameMetaDescription(
        {
          id: game.id,
          name: game.name,
          released: game.released,
          genres: game.genres,
          platforms: platformNames,
          metacritic: game.metacritic,
          playtime: game.playtime,
          collectionTitle: listed[0] ? (i18n.language.startsWith("en") ? listed[0].title.en : listed[0].title.ru) : undefined,
        },
        i18n.language.startsWith("en"),
      )
    : t("catalog.description");

  return (
    <>
      {game && (
        <>
          <PageMeta
            title={`${game.name} — обзор, платформы, похожие игры`}
            description={metaDescription}
            image={game.background_image}
            type="article"
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
        <div className={styles.gamePageContainer} data-seo-ready={!gameDetails.primaryGenre?.slug || similarFetched || similarFailed || similarWaited ? "true" : undefined}>
          <nav className={styles.crumbs} aria-label="breadcrumb">
            <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
              {t("game_page.back")}
            </button>
            <Link to="/">{t("common.home")}</Link>
            <span aria-hidden="true">/</span>
            <Link to={gamesPath()}>{t("common.games")}</Link>
            {gameDetails.primaryGenre ? (
              <>
                <span aria-hidden="true">/</span>
                <Link to={genrePath(gameDetails.primaryGenre.slug)}>
                  {localizedGenre(gameDetails.primaryGenre.name, i18n.language.startsWith("en"), gameDetails.primaryGenre.slug) || gameDetails.primaryGenre.name}
                </Link>
              </>
            ) : null}
            <span aria-hidden="true">/</span>
            <span>{gameDetails.name}</span>
          </nav>

          <div className={styles.hero}>
            {gameDetails.background_image ? (
              <img
                className={styles.cover}
                src={gameDetails.background_image}
                alt=""
                width={640}
                height={360}
                fetchPriority="high"
              />
            ) : null}
            <div>
              <h1 className={styles.gamePageHeader}>{gameDetails.name}</h1>
              <p className={styles.kicker}>
                {[
                  gameDetails.released?.slice(0, 4),
                  localizedGenre(gameDetails.genres[0] || "", i18n.language.startsWith("en"), gameDetails.primaryGenre?.slug) || (i18n.language.startsWith("en") ? gameDetails.genres[0] : ""),
                  gameDetails.developers?.[0]?.name,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <EveningFacts game={gameDetails} />
            </div>
          </div>

          {gameDetails.platforms.length > 0 && (
            <div className={styles.platformChips}>
              <Link
                to={gamePath(gameDetails.id)}
                className={!selectedPlatformId ? styles.platformChipActive : styles.platformChip}
                onClick={() => setSelectedPlatformId(null)}
              >
                {t("game_page.general_info")}
              </Link>
              {gameDetails.platforms.map((platform) => (
                <Link
                  key={platform.platform.id}
                  to={`/game/${gameDetails.id}/${platform.platform.id}`}
                  className={String(platform.platform.id) === selectedPlatformId ? styles.platformChipActive : styles.platformChip}
                  onClick={() => setSelectedPlatformId(String(platform.platform.id))}
                >
                  {platform.platform.name}
                </Link>
              ))}
            </div>
          )}

          <div className={styles.topActions}>
            {user ? (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => setStatusMenuOpen((open) => !open)}
                disabled={isCollectionActionLoading}
              >
                {collectionStatus ? t(`game_page.status.${collectionStatus}`) : t("game_page.add_to_collection")}
              </button>
            ) : (
              <LoginButton />
            )}
            <button
              onClick={() => handleToggleCompare(gameDetails)}
              className={`${styles.compareButton} ${isInComparison(gameDetails.id) ? styles.compareButtonActive : ""}`}
              aria-pressed={isInComparison(gameDetails.id)}
            >
              {isInComparison(gameDetails.id) ? t("game_page.in_compare") : t("compare.add_hint")}
            </button>
          </div>
          {user && statusMenuOpen && (
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
                {formatRelease(currentPlatformInfo?.released_at || gameDetails.released, i18n.language)}
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

              {gameDetails.esrb_rating && esrbKey(gameDetails.esrb_rating) && (
                <p>
                  <strong>{t('game_page.details.esrb')}</strong> {t(`esrb.${esrbKey(gameDetails.esrb_rating)}`)}
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

              {gameDetails.tags && gameDetails.tags.some((tag) => localizedTag(tag.slug, tag.name, i18n.language.startsWith("en"))) && (
                <div className={styles.tagsSection}>
                  <strong>{t('game_page.details.tags')}</strong>
                  <div className={styles.tags}>
                    {gameDetails.tags.slice(0, 15).flatMap((tag) => {
                      const label = localizedTag(tag.slug, tag.name, i18n.language.startsWith("en"));
                      if (!label) return [];
                      return [(
                      <Link 
                        key={tag.id} 
                        to={`${gamesPath()}?tag=${tag.id}`} 
                        className={styles.tagBadge}
                        style={{ textDecoration: "none" }}
                      >
                        {label}
                      </Link>
                      )];
                    })}
                  </div>
                </div>
              )}

              <div className={styles.descriptionSection}>
                <strong>{t('game_page.details.description')}</strong>
                {!loadingWiki && !gameWiki && gameDetails.description && (
                  <p className={styles.rawgNote}>{t("game_page.details.rawg_note")}</p>
                )}
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
                  <a className={styles.sourceLink} href={gameWiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer">{t('game_page.details.wiki_source')}</a>
                )}
              </div>

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

              <div id="where-to-play" />
              {/* Price Comparison */}
              {(dealsLoading || namedDeals.length > 0) && (
                <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
                  <summary>{t('game_page.details.best_deals')}</summary>
                <div className={styles.dealsSection}>
                  <p className={styles.rawgNote}>{t("game_page.prices_note")}</p>
                  {dealsLoading ? (
                    <p className={styles.dealsLoader}>{t('game_page.details.searching_deals')}</p>
                  ) : (
                    <div className={styles.dealsList}>
                      {namedDeals.map((deal) => (
                        <a
                          key={deal.dealID}
                          href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.dealItem}
                          onClick={() => track("store_click", { game_id: gameDetails.id, store: deal.name })}
                        >
                          <span className={styles.storeName}>{deal.name}</span>
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
                    {gameDetails.stores.filter((store) => store.store.name).map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.storeBadge}
                        onClick={() => track("store_click", { game_id: gameDetails.id, store: s.store.name })}
                      >
                        {s.store.name}
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
                {(extraTrailers ? trailers : trailers.slice(0, 1)).map((src, index) => (
                  <div key={src} className={styles.trailerItem}>
                    <video
                      controls
                      width="100%"
                      poster={gameDetails.trailerPosters?.[index] || gameDetails.background_image}
                      src={src}
                      title={`${gameDetails.name} trailer ${index + 1}`}
                    >
                      {t('game_page.details.browser_unsupported')}
                    </video>
                  </div>
                ))}
              </div>
              {trailers.length > 1 && !extraTrailers && (
                <button type="button" className={styles.textButton} onClick={() => setExtraTrailers(true)}>
                  {t("game_page.details.more_trailers", { count: trailers.length - 1 })}
                </button>
              )}
            </div>
            </details>
          )}

          {youtubeMedia.ost.length > 0 && (
          <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
            <summary>{t('game_page.details.soundtracks')}</summary>
          <YouTubeSection 
            title={t('game_page.details.soundtracks')} 
            videos={youtubeMedia.ost} 
            loading={youtubeLoading} 
          />
          </details>
          )}

          {youtubeMedia.reviews.length > 0 && (
          <details className={styles.fold} {...(wideLayout ? { open: true } : {})}>
            <summary>{t('game_page.details.reviews')}</summary>
          <YouTubeSection 
            title={t('game_page.details.reviews')} 
            videos={youtubeMedia.reviews} 
            loading={youtubeLoading} 
          />
          </details>
          )}

          {similarGames.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.sectionHeading}>{t("game_page.similar")}</h2>
              <div className={styles.relatedGrid}>
                {similarGames.map((game) => (
                  <Link to={gamePath(game.id)} key={game.id} className={styles.relatedItem}>
                    {game.background_image ? (
                      <img src={game.background_image} alt="" className={styles.relatedImage} loading="lazy" width={320} height={180} />
                    ) : (
                      <span className={styles.relatedFallback} aria-hidden="true" />
                    )}
                    <span className={styles.relatedName}>{game.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
                    {addition.background_image ? (
                    <img 
                      src={addition.background_image} 
                      alt="" 
                      className={styles.relatedImage}
                      loading="lazy"
                      width={320}
                      height={180}
                    />
                    ) : (
                      <span className={styles.relatedFallback} aria-hidden="true" />
                    )}
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
