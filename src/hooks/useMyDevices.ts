import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getUserDevices, saveUserDevices } from "../services/collection/collectionService";
import { collectionKeys } from "../services/collection/queryKeys";
import {
  getGuestDevices,
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

  const serverDevices = useMemo(
    () => namesForDeviceIds(serverQuery.data ?? []),
    [serverQuery.data]
  );

  const devices = user ? serverDevices : guestDevices;

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
    deviceIds: devices.map((device) => device.id),
    save,
    confirm,
    confirmed: confirmed || devices.length > 0,
    isLoading: !!user && serverQuery.isLoading,
  };
};
