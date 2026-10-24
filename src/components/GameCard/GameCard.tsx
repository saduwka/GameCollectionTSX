import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { MoreHorizontal } from "lucide-react";
import type { Game } from "../../types/game";
import type { GameStatus } from "../../services/collection/collectionService";
import { addToCollectionIfMissing } from "../../services/collection/collectionService";
import { invalidateUserLibrary } from "../../services/collection/queryKeys";
import { saveGuestPick } from "../../services/match/guestPickStore";
import { recordSwipe } from "../../services/match/swipeStore";
import { useComparison } from "../../context/ComparisonContext";
import { useAuth } from "../../context/AuthContext";
import ImageWithFallback from "../ImageWithFallback/ImageWithFallback";
import IconButton from "../ui/IconButton";
import Rating from "../ui/Rating";
import StatusBadge from "../ui/StatusBadge";
import { genreName } from "../../services/games/normalizeGame";
import styles from "./GameCard.module.scss";

interface GameCardProps {
  game: Game;
  variant?: "compact" | "default" | "row";
  status?: GameStatus;
  hideCompareButton?: boolean;
}

const GameCard = ({ game, variant = "default", status, hideCompareButton = false }: GameCardProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToComparison, removeFromComparison, isInComparison, comparisonList } = useComparison();
  const [menuOpen, setMenuOpen] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const inCompare = isInComparison(game.id);
  const hours = game.playtime ? t("ui.hours_short", { count: Math.max(1, Math.round(game.playtime)) }) : "";

  const toggleCompare = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (inCompare) {
      removeFromComparison(game.id);
      toast.success(t("compare.removed"));
      return;
    }
    if (comparisonList.length >= 4) {
      toast.error(t("compare.max_limit"));
      return;
    }
    addToComparison(game);
    toast.success(t("compare.added"));
  }, [addToComparison, comparisonList.length, game, inCompare, removeFromComparison, t]);

  const saveStatus = async (event: React.MouseEvent, nextStatus: "Wishlist" | "Not Interested") => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    try {
      if (user) {
        await addToCollectionIfMissing({
          id: game.id,
          name: game.name,
          background_image: game.background_image,
          genres: game.genres || [],
          status: nextStatus,
        });
        await invalidateUserLibrary(queryClient, user.uid);
      } else if (nextStatus === "Wishlist") {
        saveGuestPick({
          id: game.id,
          name: game.name,
          background_image: game.background_image,
          genres: game.genres || [],
          status: "Wishlist",
        });
      } else {
        recordSwipe({
          gameId: game.id,
          gameName: game.name,
          action: "dislike",
          genres: game.genres || [],
          tags: [],
          background_image: game.background_image,
        });
      }
      toast.success(t("common.update_success"));
    } catch {
      toast.error(t("common.save_error"));
    }
  };

  return (
    <article
      className={`${styles.gameCard} card-fill ${variant === "row" ? styles.row : ""}`}
      onPointerDown={() => {
        pressTimer.current = window.setTimeout(() => setMenuOpen(true), 500);
      }}
      onPointerUp={() => {
        if (pressTimer.current) window.clearTimeout(pressTimer.current);
      }}
      onPointerLeave={() => {
        if (pressTimer.current) window.clearTimeout(pressTimer.current);
      }}
    >
      <ImageWithFallback
        className={styles.cover}
        src={game.background_image || game.coverUrl}
        alt=""
        width={640}
        height={360}
      />
      {status && (
        <div className={styles.badge}>
          <StatusBadge status={status} />
        </div>
      )}
      <div className={styles.menuButton}>
        <IconButton
          label={t("common.more")}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <MoreHorizontal size={18} />
        </IconButton>
      </div>
      {menuOpen && (
        <div className={styles.menu}>
          {!hideCompareButton && (
            <button type="button" onClick={toggleCompare}>
              {inCompare ? t("compare.removed") : t("compare.add_hint")}
            </button>
          )}
          <button type="button" onClick={(event) => saveStatus(event, "Wishlist")}>
            {t("ui.want_to_play")}
          </button>
          <button type="button" onClick={(event) => saveStatus(event, "Not Interested")}>
            {t("ui.not_interested")}
          </button>
        </div>
      )}
      <div className={styles.body}>
        <h3 className={styles.name}>{game.name}</h3>
        <p className={styles.meta}>
          {[genreName(game.genres?.[0]), hours].filter(Boolean).join(" · ") || "—"}
        </p>
        <div className={styles.ratingSlot}>
          <Rating value={game.rating} />
        </div>
      </div>
    </article>
  );
};

export default GameCard;
