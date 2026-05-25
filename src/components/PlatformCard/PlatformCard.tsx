// FILE: src/components/PlatformCard/PlatformCard.tsx
import React, { useState } from 'react';
import styles from './PlatformCard.module.css';

interface PlatformCardProps {
  platform: {
    id: number;
    name: string;
    games_count?: number;
    image_background?: string;
  };
}

// Палитра градиентов для fallback — детерминированно выбирается по id
const FALLBACK_GRADIENTS: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fad0c4'],
];

const PlatformCard: React.FC<PlatformCardProps> = ({ platform }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const hasImage = !!platform.image_background && !imgFailed;
  const gradientIndex = platform.id % FALLBACK_GRADIENTS.length;
  const [gradFrom, gradTo] = FALLBACK_GRADIENTS[gradientIndex];

  // Берём первую букву имени; на всякий случай — fallback "?"
  const initial = platform.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={styles.platformCard}>
      {hasImage ? (
        <img
          src={platform.image_background}
          alt={platform.name}
          className={styles.platformCardImg}
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={styles.platformCardFallback}
          style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}
          aria-label={`${platform.name} — изображение недоступно`}
          role="img"
        >
          <span className={styles.fallbackInitial}>{initial}</span>
          <svg
            className={styles.fallbackIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M6 12h4M8 10v4" strokeLinecap="round" />
            <circle cx="15" cy="11" r="1" fill="currentColor" />
            <circle cx="17" cy="13" r="1" fill="currentColor" />
            <path d="M17.5 5h-11A4.5 4.5 0 0 0 2 9.5v5A4.5 4.5 0 0 0 6.5 19c1.2 0 2.3-.5 3.1-1.3L11 16.5h2l1.4 1.2A4.5 4.5 0 0 0 17.5 19a4.5 4.5 0 0 0 4.5-4.5v-5A4.5 4.5 0 0 0 17.5 5Z" />
          </svg>
        </div>
      )}
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
