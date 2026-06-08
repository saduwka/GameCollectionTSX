import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { fetchGames } from "../../services/games/fetchGames";
import {
  recordSwipe,
  getAllSwipes,
  getSwipeCount,
  clearSwipes,
  type SwipeRecord,
} from "../../services/match/swipeStore";
import {
  rankFeed,
  getTopGenres,
} from "../../services/match/feedAlgorithm";
import {
  addToCollection,
  getUserCollection,
} from "../../services/collection/collectionService";
import SwipeCard, { type SwipeCardHandle } from "../../components/SwipeCard/SwipeCard";
import PageMeta from "../../components/PageMeta/PageMeta";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import type { Game } from "../../types/game";
import styles from "./MatchPage.module.scss";

const MatchPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [swipes, setSwipes] = useState<SwipeRecord[]>(() => getAllSwipes());

  // Топ-жанры пользователя для динамической подгрузки
  const genresForPool = useMemo(() => getTopGenres(swipes, 2), [swipes]);

  // 1. Загружаем начальный глобальный пул
  const { data: globalPool = [], isLoading: isGlobalLoading } = useQuery({
    queryKey: ["matchPool", "global"],
    queryFn: async (): Promise<Game[]> => {
      const page = await fetchGames(1, "-rating");
      return page.games;
    },
    staleTime: 1000 * 60 * 60, // 1 час
  });

  // 2. Загружаем персональный пул на основе жанров (если они есть)
  const { data: personalPool = [], isLoading: isPersonalLoading } = useQuery({
    queryKey: ["matchPool", "personal", genresForPool],
    queryFn: async (): Promise<Game[]> => {
      if (genresForPool.length === 0) return [];
      
      const pages = await Promise.all(
        genresForPool.map((genre) => 
          fetchGames(1, "-added", undefined, genre.toLowerCase().replace(/ /g, "-"))
        )
      );
      return pages.flatMap(p => p.games);
    },
    enabled: genresForPool.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // Объединяем пулы
  const pool = useMemo(() => {
    const all = [...globalPool, ...personalPool];
    const seen = new Set<number>();
    return all.filter((g) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [globalPool, personalPool]);

  // Коллекция залогиненного пользователя — исключаем уже добавленные игры
  const { data: userCollection = [] } = useQuery({
    queryKey: ["userCollection", user?.uid],
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  // Refs всех видимых карточек
  const cardRefs = useRef<Map<number, SwipeCardHandle | null>>(new Map());

  const setCardRef = useCallback((gameId: number) => (handle: SwipeCardHandle | null) => {
    if (handle) {
      cardRefs.current.set(gameId, handle);
    } else {
      cardRefs.current.delete(gameId);
    }
  }, []);

  // Игры из коллекции — исключаем из пула
  const excludeIds = useMemo(
    () => new Set(userCollection.map((g) => g.id)),
    [userCollection]
  );

  // Ранжируем пул на основе текущих свайпов
  const feed = useMemo(
    () => rankFeed(pool, swipes, excludeIds),
    [pool, swipes, excludeIds]
  );

  // Стейт для визуальной стопки
  const [stack, setStack] = useState<Game[]>([]);

  // Инициализация и обновление стопки при изменении feed
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

  const handleSwiped = useCallback(
    async (direction: "left" | "right", game: Game) => {
      const action = direction === "right" ? "like" : "dislike";

      const tags = (game as Game & { tags?: { id: number; name: string }[] }).tags;
      recordSwipe({
        gameId: game.id,
        gameName: game.name,
        action,
        genres: game.genres || [],
        tags: tags?.map((t) => t.name) || [],
      });
      
      const updatedSwipes = getAllSwipes();
      setSwipes(updatedSwipes);

      setStack((prev) => {
        const nextStack = prev.filter((c) => c.id !== game.id);
        const swipedIds = new Set(updatedSwipes.map((s) => String(s.gameId)));
        const nextGame = feed.find(
          (f) => !nextStack.find((c) => c.id === f.id) && !swipedIds.has(String(f.id))
        );
        return nextGame ? [...nextStack, nextGame] : nextStack;
      });

      if (user) {
        try {
          await addToCollection({
            id: game.id,
            name: game.name,
            background_image: game.background_image,
            genres: game.genres || [],
            status: action === "like" ? "Liked" : "Not Interested",
          });
          if (action === "like") {
            toast.success(t('game_page.toasts.added_to_collection', { name: game.name }));
          }
        } catch (e) {
          console.error(t('common.save_error'), e);
        }
      }
    },
    [user, t, feed]
  );

  const handleResetSwipes = () => {
    if (!confirm(t('match.reset_history_confirm'))) return;
    clearSwipes();
    setSwipes([]);
    toast.success(t('match.history_cleared'));
  };

  const totalSwipes = swipes.length;
  const likeCount = swipes.filter((s) => s.action === "like").length;
  const currentTopGenres = getTopGenres(swipes, 3);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "playhub:swipes:v1") {
        setSwipes(getAllSwipes());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isLoading = isGlobalLoading || (genresForPool.length > 0 && isPersonalLoading);

  if (isGlobalLoading && globalPool.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageMeta
        title={t('match.title')}
        description={t('match.description')}
      />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('match.title')}</h1>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalSwipes}</span>
            <span className={styles.statLabel}>{t('common.searching').split(' ')[0]}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{likeCount}</span>
            <span className={styles.statLabel}>{t('match.like')}</span>
          </div>
        </div>
      </header>

      {currentTopGenres.length > 0 && (
        <div className={styles.tasteRow}>
          <span className={styles.tasteLabel}>{t('compare.genres').split(' ')[0]}:</span>
          {currentTopGenres.map((g) => (
            <span key={g} className={styles.tasteChip}>{g}</span>
          ))}
        </div>
      )}

      <div className={styles.stage}>
        {isLoading && stack.length === 0 ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p>{t('common.loading')}</p>
          </div>
        ) : stack.length === 0 ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyEmoji}>🎯</div>
            <h2>{t('match.empty_state')}</h2>
            <p>
              {t('match.empty_state')} {user ? t('match.check_collection') : t('match.login_hint')}
            </p>
            {user ? (
              <Link to="/collection" className={styles.primaryBtn}>
                {t('common.my_collection')}
              </Link>
            ) : (
              <Link to="/profile" className={styles.primaryBtn}>
                {t('auth.login_google')}
              </Link>
            )}
            <button className={styles.ghostBtn} onClick={handleResetSwipes}>
              {t('common.clear')}
            </button>
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

      {stack.length > 0 && (
        <>
          <div className={styles.actionRow}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.nopeBtn}`}
              aria-label={t('match.dislike')}
              onClick={() => triggerSwipe("left")}
            >
              ✕
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.likeBtn}`}
              aria-label={t('match.like')}
              onClick={() => triggerSwipe("right")}
            >
              ♥
            </button>
          </div>

          <p className={styles.matchDescription}>
            {t('match.description')}
          </p>

          {!user && totalSwipes >= 3 && (
            <div className={styles.guestHint}>
              <span>💡 </span>
              <Link to="/profile">{t('auth.login_google').split(' ')[0]}</Link>, {t('match.login_hint').split(',')[1]}
            </div>
          )}

          {totalSwipes > 0 && (
            <div className={styles.footerRow}>
              {user && likeCount > 0 && (
                <Link to="/collection" className={styles.linkBtn}>
                  {t('match.like')} ({likeCount}) →
                </Link>
              )}
              <button className={styles.linkBtn} onClick={handleResetSwipes}>
                {t('common.clear')} ({getSwipeCount()})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MatchPage;
