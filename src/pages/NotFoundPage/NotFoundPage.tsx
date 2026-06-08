import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './NotFoundPage.module.scss';
import PageMeta from "../../components/PageMeta/PageMeta";

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.notFoundContainer}>
      <PageMeta
        title={t('not_found.title')}
        description={t('not_found.description')}
      />
      <div className={styles.notFoundContent}>
        <h1 className={styles.notFoundTitle}>404</h1>
        <h2 className={styles.notFoundSubtitle}>Game Over!</h2>
        <p className={styles.notFoundMessage}>
          {t('not_found.description')}
        </p>
        <div className={styles.notFoundActions}>
          <a href="/" className={`${styles.notFoundButton} ${styles.primary}`}>
            {t('common.home')}
          </a>
          <a href="/games" className={`${styles.notFoundButton} ${styles.secondary}`}>
            {t('common.games')}
          </a>
          <a href="/platforms" className={`${styles.notFoundButton} ${styles.secondary}`}>
            {t('common.platforms')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
