import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getUserDevices, saveUserDevices } from "../services/collection/collectionService";
import { collectionKeys } from "../services/collection/queryKeys";
import { getPlatformDetails } from "../services/platforms/getPlatformsList";
import { RAWG_DETAIL_STALE_TIME } from "../services/rawgCache";
import {
  getGuestDevices,
  hasDeviceName,
  isDevicesConfirmed,
  markDevicesConfirmed,
  namesForDeviceIds,
  rememberDeviceNames,
  saveGuestDevices,
  type DeviceChoice,
} from "../services/platforms/deviceStore";

export const useMyDevices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestDevices, setGuestDevices] = useState<DeviceChoice[]>(() => getGuestDevices());
  const [confirmed, setConfirmed] = useState(() => isDevicesConfirmed());

  const serverQuery = useQuery({
    queryKey: collectionKeys.devices(user?.uid ?? "guest"),
    queryFn: () => getUserDevices(),
    enabled: !!user,
  });

  const storedIds = user ? (serverQuery.data ?? []) : guestDevices.map((device) => device.id);
  const namedDevices = useMemo(
    () => namesForDeviceIds(storedIds),
    [storedIds]
  );
  const missingIds = namedDevices.filter((device) => !hasDeviceName(device.name)).map((device) => device.id);

  const namesQuery = useQuery({
    queryKey: ["deviceNames", missingIds],
    queryFn: async () => {
      const settled = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const platform = await getPlatformDetails(String(id));
            return platform.name ? { id, name: platform.name } : null;
          } catch {
            return null;
          }
        })
      );
      const found = settled.filter((device): device is DeviceChoice => device !== null);
      if (found.length > 0) rememberDeviceNames(found);
      return found;
    },
    enabled: missingIds.length > 0,
    staleTime: RAWG_DETAIL_STALE_TIME,
  });

  const devices = useMemo(() => {
    const resolved = new Map((namesQuery.data ?? []).map((device) => [device.id, device.name]));
    return namedDevices
      .map((device) => ({ ...device, name: hasDeviceName(device.name) ? device.name : resolved.get(device.id) || "" }))
      .filter((device) => hasDeviceName(device.name));
  }, [namedDevices, namesQuery.data]);

  const save = async (next: DeviceChoice[]) => {
    rememberDeviceNames(next);
    if (user) {
      await saveUserDevices(next.map((device) => device.id));
      await queryClient.invalidateQueries({ queryKey: collectionKeys.devices(user.uid) });
    } else {
      saveGuestDevices(next);
      setGuestDevices(next);
    }
  };

  const confirm = async (next: DeviceChoice[]) => {
    await save(next);
    markDevicesConfirmed();
    setConfirmed(true);
  };

  return {
    devices,
    deviceIds: storedIds,
    save,
    confirm,
    confirmed: confirmed || devices.length > 0,
    isLoading: !!user && serverQuery.isLoading,
  };
};
