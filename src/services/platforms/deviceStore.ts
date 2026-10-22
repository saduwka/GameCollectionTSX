export interface DeviceChoice {
  id: number;
  name: string;
}

export const POPULAR_PLATFORMS: DeviceChoice[] = [
  { id: 4, name: "PC" },
  { id: 187, name: "PlayStation 5" },
  { id: 18, name: "PlayStation 4" },
  { id: 186, name: "Xbox Series S/X" },
  { id: 1, name: "Xbox One" },
  { id: 7, name: "Nintendo Switch" },
  { id: 3, name: "iOS" },
  { id: 21, name: "Android" },
];

const DEVICES_KEY = "playhub:devices:v1";
const NAMES_KEY = "playhub:device-names:v1";
const CONFIRMED_KEY = "playhub:devices:confirmed:v1";

const isBrowser = typeof window !== "undefined";

const readJson = <T>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getDeviceNameMap = (): Record<string, string> =>
  readJson<Record<string, string>>(NAMES_KEY, {});

const hashName = /^#\d+$/;

export const hasDeviceName = (name?: string) => Boolean(name) && !hashName.test(name!);

export const rememberDeviceNames = (devices: DeviceChoice[]) => {
  if (!isBrowser) return;
  const current = getDeviceNameMap();
  devices.forEach((device) => {
    if (!hasDeviceName(device.name)) return;
    current[String(device.id)] = device.name;
  });
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(current));
  } catch {
    // ignore quota / private mode
  }
};

export const namesForDeviceIds = (ids: number[]): DeviceChoice[] => {
  const names = getDeviceNameMap();
  return ids.map((id) => {
    const cached = names[String(id)];
    const popular = POPULAR_PLATFORMS.find((platform) => platform.id === id)?.name;
    return { id, name: hasDeviceName(cached) ? cached : popular || "" };
  });
};

export const getGuestDevices = (): DeviceChoice[] => {
  const stored = readJson<unknown>(DEVICES_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((item) => {
    if (typeof item === "number") {
      return namesForDeviceIds([item]);
    }
    if (item && typeof item === "object" && "id" in item && typeof item.id === "number") {
      const name = "name" in item && typeof item.name === "string" ? item.name : namesForDeviceIds([item.id])[0].name;
      return [{ id: item.id, name }];
    }
    return [];
  });
};

export const saveGuestDevices = (devices: DeviceChoice[]) => {
  if (!isBrowser) return;
  rememberDeviceNames(devices);
  try {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  } catch {
    // ignore
  }
};

export const clearGuestDevices = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(DEVICES_KEY);
  } catch {
    // ignore
  }
};

export const isDevicesConfirmed = (): boolean => {
  if (!isBrowser) return false;
  return localStorage.getItem(CONFIRMED_KEY) === "1";
};

export const markDevicesConfirmed = () => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(CONFIRMED_KEY, "1");
  } catch {
    // ignore
  }
};
