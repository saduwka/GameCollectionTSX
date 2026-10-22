import type { GameStatus } from "../../services/collection/collectionService";
import { useTranslation } from "react-i18next";
import styles from "./StatusBadge.module.scss";

const StatusBadge = ({ status }: { status: GameStatus }) => {
  const { t } = useTranslation();
  const tone = status.toLowerCase().replace(/\s+/g, "");
  return <span className={`${styles.badge} ${styles[tone] ?? ""}`}>{t(`game_page.status.${status}`)}</span>;
};

export default StatusBadge;
