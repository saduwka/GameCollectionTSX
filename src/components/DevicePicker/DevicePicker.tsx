import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { searchPlatforms } from "../../services/platforms/getPlatformsList";
import { POPULAR_PLATFORMS, type DeviceChoice } from "../../services/platforms/deviceStore";
import styles from "./DevicePicker.module.scss";

interface DevicePickerProps {
  selected: DeviceChoice[];
  onChange: (devices: DeviceChoice[]) => void;
}

const DevicePicker = ({ selected, onChange }: DevicePickerProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ["platformSearch", search],
    queryFn: async () => {
      const results = await searchPlatforms(search);
      return results.slice(0, 12).map((platform) => ({ id: platform.id, name: platform.name }));
    },
    enabled: search.length > 1,
  });

  const toggle = (device: DeviceChoice) => {
    const exists = selected.some((item) => item.id === device.id);
    onChange(exists ? selected.filter((item) => item.id !== device.id) : [...selected, device]);
  };

  const isSelected = (id: number) => selected.some((item) => item.id === id);

  return (
    <div className={styles.picker}>
      <p className={styles.label}>{t("devices.popular")}</p>
      <div className={styles.chips}>
        {POPULAR_PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            className={`${styles.chip} ${isSelected(platform.id) ? styles.chipActive : ""}`}
            onClick={() => toggle(platform)}
          >
            {platform.name}
          </button>
        ))}
      </div>
      <input
        className={styles.search}
        value={search}
        placeholder={t("devices.search")}
        onChange={(event) => setSearch(event.target.value)}
      />
      {isFetching && <p className={styles.hint}>{t("common.loading")}</p>}
      {search.length > 1 && (
        <div className={styles.chips}>
          {searchResults.map((platform) => (
            <button
              key={platform.id}
              type="button"
              className={`${styles.chip} ${isSelected(platform.id) ? styles.chipActive : ""}`}
              onClick={() => {
                toggle(platform);
                setSearch("");
              }}
            >
              {platform.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevicePicker;
