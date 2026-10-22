const KEY = "playhub:seen:v1";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export const readSeen = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, number>;
    const now = Date.now();
    const fresh: Record<string, number> = {};
    for (const [id, at] of Object.entries(raw)) {
      if (typeof at === "number" && now - at < WEEK) fresh[id] = at;
    }
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return Object.keys(fresh).slice(0, 50).map(Number);
  } catch {
    return [];
  }
};

export const markSeen = (id: number) => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, number>;
    raw[String(id)] = Date.now();
    localStorage.setItem(KEY, JSON.stringify(raw));
  } catch {
    /* ignore private mode */
  }
};
