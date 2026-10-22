import { useTranslation } from "react-i18next";
import styles from "./HomePage.module.scss";

const BoardingPass = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.wrap}>
      <article className={styles.ticket} aria-busy="true">
        <header className={styles.headRow}>
          <span>{t("landing.boarding")}</span>
          <span>18:00</span>
        </header>
        <div className={styles.runway}>
          <svg className={styles.plane} viewBox="0 0 72 36" aria-hidden="true">
            <path
              fill="currentColor"
              d="M2 19h24l8-11h6l-5 11h22l8-7h5l-6 8 6 1v3l-6 1 6 8h-5l-8-7H35l5 11h-6l-8-11H2l5-2-5-3z"
            />
          </svg>
        </div>
        <p className={styles.departing}>{t("landing.departing")}</p>
        <p className={styles.srOnly} role="status" aria-live="polite">
          {t("landing.pending")}
        </p>
      </article>
    </div>
  );
};

export default BoardingPass;
