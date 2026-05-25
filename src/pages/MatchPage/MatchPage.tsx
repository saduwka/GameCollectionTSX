// FILE: src/pages/MatchPage/MatchPage.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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
import LoadingErrorMessage from "../../components/LoadingErrorMessage/LoadingErrorMessage";
import { toast } from "react-hot-toast";
import type { Game } from "../../types/game";
import styles from "./MatchPage.module.css";

const POOL_PAGES = 5; // 5 страниц × 20 игр = 100 игр в начальном пуле

const MatchPage = () => {
  const { user } = useAuth();

  // Загружаем большой пул топ-игр (5 страниц по 20). Параллельно.
  const { data: pool = [], isLoading, isError, error } = useQuery({
    queryKey: ["matchPool", "v1"],
    queryFn: async (): Promise<Game[]> => {
      const pages = await Promise.all(
        Array.from({ length: POOL_PAGES }, (_, i) =>
          fetchGames(i + 1, "-rating")
        )
      );
      const allGames = pages.flatMap((p) => p.games);
      // Уникализируем по id (на всякий)
      const seen = new Set<number>();
      return allGames.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });
    },
    staleTime: 1000 * 60 * 30, // 30 минут — пул живёт долго
  });

  // Коллекция залогиненного пользователя — исключаем уже добавленные игры
  const { data: userCollection = [] } = useQuery({
    queryKey: ["userCollection", user?.uid],
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  // Свайпы из localStorage. Держим в state, чтобы UI обновлялся при каждом свайпе.
  const [swipes, setSwipes] = useState<SwipeRecord[]>(() => getAllSwipes());

  // Refs всех видимых карточек по game.id. Кнопки ✕/♥ берут ref у верхней
  // карточки и дёргают её swipe(). Через Map потому что при перестроении стопки
  // (B становится верхней после улёта A) ref должен обновляться без потерь.
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

  // Видны 3 верхние карточки одновременно (стопка)
  const visibleCards = feed.slice(0, 3);

  // Кнопки ✕/♥: берём handle верхней карточки и дёргаем swipe()
  const triggerSwipe = (direction: "left" | "right") => {
    const topGame = visibleCards[0];
    if (!topGame) return;
    cardRefs.current.get(topGame.id)?.swipe(direction);
  };

  const handleSwiped = useCallback(
    async (direction: "left" | "right", game: Game) => {
      const action = direction === "right" ? "like" : "dislike";

      // 1. Записываем свайп локально
      const tags = (game as Game & { tags?: { id: number; name: string }[] }).tags;
      recordSwipe({
        gameId: game.id,
        gameName: game.name,
        action,
        genres: game.genres || [],
        tags: tags?.map((t) => t.name) || [],
      });
      setSwipes(getAllSwipes());

      // 2. Если залогинен — пишем в Firestore коллекцию (Liked / Not Interested)
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
            toast.success(`«${game.name}» в лайках`, { duration: 1500 });
          }
        } catch (e) {
          console.error("Не удалось сохранить в коллекцию:", e);
        }
      }
    },
    [user]
  );

  const handleResetSwipes = () => {
    if (!confirm("Сбросить всю историю свайпов? Это действие нельзя отменить.")) return;
    clearSwipes();
    setSwipes([]);
    toast.success("История свайпов очищена");
  };

  // Статистика
  const totalSwipes = swipes.length;
  const likeCount = swipes.filter((s) => s.action === "like").length;
  const topGenres = getTopGenres(swipes, 3);

  // Триггерим перерисовку счётчика, если localStorage менялся в другой вкладке
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "playhub:swipes:v1") {
        setSwipes(getAllSwipes());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (isError) {
    return (
      <LoadingErrorMessage
        loading={false}
        noResults={false}
        error={(error as Error)?.message || "Не удалось загрузить игры"}
        message="Ошибка загрузки"
      />
    );
  }

  return (
    <div className={styles.page}>
      <PageMeta
        title="Подбор игр"
        description="Свайпай игры вправо, если нравятся, и влево, если нет. PlayHub учится на твоих свайпах и подбирает следующие карточки."
      />

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Свайпай и находи</h1>
          <p className={styles.subtitle}>
            Вправо — нравится, влево — нет. Чем больше свайпаешь, тем точнее подбор.
          </p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalSwipes}</span>
            <span className={styles.statLabel}>свайпов</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{likeCount}</span>
            <span className={styles.statLabel}>лайков</span>
          </div>
        </div>
      </header>

      {topGenres.length > 0 && (
        <div className={styles.tasteRow}>
          <span className={styles.tasteLabel}>Твой вкус:</span>
          {topGenres.map((g) => (
            <span key={g} className={styles.tasteChip}>{g}</span>
          ))}
        </div>
      )}

      <div className={styles.stage}>
        {isLoading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p>Загружаем игры…</p>
          </div>
        ) : visibleCards.length === 0 ? (
          <div className={styles.emptyBox}>
            <div className={styles.emptyEmoji}>🎯</div>
            <h2>Карточки кончились</h2>
            <p>
              Ты пересвайпал всю нашу подборку. {user ? "Загляни в коллекцию." : "Залогинься, чтобы видеть свои лайки на всех устройствах."}
            </p>
            {user ? (
              <Link to="/collection" className={styles.primaryBtn}>
                Моя коллекция
              </Link>
            ) : (
              <Link to="/profile" className={styles.primaryBtn}>
                Войти
              </Link>
            )}
            <button className={styles.ghostBtn} onClick={handleResetSwipes}>
              Сбросить историю
            </button>
          </div>
        ) : (
          <div className={styles.cardStack}>
            <AnimatePresence>
              {visibleCards.map((game, idx) => (
                <SwipeCard
                  key={game.id}
                  ref={setCardRef(game.id)}
                  game={game}
                  stackIndex={idx}
                  onSwiped={handleSwiped}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {visibleCards.length > 0 && !isLoading && (
        <>
          <div className={styles.actionRow}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.nopeBtn}`}
              aria-label="Не нравится"
              onClick={() => triggerSwipe("left")}
            >
              ✕
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.likeBtn}`}
              aria-label="Нравится"
              onClick={() => triggerSwipe("right")}
            >
              ♥
            </button>
          </div>

          {!user && totalSwipes >= 3 && (
            <div className={styles.guestHint}>
              <span>💡 </span>
              <Link to="/profile">Войди</Link>, чтобы сохранить лайки и видеть их на всех устройствах
            </div>
          )}

          {totalSwipes > 0 && (
            <div className={styles.footerRow}>
              {user && likeCount > 0 && (
                <Link to="/collection" className={styles.linkBtn}>
                  Лайки ({likeCount}) →
                </Link>
              )}
              <button className={styles.linkBtn} onClick={handleResetSwipes}>
                Сбросить ({getSwipeCount()})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MatchPage;
