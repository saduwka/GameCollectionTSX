import React from "react";
import Skeleton from "../Skeleton/Skeleton";
import styles from "./GameCard.module.css";

const GameCardSkeleton: React.FC = () => {
  return (
    <div className={styles.gameCard} style={{ backgroundColor: "#2a2a2a" }}>
      <Skeleton width="100%" height="180px" borderRadius="0" />
      <div className={styles.description} style={{ padding: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <Skeleton width="80%" height="1.2rem" />
        <Skeleton width="40%" height="0.9rem" />
      </div>
    </div>
  );
};

export default GameCardSkeleton;
