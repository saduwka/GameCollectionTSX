// FILE: src/pages/ProfilePage/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { 
  getUserCollection, 
  getUserSettings,
  saveUserSettings,
} from "../../services/collection/collectionService";
import { collectionKeys } from "../../services/collection/queryKeys";
import { getCollectionStats } from "../../services/collection/stats";
import { useMyDevices } from "../../hooks/useMyDevices";
import type { DeviceChoice } from "../../services/platforms/deviceStore";
import { searchPlatforms, getPlatforms } from "../../services/platforms/getPlatformsList";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from './ProfilePage.module.scss';
import { toast } from "react-hot-toast";

interface PlatformInfo {
  id: number;
  name: string;
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { devices, save, isLoading: devicesLoading } = useMyDevices();
  const [myDevicesLocal, setMyDevicesLocal] = useState<DeviceChoice[] | null>(null);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingDevices, setSavingDevices] = useState(false);
  
  // Platform Search State
  const [platformSearch, setPlatformSearch] = useState("");

  const navigate = useNavigate();

  // Queries
  const { data: collection = [] } = useQuery({
    queryKey: collectionKeys.user(user?.uid ?? "guest"),
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: collectionKeys.settings(user?.uid ?? "guest"),
    queryFn: () => getUserSettings(),
    enabled: !!user,
  });

  const { data: allPlatforms = [] } = useQuery({
    queryKey: ["allPlatforms"],
    queryFn: async () => {
      const raw = await getPlatforms();
      return raw.map(p => ({ id: p.id, name: p.name }));
    },
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["platformSearch", platformSearch],
    queryFn: async () => {
      if (platformSearch.length <= 1) return [];
      const results = await searchPlatforms(platformSearch);
      return results.slice(0, 20).map(p => ({ id: p.id, name: p.name }));
    },
    enabled: platformSearch.length > 1,
  });

  const myDevices = (myDevicesLocal ?? devices).map((device) => {
    const known = allPlatforms.find((platform) => platform.id === device.id);
    return known ? { id: device.id, name: known.name } : device;
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (settings) setIsPublic(settings.isPublic !== false);
  }, [settings]);

  if (!authLoading && !user) {
    return null;
  }

  const addDevice = (platform: PlatformInfo) => {
    const current = myDevices;
    if (!current.find(d => d.id === platform.id)) {
      setMyDevicesLocal([...current, platform]);
    }
    if (platformSearch) {
      setPlatformSearch("");
    }
  };

  const removeDevice = (id: number) => {
    setMyDevicesLocal(myDevices.filter(d => d.id !== id));
  };

  const handleSaveDevices = async () => {
    setSavingDevices(true);
    try {
      await save(myDevices);
      setMyDevicesLocal(null);
      toast.success(t("profile.settings_saved"));
    } catch {
      toast.error(t("profile.settings_failed"));
    } finally {
      setSavingDevices(false);
    }
  };

  const persistPrivacy = async (nextPublic: boolean) => {
    if (!user) return;
    setSavingSettings(true);
    setIsPublic(nextPublic);
    try {
      await saveUserSettings({
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

  const handleShareCollection = async () => {
    if (!user) return;
    try {
      await saveUserSettings({
        isPublic,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });
      await queryClient.invalidateQueries({ queryKey: collectionKeys.settings(user.uid) });
      const url = `${window.location.origin}/collection/${user.uid}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("profile.link_copied"));
    } catch {
      toast.error(t("profile.settings_failed"));
    }
  };

  const stats = getCollectionStats(collection);

  if (authLoading) return null;

  return (
    <div className={styles.profilePage}>
      <PageMeta
        title={user?.displayName ? t("profile.title_with_name", { name: user.displayName }) : t("profile.title")}
        description={t("profile.description")}
      />
      <header className={styles.header}>
        <img src={user?.photoURL || ""} alt="Avatar" className={styles.avatar} />
        <div className={styles.userMeta}>
          <h1 className={styles.username}>{user?.displayName}</h1>
          <p className={styles.email}>{user?.email}</p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Total Games</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.playing}</span>
          <span className={styles.statLabel}>Playing</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.completed}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.avgRating}</span>
          <span className={styles.statLabel}>Avg Rating</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalHours}h</span>
          <span className={styles.statLabel}>Total Time</span>
        </div>
      </section>

      <section className={styles.devicesSection}>
        <h2 className={styles.sectionTitle}>My Hardware</h2>
        <p className={styles.sectionDesc}>Add any consoles or devices you own to get better recommendations.</p>
        
        <div className={styles.searchWrapper}>
          <div className={styles.searchBarWrapper}>
            <input
              type="text"
              className={styles.searchBar}
              placeholder="Search console (e.g. Steam Deck, NES, PS5)..."
              value={platformSearch}
              onChange={(e) => setPlatformSearch(e.target.value)}
            />
            {!platformSearch && (
              <button 
                className={styles.browseAllButton}
                onClick={() => setShowAllPlatforms(!showAllPlatforms)}
              >
                {showAllPlatforms ? "Hide List" : "Browse All"}
              </button>
            )}
          </div>

          {isSearching && <div className={styles.searchLoader}>Searching...</div>}
          
          {(platformSearch.length > 1 || showAllPlatforms) && (
            <div className={styles.platformsGrid}>
              {(platformSearch.length > 1 ? searchResults : allPlatforms).map(p => {
                const isSelected = myDevices.some(d => d.id === p.id);
                return (
                  <div 
                    key={p.id} 
                    className={`${styles.platformCard} ${isSelected ? styles.platformSelected : ""}`}
                    onClick={() => isSelected ? removeDevice(p.id) : addDevice(p)}
                  >
                    {p.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.selectedDevices}>
          {myDevices.length > 0 ? (
            myDevices.map(device => (
              <div key={device.id} className={styles.deviceTag}>
                {device.name}
                <button className={styles.removeDevice} onClick={() => removeDevice(device.id)}>&times;</button>
              </div>
            ))
          ) : (
            <p className={styles.noDevices}>No devices added yet. Choose from the list above or search.</p>
          )}
        </div>
        
        <div className={styles.privacyBox}>
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
          <p className={styles.sectionDesc}>
            {t("profile.preview")}: {user?.displayName} · {stats.total} · {stats.topGenres.join(", ")}
          </p>
        </div>

        <div className={styles.actionButtons}>
          <button 
            className={styles.saveButton} 
            onClick={handleSaveDevices}
            disabled={savingDevices || devicesLoading || isSearching}
          >
            {savingDevices ? t("common.loading") : t("profile.save_devices")}
          </button>
          
          <button 
            className={styles.shareButton}
            onClick={() => void handleShareCollection()}
          >
            {t("profile.share")}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
