import React from 'react';
import { Link } from 'react-router-dom';
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
        noindex
      />
      <div className={styles.notFoundContent}>
        <h1 className={styles.notFoundTitle}>{t('not_found.title')}</h1>
        <p className={styles.notFoundMessage}>{t('not_found.description')}</p>
        <div className={styles.notFoundActions}>
          <Link to="/" className={`${styles.notFoundButton} ${styles.primary}`}>
            {t('not_found.ticket')}
          </Link>
          <Link to="/games/" className={`${styles.notFoundButton} ${styles.secondary}`}>
            {t('not_found.catalog')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
