import { useTranslation } from "react-i18next";
import Button from "./Button";
import styles from "./EmptyState.module.scss";

interface ErrorStateProps {
  title?: string;
  text?: string;
  onRetry?: () => void;
}

const ErrorState = ({ title, text, onRetry }: ErrorStateProps) => {
  const { t } = useTranslation();
  return (
    <div className={styles.box} role="alert">
      <h2 className={styles.title}>{title || t("ui.closed")}</h2>
      {text && <p className={styles.text}>{text}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
