// src/components/NotFoundPage.tsx
import React from 'react';
import styles from './NotFoundPage.module.css'; // Make sure to import the CSS module!

const NotFoundPage: React.FC = () => {
  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <h1 className={styles.notFoundTitle}>404</h1>
        <h2 className={styles.notFoundSubtitle}>Game Over!</h2>
        <p className={styles.notFoundMessage}>
          It looks like you've wandered onto a page that doesn't exist. Perhaps the game cartridge is corrupted?
        </p>
        <div className={styles.notFoundActions}>
          <a href="/" className={`${styles.notFoundButton} ${styles.primary}`}>
            Return to Main Menu
          </a>
          <a href="/games" className={`${styles.notFoundButton} ${styles.secondary}`}>
            Explore Games
          </a>
          <a href="/platforms" className={`${styles.notFoundButton} ${styles.secondary}`}>
            Check out Platforms
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;