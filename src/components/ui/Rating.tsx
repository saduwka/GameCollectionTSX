import { useTranslation } from "react-i18next";
import styles from "./Rating.module.scss";

interface RatingProps {
  value?: number | null;
  metacritic?: number | null;
}

const Rating = ({ value, metacritic }: RatingProps) => {
  const { i18n, t } = useTranslation();
  const locale = i18n.language.startsWith("ru") ? "ru-RU" : "en-US";

  if (metacritic) {
    return (
      <span className={styles.rating}>
        {metacritic}
        <span className={styles.source}>{t("ui.metacritic")}</span>
      </span>
    );
  }

  if (!value || value <= 0) return null;
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  return <span className={styles.rating}>{t("landing.rawg", { value: `${formatted} / 5` })}</span>;
};

export default Rating;
