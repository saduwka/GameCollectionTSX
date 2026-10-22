import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getPublicProfile, getUserCollection, savePublicProfile } from "../../services/collection/collectionService";
import { collectionKeys } from "../../services/collection/queryKeys";
import { useMyDevices } from "../../hooks/useMyDevices";
import type { DeviceChoice } from "../../services/platforms/deviceStore";
import DevicePicker from "../../components/DevicePicker/DevicePicker";
import LoginButton from "../../components/LoginButton/LoginButton";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import PageMeta from "../../components/PageMeta/PageMeta";
import Button from "../../components/ui/Button";
import Ticket from "../../components/ui/Ticket";
import styles from "./ProfilePage.module.scss";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { devices, save } = useMyDevices();
  const [isPublic, setIsPublic] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const { data: shelf = [] } = useQuery({
    queryKey: collectionKeys.user(user?.uid ?? "guest"),
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  const { data: publicProfile } = useQuery({
    queryKey: collectionKeys.publicSettings(user?.uid ?? "guest"),
    queryFn: () => getPublicProfile(),
    enabled: !!user,
  });

  useEffect(() => {
    if (publicProfile) setIsPublic(publicProfile.isPublic === true);
  }, [publicProfile]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className={styles.profilePage}>
        <PageMeta title={t("profile.title")} description={t("profile.description")} />
        <h1 className={styles.username}>{t("profile.title")}</h1>
        <p className={styles.sectionDesc}>{t("common.login_required")}</p>
        <LoginButton />
      </div>
    );
  }

  const persistPrivacy = async (nextPublic: boolean) => {
    setSavingSettings(true);
    setIsPublic(nextPublic);
    try {
      await savePublicProfile({
        isPublic: nextPublic,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });
      await queryClient.invalidateQueries({ queryKey: collectionKeys.settings(user.uid) });
      await queryClient.invalidateQueries({ queryKey: collectionKeys.publicSettings(user.uid) });
      toast.success(t("profile.settings_saved"));
    } catch {
      setIsPublic(!nextPublic);
      toast.error(t("profile.settings_failed"));
    } finally {
      setSavingSettings(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/collection/${user.uid}`);
      toast.success(t("profile.link_copied"));
    } catch {
      toast.error(t("profile.settings_failed"));
    }
  };

  const onDevices = async (next: DeviceChoice[]) => {
    try {
      await save(next);
    } catch {
      toast.error(t("profile.settings_failed"));
    }
  };

  return (
    <div className={styles.profilePage}>
      <PageMeta
        title={user.displayName ? t("profile.title_with_name", { name: user.displayName }) : t("profile.title")}
        description={t("profile.description")}
      />
      <Ticket
        heading="h1"
        kicker={t("profile.on_playhub")}
        title={user.displayName || t("profile.title")}
        meta={
          <span>
            {t("profile.since", {
              date: user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { month: "2-digit", year: "numeric" })
                : "—",
              count: shelf.length,
              hours: Math.round(shelf.reduce((sum, game) => sum + (game.hoursPlayed || game.playtime || 0), 0)),
            })}
          </span>
        }
        foot={
          <>
            {user.photoURL && <img src={user.photoURL} alt="" className={styles.avatar} />}
            <LogoutButton />
          </>
        }
      />

      <section className={styles.devicesSection}>
        <label className={styles.privacyToggle}>
          <input
            type="checkbox"
            checked={isPublic}
            disabled={savingSettings}
            onChange={(event) => void persistPrivacy(event.target.checked)}
          />
          {t("profile.privacy")}
        </label>
        <p className={styles.sectionDesc}>{isPublic ? t("profile.privacy_on") : t("profile.privacy_off")}</p>
        <Button variant="secondary" onClick={() => void copyLink()}>{t("profile.share")}</Button>
      </section>

      <section className={styles.devicesSection}>
        <h2 className={styles.sectionTitle}>{t("profile.devices_title")}</h2>
        <p className={styles.sectionDesc}>{t("profile.devices_hint")}</p>
        <DevicePicker selected={devices} onChange={(next) => void onDevices(next)} />
      </section>
    </div>
  );
};

export default ProfilePage;
