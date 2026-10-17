import { db, auth } from "../../firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  getDoc
} from "firebase/firestore";

export type GameStatus = "Backlog" | "Playing" | "Completed" | "Dropped" | "Wishlist" | "Not Interested" | "Liked";

export interface CollectedGame {
  id: number;
  name: string;
  background_image: string;
  genres: string[];
  addedAt: number;
  status: GameStatus;
  rating?: number;
  note?: string;
  hoursPlayed?: number;
  playingOn?: string; // Platform name/ID
  completedAt?: number;
  playtime?: number;
}

export interface UserSettings {
  my_devices?: number[];
  displayName?: string;
  photoURL?: string;
  isPublic?: boolean;
}

const collectionPayload = (game: {
  id: number;
  name: string;
  background_image: string;
  genres: string[];
  status?: GameStatus;
  rating?: number;
  note?: string;
  hoursPlayed?: number;
  playingOn?: string;
  completedAt?: number;
}) => {
  const payload: Record<string, unknown> = {
    id: game.id,
    name: game.name,
    background_image: game.background_image,
    genres: game.genres,
    status: game.status || "Backlog",
    note: game.note || "",
    hoursPlayed: game.hoursPlayed || 0,
    playingOn: game.playingOn || "",
    completedAt: game.completedAt ?? null,
    addedAt: Date.now(),
  };
  if (typeof game.rating === "number" && game.rating > 0) {
    payload.rating = game.rating;
  }
  return payload;
};

const COLLECTION_NAME = "user_collections";

export const addToCollection = async (game: { 
  id: number; 
  name: string; 
  background_image: string; 
  genres: string[];
  status?: GameStatus;
  rating?: number;
  note?: string;
  hoursPlayed?: number;
  playingOn?: string;
  completedAt?: number;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const gameRef = doc(db, COLLECTION_NAME, user.uid, "games", game.id.toString());
  await setDoc(gameRef, collectionPayload(game));
};

export const addToCollectionIfMissing = async (game: {
  id: number;
  name: string;
  background_image: string;
  genres: string[];
  status?: GameStatus;
  rating?: number;
  note?: string;
  hoursPlayed?: number;
  playingOn?: string;
  completedAt?: number;
}): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const gameRef = doc(db, COLLECTION_NAME, user.uid, "games", game.id.toString());
  const existing = await getDoc(gameRef);
  if (existing.exists()) return false;

  await setDoc(gameRef, collectionPayload(game), { merge: true });
  return true;
};

export const updateGameMetadata = async (gameId: number, data: { 
  status?: GameStatus; 
  rating?: number; 
  note?: string;
  hoursPlayed?: number;
  playingOn?: string;
  completedAt?: number | null;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const gameRef = doc(db, COLLECTION_NAME, user.uid, "games", gameId.toString());
  await setDoc(gameRef, data, { merge: true });
};

export const updateGameStatus = async (gameId: number, status: GameStatus) => {
  await updateGameMetadata(gameId, { status });
};

export const removeFromCollection = async (gameId: number) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const gameRef = doc(db, COLLECTION_NAME, user.uid, "games", gameId.toString());
  await deleteDoc(gameRef);
};

export const isInCollection = async (gameId: number): Promise<CollectedGame | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const gameRef = doc(db, COLLECTION_NAME, user.uid, "games", gameId.toString());
  const docSnap = await getDoc(gameRef);
  if (docSnap.exists()) {
    return docSnap.data() as CollectedGame;
  }
  return null;
};

export const getUserDevices = async (uid?: string): Promise<number[]> => {
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) return [];

  const settingsRef = doc(db, "user_settings", effectiveUid);
  const docSnap = await getDoc(settingsRef);
  if (docSnap.exists()) {
    return docSnap.data().my_devices || [];
  }
  return [];
};

export const saveUserDevices = async (deviceIds: number[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const settingsRef = doc(db, "user_settings", user.uid);
  await setDoc(settingsRef, { my_devices: deviceIds }, { merge: true });
};

export const getUserSettings = async (uid?: string): Promise<UserSettings | null> => {
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) return null;

  const settingsRef = doc(db, "user_settings", effectiveUid);
  const docSnap = await getDoc(settingsRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserSettings;
};

export const saveUserSettings = async (data: Partial<UserSettings>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const settingsRef = doc(db, "user_settings", user.uid);
  await setDoc(settingsRef, data, { merge: true });
};

export const getUserCollection = async (uid?: string): Promise<CollectedGame[]> => {
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) return [];

  const gamesRef = collection(db, COLLECTION_NAME, effectiveUid, "games");
  const q = query(gamesRef);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as CollectedGame)
    .sort((a, b) => b.addedAt - a.addedAt);
};
