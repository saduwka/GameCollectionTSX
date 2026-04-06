// FILE: src/pages/ProfilePage/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  getUserCollection, 
  getUserDevices, 
  saveUserDevices 
} from "../../services/collection/collectionService";
import type { CollectedGame } from "../../services/collection/collectionService";
import { searchPlatforms, getPlatforms } from "../../services/platforms/getPlatformsList";
import styles from "./ProfilePage.module.css";
import { toast } from "react-hot-toast";

interface PlatformInfo {
  id: number;
  name: string;
}

const ProfilePage: React.FC = () => {
  const { user, authLoading } = useAuth();
  const [collection, setCollection] = useState<CollectedGame[]>([]);
  const [myDevices, setMyDevices] = useState<PlatformInfo[]>([]);
  const [allPlatforms, setAllPlatforms] = useState<PlatformInfo[]>([]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Platform Search State
  const [platformSearch, setPlatformSearch] = useState("");
  const [searchResults, setSearchResults] = useState<PlatformInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const [userCollection, deviceIds, rawPlatforms] = await Promise.all([
            getUserCollection(),
            getUserDevices(),
            getPlatforms()
          ]);
          setCollection(userCollection);
          
          const platformList: PlatformInfo[] = rawPlatforms.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }));
          setAllPlatforms(platformList);
          
          if (deviceIds.length > 0) {
            const filtered = platformList.filter((p: PlatformInfo) => deviceIds.includes(p.id));
            setMyDevices(filtered);
          }
        } catch (err) {
          console.error("Error fetching profile data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  // Handle Platform Search
  useEffect(() => {
    const search = async () => {
      if (platformSearch.length > 1) {
        setIsSearching(true);
        const results = await searchPlatforms(platformSearch);
        setSearchResults(results.slice(0, 20));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };
    search();
  }, [platformSearch]);

  const addDevice = (platform: PlatformInfo) => {
    if (!myDevices.find(d => d.id === platform.id)) {
      setMyDevices([...myDevices, platform]);
    }
    if (platformSearch) {
      setPlatformSearch("");
      setSearchResults([]);
    }
  };

  const removeDevice = (id: number) => {
    setMyDevices(myDevices.filter(d => d.id !== id));
  };

  const handleSaveDevices = async () => {
    setSaving(true);
    try {
      await saveUserDevices(myDevices.map(d => d.id));
      toast.success("Settings saved!");
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
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

  if (authLoading || (!user && !loading)) return null;

  return (
    <div className={styles.profilePage}>
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
            disabled={saving || isSearching}
          >
            {saving ? "Saving..." : "Save Hardware Settings"}
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
