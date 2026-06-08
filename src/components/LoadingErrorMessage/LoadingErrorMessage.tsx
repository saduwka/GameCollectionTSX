import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./LoadingErrorMessage.module.scss";

interface LoadingErrorMessageProps {
  loading: boolean;
  error: string | null;
  noResults: boolean;
  message?: string;
  variant?: 'overlay' | 'inline';
}

const LoadingErrorMessage: React.FC<LoadingErrorMessageProps> = ({
  loading,
  error,
  noResults,
  message,
  variant = 'overlay'
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={`${styles.boxes} ${variant === 'inline' ? styles.inline : ''}`}>
        <div className={styles.box}>
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className={styles.box}>
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className={styles.box}>
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className={styles.box}>
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    );
  }

  if (error) {
    return <p className={styles.message}>{t('common.error')}: {error}</p>;
  }

  if (noResults) {
    return <p className={styles.message}>{message || t('common.nothing_found')}</p>;
  }

  return null;
};

export default LoadingErrorMessage;
