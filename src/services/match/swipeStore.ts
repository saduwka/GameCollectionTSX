// FILE: src/services/match/swipeStore.ts
// Хранилище свайпов: гость = localStorage, залогиненный = localStorage (как кэш)
// В C5b добавим Firestore-синхронизацию: при логине мёрджим guest-свайпы в облако.

export type SwipeAction = "like" | "dislike";

export interface SwipeRecord {
  gameId: number;
  gameName: string;
  action: SwipeAction;
  genres: string[];
  tags: string[];
  timestamp: number;
}

const STORAGE_KEY = "playhub:swipes:v1";
const MAX_RECORDS = 500; // защита от безграничного роста

const isBrowser = typeof window !== "undefined";

/** Все свайпы пользователя (последние первыми). */
export const getAllSwipes = (): SwipeRecord[] => {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SwipeRecord[];
  } catch {
    return [];
  }
};

/** Сохранить полный список (внутреннее). */
const writeAll = (records: SwipeRecord[]) => {
  if (!isBrowser) return;
  try {
    // Обрезаем, чтобы не разрастаться бесконечно
    const trimmed = records.slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // QuotaExceededError, приватный режим — игнорируем
  }
};

/** Записать новый свайп. Если уже был свайп по этой игре — перезаписываем. */
export const recordSwipe = (record: Omit<SwipeRecord, "timestamp">): void => {
  const existing = getAllSwipes();
  const filtered = existing.filter((r) => r.gameId !== record.gameId);
  const next: SwipeRecord[] = [
    { ...record, timestamp: Date.now() },
    ...filtered,
  ];
  writeAll(next);
};

/** Множество id игр, которые уже свайпались (для исключения из пула). */
export const getSwipedIds = (): Set<number> => {
  return new Set(getAllSwipes().map((r) => r.gameId));
};

/** Получить только лайки (для экрана "что мне понравилось"). */
export const getLikedSwipes = (): SwipeRecord[] => {
  return getAllSwipes().filter((r) => r.action === "like");
};

/** Сбросить всю историю свайпов. */
export const clearSwipes = (): void => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/** Количество всех свайпов. */
export const getSwipeCount = (): number => getAllSwipes().length;

/** Количество лайков. */
export const getLikeCount = (): number => getLikedSwipes().length;
