import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateGameMetadata, type CollectedGame } from "../../services/collection/collectionService";
import { invalidateUserLibrary } from "../../services/collection/queryKeys";
import { rankBacklog } from "../../services/collection/stats";
import { useMyDevices } from "../../hooks/useMyDevices";
import styles from "./CollectionPage.module.scss";

interface BacklogPickerProps {
  collection: CollectedGame[];
  topGenres: string[];
}

const BacklogPicker = ({ collection, topGenres }: BacklogPickerProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { devices } = useMyDevices();
  const [skipped, setSkipped] = useState<number[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  const candidates = useMemo(
    () =>
      rankBacklog(
        collection,
        devices.map((device) => device.name),
        topGenres
      ).filter((game) => !skipped.includes(game.id)),
    [collection, devices, topGenres, skipped]
  );

  const current = candidates[0];

  const startPlaying = async (game: CollectedGame) => {
    if (!user) return;
    setSavingId(game.id);
    try {
      await updateGameMetadata(game.id, { status: "Playing" });
      await invalidateUserLibrary(queryClient, user.uid);
      toast.success(t("collection.now_playing", { name: game.name }));
    } catch {
      toast.error(t("game_page.toasts.update_failed"));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.backlogPicker}>
      <h2 className={styles.subtitle}>{t("collection.backlog_title")}</h2>
      {!current ? (
        <p className={styles.recReason}>{t("collection.backlog_empty")}</p>
      ) : (
        <div className={styles.backlogCard}>
          <Link to={`/game/${current.id}`} className={styles.backlogLink}>
            {current.background_image && (
              <img src={current.background_image} alt="" className={styles.backlogImage} />
            )}
            <span>{current.name}</span>
          </Link>
          <div className={styles.backlogActions}>
            <button type="button" onClick={() => setSkipped((ids) => [...ids, current.id])}>
              {t("collection.skip")}
            </button>
            <button type="button" disabled={savingId === current.id} onClick={() => startPlaying(current)}>
              {t("collection.start_playing")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BacklogPicker;
