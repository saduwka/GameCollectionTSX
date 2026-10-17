export interface GuestPick {
  id: number;
  name: string;
  background_image: string;
  genres: string[];
  status: "Wishlist" | "Backlog";
}

const STORAGE_KEY = "playhub:picks:v1";
const isBrowser = typeof window !== "undefined";

export const getGuestPicks = (): GuestPick[] => {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveGuestPick = (pick: GuestPick) => {
  if (!isBrowser) return;
  const next = [pick, ...getGuestPicks().filter((item) => item.id !== pick.id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const clearGuestPicks = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
