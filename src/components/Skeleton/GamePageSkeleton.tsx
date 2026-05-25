import React from "react";
import Skeleton from "./Skeleton";
import styles from "./GamePageSkeleton.module.css";

const GamePageSkeleton: React.FC = () => {
  return (
    <div className={styles.container} aria-busy="true" aria-label="Загружаем игру">
      <div className={styles.topActions}>
        <Skeleton width="80px" height="32px" borderRadius="8px" />
        <Skeleton width="180px" height="32px" borderRadius="8px" />
      </div>

      <Skeleton width="60%" height="2.5rem" borderRadius="6px" />

      <div className={styles.wrapper}>
        <div className={styles.details}>
          <div className={styles.statusBlock}>
            <Skeleton width="160px" height="1rem" />
            <div className={styles.statusRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} width="80px" height="32px" borderRadius="6px" />
              ))}
            </div>
          </div>

          <div className={styles.facts}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width={`${60 + (i * 7) % 30}%`} height="1.1rem" />
            ))}
          </div>

          <div className={styles.tags}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} width={`${50 + (i * 13) % 80}px`} height="24px" borderRadius="12px" />
            ))}
          </div>

          <div className={styles.descriptionBlock}>
            <Skeleton width="120px" height="1rem" />
            <Skeleton width="100%" height="0.9rem" />
            <Skeleton width="96%" height="0.9rem" />
            <Skeleton width="88%" height="0.9rem" />
            <Skeleton width="92%" height="0.9rem" />
          </div>
        </div>

        <div className={styles.media}>
          <Skeleton width="100%" height="280px" borderRadius="8px" />
          <div className={styles.gallery}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="100px" borderRadius="6px" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePageSkeleton;
