// FILE: src/components/PlatformCard/PlatformCard.tsx
import React from 'react';
import styles from './PlatformCard.module.css';

interface PlatformCardProps {
  platform: {
    id: number;
    name: string;
    games_count?: number;
    image_background?: string;
  };
}

const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => {
  return (
    <div className={styles.platformCard}>
      <img src={platform.image_background} alt={platform.name} className={styles.platformImage} />
      <div className={styles.platformInfo}>
        <h3 className={styles.platformName}>{platform.name}</h3>
        {platform.games_count && (
          <p className={styles.gamesCount}>{platform.games_count.toLocaleString()} games</p>
        )}
      </div>
    </div>
  );
};

export default PlatformCard;
