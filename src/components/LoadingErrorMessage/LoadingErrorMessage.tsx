import React from "react";
import { useTranslation } from "react-i18next";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
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
    return <ErrorState title={t("ui.closed")} text={error} />;
  }

  if (noResults) {
    return <EmptyState title={t("landing.empty_title")} text={message || t("common.nothing_found")} />;
  }

  return null;
};

export default LoadingErrorMessage;
