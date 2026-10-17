import { auth } from "../../firebase";
import { getGuestPicks, clearGuestPicks } from "../match/guestPickStore";
import { clearSwipes, getAllSwipes } from "../match/swipeStore";
import {
  clearGuestDevices,
  getGuestDevices,
  rememberDeviceNames,
} from "../platforms/deviceStore";
import {
  addToCollectionIfMissing,
  getUserDevices,
  saveUserDevices,
} from "./collectionService";

export const hasGuestData = () =>
  getAllSwipes().length > 0 || getGuestPicks().length > 0 || getGuestDevices().length > 0;

export const syncGuestData = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user || !hasGuestData()) return false;

  const swipes = getAllSwipes();
  const picks = getGuestPicks();
  const devices = getGuestDevices();

  for (const swipe of swipes) {
    await addToCollectionIfMissing({
      id: swipe.gameId,
      name: swipe.gameName,
      background_image: swipe.background_image || "",
      genres: swipe.genres || [],
      status: swipe.action === "like" ? "Liked" : "Not Interested",
    });
  }

  for (const pick of picks) {
    await addToCollectionIfMissing({
      id: pick.id,
      name: pick.name,
      background_image: pick.background_image,
      genres: pick.genres,
      status: pick.status,
    });
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
