import React from "react";
import styles from "./PlatfromCard.module.css";
import type { Platform } from "../../types/game";

interface PlatformCardProps {
  platform: Platform;
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => {
  return (
    <div className={styles.platformCard}>
      <img className={styles.platformCardImg} src={platform.image_background} alt={platform.name} />
      <h2 className={styles.platformName}>{platform.name}</h2>
    </div>
  );
};

export default PlatformCard;
