import React from "react";
import Skeleton from "./Skeleton";
import GameCardSkeleton from "../GameCard/GameCardSkeleton";
import styles from "./ShelfSkeleton.module.css";

interface ShelfSkeletonProps {
  count?: number;
  showTitle?: boolean;
}

const ShelfSkeleton: React.FC<ShelfSkeletonProps> = ({ count = 6, showTitle = true }) => {
  return (
    <div className={styles.shelf} aria-busy="true">
      {showTitle && <Skeleton width="240px" height="1.6rem" />}
      <div className={styles.row}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.card}>
            <GameCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelfSkeleton;
