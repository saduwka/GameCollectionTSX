import React from "react";
import Skeleton from "../Skeleton/Skeleton";
import styles from "./GameCard.module.scss";

const GameCardSkeleton: React.FC = () => {
  return (
    <div className={styles.gameCard}>
      <div className={styles.cover}>
        <Skeleton width="100%" height="100%" borderRadius="0" />
      </div>
      <div className={styles.body}>
        <Skeleton width="80%" height="1.2rem" />
        <Skeleton width="40%" height="0.9rem" />
      </div>
    </div>
  );
};

export default GameCardSkeleton;
