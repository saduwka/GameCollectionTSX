import { auth } from "../../firebase";
import { getGuestPicks, clearGuestPicks } from "../match/guestPickStore";
import { clearSwipes, getAllSwipes } from "../match/swipeStore";
import {
  clearGuestDevices,
  getGuestDevices,
  rememberDeviceNames,
} from "../platforms/deviceStore";
import { mergeGuestEntries } from "./mergeGuestEntries";
import {
  addToCollectionIfMissing,
  getUserDevices,
  saveUserDevices,
} from "./collectionService";

export const hasGuestData = () =>
  getAllSwipes().length > 0 || getGuestPicks().length > 0 || getGuestDevices().length > 0;

let pendingSync: Promise<boolean> | null = null;

const runSync = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user || !hasGuestData()) return false;

  const games = mergeGuestEntries(getAllSwipes(), getGuestPicks());
  const devices = getGuestDevices();

  for (const game of games) {
    await addToCollectionIfMissing(game);
  }

  if (devices.length > 0) {
    rememberDeviceNames(devices);
    const existing = await getUserDevices(user.uid);
    const merged = Array.from(new Set([...existing, ...devices.map((device) => device.id)]));
    await saveUserDevices(merged);
  }

  clearSwipes();
  clearGuestPicks();
  clearGuestDevices();
  return true;
};

export const syncGuestData = (): Promise<boolean> => {
  if (pendingSync) return pendingSync;
  pendingSync = runSync().finally(() => {
    pendingSync = null;
  });
  return pendingSync;
};
