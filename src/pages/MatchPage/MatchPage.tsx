import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { gamePath } from "../../seo/canonicalUrl";
import { useAuth } from "../../context/AuthContext";
import { fetchGames } from "../../services/games/fetchGames";
import { RAWG_LIST_STALE_TIME } from "../../services/rawgCache";
import {
  recordSwipe,
  getAllSwipes,
  getSwipeCount,
  clearSwipes,
  type SwipeRecord,
} from "../../services/match/swipeStore";
import { getGuestPicks, saveGuestPick } from "../../services/match/guestPickStore";
import { rankFeed, getTopGenres } from "../../services/match/feedAlgorithm";
import { addToCollection, addToCollectionIfMissing, getUserCollection } from "../../services/collection/collectionService";
import { collectionKeys, invalidateUserLibrary } from "../../services/collection/queryKeys";
import {
  PICKS_AFTER_SWIPES,
  RECOMMENDATION_STALE_TIME,
  fetchScoredRecommendations,
} from "../../services/recommendations/scoring";
import { useMyDevices } from "../../hooks/useMyDevices";
import DevicePicker from "../../components/DevicePicker/DevicePicker";
import type { DeviceChoice } from "../../services/platforms/deviceStore";
import SwipeCard, { type SwipeCardHandle } from "../../components/SwipeCard/SwipeCard";
import PageMeta from "../../components/PageMeta/PageMeta";
import Ticket from "../../components/ui/Ticket";
import Button from "../../components/ui/Button";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import type { Game } from "../../types/game";
import styles from "./MatchPage.module.scss";

const MatchPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { devices, deviceIds, confirm: confirmDevices, confirmed, isLoading: devicesLoading } = useMyDevices();
  const [draftDevices, setDraftDevices] = useState<DeviceChoice[]>(devices);
  const [swipes, setSwipes] = useState<SwipeRecord[]>(() => getAllSwipes());
  const [picksDismissed, setPicksDismissed] = useState(false);
  const [savedPickIds, setSavedPickIds] = useState<number[]>(() => getGuestPicks().map((pick) => pick.id));

  useEffect(() => {
    if (devices.length > 0) setDraftDevices(devices);
  }, [devices]);

  const platformParam = deviceIds.join(",");
  const genresForPool = useMemo(() => getTopGenres(swipes, 2), [swipes]);

  const { data: globalPool = [], isLoading: isGlobalLoading } = useQuery({
    queryKey: ["matchPool", "global", platformParam],
    queryFn: async (): Promise<Game[]> => {
      const page = await fetchGames(1, "-rating", "", "", platformParam);
      return page.games;
    },
    enabled: confirmed,
    staleTime: RAWG_LIST_STALE_TIME * 2,
  });

  const { data: personalPool = [], isLoading: isPersonalLoading } = useQuery({
    queryKey: ["matchPool", "personal", genresForPool, platformParam],
    queryFn: async (): Promise<Game[]> => {
      if (genresForPool.length === 0) return [];
      const pages = await Promise.all(
        genresForPool.map((genre) =>
          fetchGames(1, "-added", undefined, genre.toLowerCase().replace(/ /g, "-"), platformParam)
        )
      );
      return pages.flatMap((page) => page.games);
    },
    enabled: confirmed && genresForPool.length > 0,
    staleTime: RAWG_LIST_STALE_TIME,
  });

  const pool = useMemo(() => {
    const all = [...globalPool, ...personalPool];
    const seen = new Set<number>();
    return all.filter((game) => {
      if (seen.has(game.id)) return false;
      seen.add(game.id);
      return true;
    });
  }, [globalPool, personalPool]);

  const { data: userCollection = [] } = useQuery({
    queryKey: collectionKeys.user(user?.uid ?? "guest"),
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  const cardRefs = useRef<Map<number, SwipeCardHandle | null>>(new Map());
  const setCardRef = useCallback((gameId: number) => (handle: SwipeCardHandle | null) => {
    if (handle) cardRefs.current.set(gameId, handle);
    else cardRefs.current.delete(gameId);
  }, []);

  const excludeIds = useMemo(
    () => new Set(userCollection.map((game) => game.id)),
    [userCollection]
  );

  const feed = useMemo(
    () => rankFeed(pool, swipes, excludeIds),
    [pool, swipes, excludeIds]
  );

  const [stack, setStack] = useState<Game[]>([]);

  useEffect(() => {
    if (stack.length === 0 && feed.length > 0) {
      setStack(feed.slice(0, 3));
    }
  }, [feed, stack.length]);

  const triggerSwipe = (direction: "left" | "right") => {
    const topGame = stack[0];
    if (!topGame) return;
    cardRefs.current.get(topGame.id)?.swipe(direction);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") triggerSwipe("left");
      if (event.key === "ArrowRight") triggerSwipe("right");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleSwiped = useCallback(
    async (direction: "left" | "right", game: Game) => {
      const action = direction === "right" ? "like" : "dislike";
      const tags = (game as Game & { tags?: { id: number; name: string }[] }).tags;
      recordSwipe({
        gameId: game.id,
        gameName: game.name,
        action,
        genres: game.genres || [],
        tags: tags?.map((tag) => tag.name) || [],
        background_image: game.background_image,
      });

      const updatedSwipes = getAllSwipes();
      setSwipes(updatedSwipes);

      setStack((prev) => {
        const nextStack = prev.filter((card) => card.id !== game.id);
        const swipedIds = new Set(updatedSwipes.map((swipe) => String(swipe.gameId)));
        const nextGame = feed.find(
          (candidate) => !nextStack.find((card) => card.id === candidate.id) && !swipedIds.has(String(candidate.id))
        );
        return nextGame ? [...nextStack, nextGame] : nextStack;
      });

      if (user) {
        try {
          const added = await addToCollectionIfMissing({
            id: game.id,
            name: game.name,
            background_image: game.background_image,
            genres: game.genres || [],
            status: action === "like" ? "Liked" : "Not Interested",
          });
          if (added) {
            await invalidateUserLibrary(queryClient, user.uid);
            if (action === "like") {
              toast.success(t("game_page.toasts.added_to_collection", { name: game.name }));
            }
          }
        } catch (error) {
          console.error(t("common.save_error"), error);
        }
      }
    },
    [user, t, feed, queryClient]
  );

  const handleResetSwipes = () => {
    if (!confirm(t("match.reset_history_confirm"))) return;
    clearSwipes();
    setSwipes([]);
    setPicksDismissed(false);
    setStack([]);
    toast.success(t("match.history_cleared"));
  };

  const totalSwipes = swipes.length;
  const likeCount = swipes.filter((swipe) => swipe.action === "like").length;
  const currentTopGenres = getTopGenres(swipes, 3);
  const showPicks = confirmed && totalSwipes >= PICKS_AFTER_SWIPES && !picksDismissed;

  const { data: picks = [], isLoading: picksLoading } = useQuery({
    queryKey: [
      ...collectionKeys.recommendationsV2,
      "match-picks",
      user?.uid ?? "guest",
      platformParam,
      swipes.map((swipe) => `${swipe.gameId}:${swipe.action}`).join("|"),
    ],
    queryFn: () =>
      fetchScoredRecommendations({
        collection: userCollection,
        swipes,
        platformIds: deviceIds,
        limit: 12,
      }),
    enabled: showPicks,
    staleTime: RECOMMENDATION_STALE_TIME,
  });

  const visiblePicks = picks.filter(
    (game) => !savedPickIds.includes(game.id) && !excludeIds.has(game.id)
  );

  const handleSavePick = async (game: Game, status: "Wishlist" | "Backlog") => {
    try {
      if (user) {
        await addToCollection({
          id: game.id,
          name: game.name,
          background_image: game.background_image,
          genres: game.genres || [],
          status,
        });
        await invalidateUserLibrary(queryClient, user.uid);
      } else {
        saveGuestPick({
          id: game.id,
          name: game.name,
          background_image: game.background_image,
          genres: game.genres || [],
          status,
        });
        toast.success(t("match.saved_guest"));
      }
      setSavedPickIds((current) => [...current, game.id]);
      if (user) toast.success(t("match.pick_saved", { name: game.name }));
    } catch {
      toast.error(t("common.update_error"));
    }
  };

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "playhub:swipes:v1") setSwipes(getAllSwipes());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isLoading = isGlobalLoading || (genresForPool.length > 0 && isPersonalLoading);

  if (devicesLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className={styles.page}>
        <PageMeta title={t("match.devices_title")} description={t("match.devices_hint")} noindex />
        <h1 className={styles.title}>{t("match.devices_title")}</h1>
        <p className={styles.matchDescription}>{t("match.devices_hint")}</p>
        <DevicePicker selected={draftDevices} onChange={setDraftDevices} />
        <div className={styles.footerRow}>
          <button type="button" className={styles.primaryBtn} onClick={() => confirmDevices(draftDevices)}>
            {t("match.devices_continue")}
          </button>
          <button type="button" className={styles.ghostBtn} onClick={() => confirmDevices([])}>
            {t("match.devices_skip")}
          </button>
        </div>
      </div>
    );
  }

  if (isGlobalLoading && globalPool.length === 0 && !showPicks) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageMeta title={t("match.title")} description={t("match.description")} noindex />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{showPicks ? t("match.picks_title") : t("match.title")}</h1>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{t("match.progress", { current: showPicks ? PICKS_AFTER_SWIPES : totalSwipes % PICKS_AFTER_SWIPES, total: PICKS_AFTER_SWIPES })}</span>
            <span className={styles.statLabel}>{t("match.swipes_label")}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{likeCount}</span>
            <span className={styles.statLabel}>{t("match.like")}</span>
          </div>
        </div>
      </header>

      {currentTopGenres.length > 0 && (
        <div className={styles.tasteRow}>
          <span className={styles.tasteLabel}>{t("match.genres_label")}</span>
          {currentTopGenres.map((genre) => (
            <span key={genre} className={styles.tasteChip}>{genre}</span>
          ))}
        </div>
      )}

      {showPicks ? (
        <section className={styles.picks}>
          <p className={styles.matchDescription}>{t("match.picks_hint")}</p>
          {picksLoading && <p>{t("common.loading")}</p>}
          {visiblePicks.map((game, index) => (
            <Ticket
              key={game.id}
              compact={index > 0}
              kicker={index === 0 ? t("landing.ticket") : t("landing.another")}
              title={game.name}
              meta={<span>{game.genres?.[0] || "—"}</span>}
              why={t(`recommendations.reason.${game.reasonKey}`, game.reasonParams)}
              foot={
                <Link to={gamePath(game.id)}>{t("landing.open")}</Link>
              }
            />
          ))}
          <Button onClick={() => visiblePicks.forEach((game) => void handleSavePick(game, "Wishlist"))}>
            {t("match.save_all")}
          </Button>
          <button type="button" className={styles.ghostBtn} onClick={() => setPicksDismissed(true)}>
            {t("match.continue_swiping")}
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => void navigator.clipboard.writeText(visiblePicks.map((game) => game.name).join("\n"))}
          >
            {t("landing.copy")}
          </button>
        </section>
      ) : (
        <div className={styles.stage}>
          {isLoading && stack.length === 0 ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} />
              <p>{t("common.loading")}</p>
            </div>
          ) : stack.length === 0 ? (
            <div className={styles.emptyBox}>
              <h2>{t("match.empty_state")}</h2>
              <p>
                {t("match.empty_state")} {user ? t("match.check_collection") : t("match.login_hint")}
              </p>
              {user ? (
                <Link to="/collection" className={styles.primaryBtn}>{t("common.my_collection")}</Link>
              ) : (
                <Link to="/profile" className={styles.primaryBtn}>{t("auth.login_google")}</Link>
              )}
              <button className={styles.ghostBtn} onClick={handleResetSwipes}>{t("common.clear")}</button>
            </div>
          ) : (
            <div className={styles.cardStack}>
              <AnimatePresence mode="popLayout">
                {stack.map((game, idx) => (
                  <motion.div
                    key={game.id}
                    layoutId={String(game.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={styles.cardWrapper}
                    style={{ zIndex: stack.length - idx }}
                  >
                    <SwipeCard
                      game={game}
                      ref={setCardRef(game.id)}
                      stackIndex={idx}
                      onSwiped={handleSwiped}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {!showPicks && stack.length > 0 && (
        <>
          <div className={styles.actionRow}>
            <div className={styles.actionItem}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.nopeBtn}`}
                aria-label={t("match.not_mine")}
                onClick={() => triggerSwipe("left")}
              >
                ✕
              </button>
              <span>{t("match.not_mine")}</span>
            </div>
            <div className={styles.actionItem}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.likeBtn}`}
                aria-label={t("match.want")}
                onClick={() => triggerSwipe("right")}
              >
                ♥
              </button>
              <span>{t("match.want")}</span>
            </div>
          </div>
          <p className={styles.matchDescription}>{t("match.description")}</p>
          {!user && totalSwipes >= 3 && (
            <div className={styles.guestHint}>
              <Link to="/profile">{t("auth.login_google")}</Link>
              <span> {t("match.login_hint")}</span>
            </div>
          )}
          {totalSwipes > 0 && (
            <div className={styles.footerRow}>
              {user && likeCount > 0 && (
                <Link to="/collection" className={styles.linkBtn}>
                  {t("match.like")} ({likeCount}) →
                </Link>
              )}
              <button className={styles.linkBtn} onClick={handleResetSwipes}>
                {t("common.clear")} ({getSwipeCount()})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MatchPage;
