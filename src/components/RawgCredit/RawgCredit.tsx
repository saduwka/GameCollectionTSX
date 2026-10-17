import { useTranslation } from "react-i18next";
import styles from "./RawgCredit.module.scss";

const RawgCredit = () => {
  const { t } = useTranslation();

  return (
    <p className={styles.credit}>
      {t("common.rawg_credit")}{" "}
      <a href="https://rawg.io/" target="_blank" rel="noopener noreferrer">
        RAWG
      </a>
    </p>
  );
};

export default RawgCredit;
