import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateGameMetadata, type CollectedGame } from "../../services/collection/collectionService";
import { invalidateUserLibrary } from "../../services/collection/queryKeys";
import { track } from "../../services/analytics/track";
import { rankBacklog } from "../../services/collection/stats";
import { useMyDevices } from "../../hooks/useMyDevices";
import Button from "../../components/ui/Button";
import Ticket from "../../components/ui/Ticket";
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
  const [savingId, setSavingId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);

  const candidates = useMemo(() => {
    const pool = collection.map((game) =>
      game.status === "Wishlist" ? { ...game, status: "Backlog" as const } : game
    );
    return rankBacklog(pool, devices.map((device) => device.name), topGenres).slice(0, 3);
  }, [collection, devices, topGenres]);

  const game = candidates.length ? candidates[index % candidates.length] : null;

  const startPlaying = async (item: CollectedGame) => {
    if (!user) return;
    setSavingId(item.id);
    try {
      await updateGameMetadata(item.id, { status: "Playing" });
      await invalidateUserLibrary(queryClient, user.uid);
      track("collection_add", { game_id: item.id, status: "Playing" });
      toast.success(t("collection.now_playing", { name: item.name }));
    } catch {
      toast.error(t("common.update_error"));
    } finally {
      setSavingId(null);
    }
  };

  if (!game) {
    return <p className={styles.recReason}>{t("collection.backlog_empty")}</p>;
  }

  return (
    <section className={styles.backlogPicker}>
      <Ticket
        kicker={t("collection.next_up")}
        title={game.name}
        meta={<span>{game.genres?.[0] || "—"}</span>}
        whyLabel={t("landing.why")}
        why={t("landing.shelf_why")}
        foot={
          <>
            <Button disabled={savingId === game.id} onClick={() => void startPlaying(game)}>
              {t("collection.start_playing")}
            </Button>
            <Button variant="ghost" onClick={() => setIndex((value) => value + 1)}>
              {t("landing.another")}
            </Button>
          </>
        }
      />
    </section>
  );
};

export default BacklogPicker;
