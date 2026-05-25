// FILE: src/components/SwipeCard/SwipeCard.tsx
import { useState } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { Game } from "../../types/game";
import styles from "./SwipeCard.module.css";

interface SwipeCardProps {
  game: Game;
  /** Глубина в стопке: 0 — верхняя (активная), 1 — следующая, 2 — третья. Влияет на масштаб/смещение. */
  stackIndex: number;
  /** Срабатывает, когда карточку увели за пределы порога. */
  onSwiped: (direction: "left" | "right", game: Game) => void;
  /** Если true — карточка не реагирует на drag (например, нижние). */
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 120; // px — насколько надо утащить, чтобы свайп засчитался
const VELOCITY_THRESHOLD = 500; // px/s — быстрый флик тоже свайп

const SwipeCard = ({ game, stackIndex, onSwiped, disabled = false }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [0, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, 0], [1, 0]);

  const [exitX, setExitX] = useState<number>(0);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      setExitX(800);
      onSwiped("right", game);
    } else if (offset < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD) {
      setExitX(-800);
      onSwiped("left", game);
    }
    // иначе — пружина вернёт карточку обратно
  };

  // Стек: верхняя видна полностью, следующие — масштабированы и сдвинуты вниз
  const scale = 1 - stackIndex * 0.04;
  const y = stackIndex * 14;

  // Описание: первые 180 символов без HTML-тегов
  const cleanDescription = (game.description || "")
    .replace(/<[^>]*>/g, "")
    .slice(0, 180);

  const year = game.released && game.released !== "Unknown"
    ? game.released.split("-")[0]
    : null;

  return (
    <motion.div
      className={styles.card}
      style={{
        x: stackIndex === 0 ? x : 0,
        rotate: stackIndex === 0 ? rotate : 0,
        scale,
        y,
        zIndex: 100 - stackIndex,
      }}
      drag={stackIndex === 0 && !disabled ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX, opacity: 0, transition: { duration: 0.35 } } : {}}
      whileTap={{ cursor: "grabbing" }}
    >
      {/* Фоновое изображение */}
      <div
        className={styles.bgImage}
        style={{
          backgroundImage: game.background_image
            ? `url(${game.background_image})`
            : "linear-gradient(135deg, #667eea, #764ba2)",
        }}
      >
        <div className={styles.gradient} />
      </div>

      {/* LIKE / NOPE индикаторы — появляются при драге */}
      {stackIndex === 0 && (
        <>
          <motion.div className={`${styles.stamp} ${styles.likeStamp}`} style={{ opacity: likeOpacity }}>
            LIKE
          </motion.div>
          <motion.div className={`${styles.stamp} ${styles.nopeStamp}`} style={{ opacity: nopeOpacity }}>
            NOPE
          </motion.div>
        </>
      )}

      {/* Контент карточки */}
      <div className={styles.content}>
        <h2 className={styles.title}>{game.name}</h2>

        <div className={styles.metaRow}>
          {game.rating > 0 && (
            <span className={styles.rating}>⭐ {game.rating.toFixed(1)}</span>
          )}
          {year && <span className={styles.year}>{year}</span>}
          {(game.playtime ?? 0) > 0 && (
            <span className={styles.playtime}>🕐 ~{game.playtime}ч</span>
          )}
        </div>

        {game.genres && game.genres.length > 0 && (
          <div className={styles.genres}>
            {game.genres.slice(0, 4).map((g) => (
              <span key={g} className={styles.genreTag}>{g}</span>
            ))}
          </div>
        )}

        {cleanDescription && (
          <p className={styles.description}>{cleanDescription}…</p>
        )}
      </div>
    </motion.div>
  );
};

export default SwipeCard;
