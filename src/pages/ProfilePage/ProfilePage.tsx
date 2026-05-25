// FILE: src/pages/ProfilePage/ProfilePage.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { 
  getUserCollection, 
  getUserDevices, 
  saveUserDevices 
} from "../../services/collection/collectionService";
import { searchPlatforms, getPlatforms } from "../../services/platforms/getPlatformsList";
import PageMeta from "../../components/PageMeta/PageMeta";
import styles from "./ProfilePage.module.css";
import { toast } from "react-hot-toast";

interface PlatformInfo {
  id: number;
  name: string;
}

const ProfilePage: React.FC = () => {
  const { user, authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [myDevicesLocal, setMyDevicesLocal] = useState<PlatformInfo[] | null>(null);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  
  // Platform Search State
  const [platformSearch, setPlatformSearch] = useState("");

  const navigate = useNavigate();

  // Queries
  const { data: collection = [] } = useQuery({
    queryKey: ["userCollection", user?.uid],
    queryFn: () => getUserCollection(),
    enabled: !!user,
  });

  const { data: serverDevices = [] } = useQuery({
    queryKey: ["userDevices", user?.uid],
    queryFn: () => getUserDevices(),
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

  // Sync server devices to local state once loaded
  const myDevices = useMemo(() => {
    if (myDevicesLocal !== null) return myDevicesLocal;
    if (serverDevices.length > 0 && allPlatforms.length > 0) {
      return allPlatforms.filter(p => serverDevices.includes(p.id));
    }
    return [];
  }, [myDevicesLocal, serverDevices, allPlatforms]);

  // Mutations
  const saveDevicesMutation = useMutation({
    mutationFn: (deviceIds: number[]) => saveUserDevices(deviceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userDevices", user?.uid] });
      toast.success("Settings saved!");
    },
    onError: () => {
      toast.error("Failed to save settings.");
    },
  });

  if (!authLoading && !user) {
    navigate("/");
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

  const handleSaveDevices = () => {
    saveDevicesMutation.mutate(myDevices.map(d => d.id));
  };

  const handleShareCollection = () => {
    if (user) {
      const url = `${window.location.origin}/collection/${user.uid}`;
      navigator.clipboard.writeText(url);
      toast.success("Public link copied to clipboard!");
    }
  };

  const stats = {
    total: collection.length,
    playing: collection.filter(g => g.status === "Playing").length,
    completed: collection.filter(g => g.status === "Completed").length,
    backlog: collection.filter(g => g.status === "Backlog").length,
    avgRating: collection.filter(g => (g.rating || 0) > 0).length 
      ? (collection.reduce((acc, g) => acc + (g.rating || 0), 0) / collection.filter(g => (g.rating || 0) > 0).length).toFixed(1)
      : "N/A",
    totalHours: collection.reduce((acc, g) => acc + (g.hoursPlayed || 0), 0)
  };

  if (authLoading) return null;

  return (
    <div className={styles.profilePage}>
      <PageMeta
        title={user?.displayName ? `Профиль — ${user.displayName}` : "Профиль"}
        description="Ваш профиль PlayHub: устройства, коллекция и настройки."
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
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.saveButton} 
            onClick={handleSaveDevices}
            disabled={saveDevicesMutation.isPending || isSearching}
          >
            {saveDevicesMutation.isPending ? "Saving..." : "Save Hardware Settings"}
          </button>
          
          <button 
            className={styles.shareButton}
            onClick={handleShareCollection}
          >
            🔗 Share Public Collection
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
