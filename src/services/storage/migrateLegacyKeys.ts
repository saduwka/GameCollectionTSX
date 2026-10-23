export const LEGACY_KEY_MAP: Record<string, string> = {
  playhub_filters: "gamevening:filters:v1",
  "playhub:swipes:v1": "gamevening:swipes:v1",
  "playhub:picks:v1": "gamevening:picks:v1",
  "playhub:devices:v1": "gamevening:devices:v1",
  "playhub:device-names:v1": "gamevening:device-names:v1",
  "playhub:devices:confirmed:v1": "gamevening:devices:confirmed:v1",
  "playhub:seen:v1": "gamevening:seen:v1",
};

export function migrateLegacyKeys(storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) return;
  try {
    for (const [from, to] of Object.entries(LEGACY_KEY_MAP)) {
      const value = storage.getItem(from);
      if (value === null) continue;
      if (storage.getItem(to) === null) storage.setItem(to, value);
      storage.removeItem(from);
    }
  } catch {
    /* private mode / quota */
  }
}
