import { db, auth } from "../../firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  getDoc,
  runTransaction,
  updateDoc,
  deleteField,
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

export interface PublicProfile {
  displayName: string;
  photoURL: string;
  isPublic: boolean;
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
const PUBLIC_PROFILES = "public_profiles";

const requireUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");
  return user;
};

const gameRefFor = (uid: string, gameId: number) =>
  doc(db, COLLECTION_NAME, uid, "games", gameId.toString());

const privateNoteRef = (uid: string, gameId: number) =>
  doc(db, COLLECTION_NAME, uid, "private", gameId.toString());

const savePrivateNote = async (uid: string, gameId: number, note: string) => {
  await setDoc(privateNoteRef(uid, gameId), { note });
};

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
  const user = requireUser();
  await setDoc(gameRefFor(user.uid, game.id), collectionPayload(game));
  if (game.note !== undefined) await savePrivateNote(user.uid, game.id, game.note);
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
  const user = requireUser();
  const uid = user.uid;
  const gameRef = gameRefFor(uid, game.id);

  const created = await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(gameRef);
    if (existing.exists()) return false;
    transaction.set(gameRef, collectionPayload(game));
    return true;
  });

  if (created && game.note) await savePrivateNote(uid, game.id, game.note);
  return created;
};

export const updateGameMetadata = async (gameId: number, data: { 
  status?: GameStatus; 
  rating?: number; 
  note?: string;
  hoursPlayed?: number;
  playingOn?: string;
  completedAt?: number | null;
}) => {
  const user = requireUser();
  const { note, ...gameFields } = data;
  if (Object.keys(gameFields).length > 0) {
    await setDoc(gameRefFor(user.uid, gameId), gameFields, { merge: true });
  }
  if (note !== undefined) await savePrivateNote(user.uid, gameId, note);
};

export const updateGameStatus = async (gameId: number, status: GameStatus) => {
  await updateGameMetadata(gameId, { status });
};

export const removeFromCollection = async (gameId: number) => {
  const user = requireUser();
  await deleteDoc(gameRefFor(user.uid, gameId));
  await deleteDoc(privateNoteRef(user.uid, gameId));
};

export const isInCollection = async (gameId: number): Promise<CollectedGame | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const docSnap = await getDoc(gameRefFor(user.uid, gameId));
  if (!docSnap.exists()) return null;

  const noteSnap = await getDoc(privateNoteRef(user.uid, gameId));
  const game = docSnap.data() as CollectedGame;
  return {
    ...game,
    note: noteSnap.exists() ? String(noteSnap.data().note ?? "") : game.note,
  };
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

const withoutPublicNote = (game: CollectedGame): CollectedGame => {
  const rest = { ...game };
  delete rest.note;
  return rest;
};

export const migrateOwnedNotes = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const gamesRef = collection(db, COLLECTION_NAME, user.uid, "games");
  const snapshot = await getDocs(query(gamesRef));
  await Promise.all(snapshot.docs.map(async (gameDoc) => {
    if (!Object.prototype.hasOwnProperty.call(gameDoc.data(), "note")) return;
    const note = gameDoc.data().note;
    if (typeof note === "string" && note) {
      await setDoc(doc(db, COLLECTION_NAME, user.uid, "private", gameDoc.id), { note });
    }
    await updateDoc(gameDoc.ref, { note: deleteField() });
  }));
};

export const getUserCollection = async (uid?: string): Promise<CollectedGame[]> => {
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) return [];
  const isOwn = effectiveUid === auth.currentUser?.uid;

  const gamesRef = collection(db, COLLECTION_NAME, effectiveUid, "games");
  const querySnapshot = await getDocs(query(gamesRef));
  const notes = new Map<string, string>();

  if (isOwn) {
    const privateSnapshot = await getDocs(collection(db, COLLECTION_NAME, effectiveUid, "private"));
    privateSnapshot.docs.forEach((noteDoc) => {
      notes.set(noteDoc.id, String(noteDoc.data().note ?? ""));
    });
  }

  return querySnapshot.docs
    .map((gameDoc) => {
      const game = gameDoc.data() as CollectedGame;
      if (!isOwn) return withoutPublicNote(game);
      return { ...withoutPublicNote(game), note: notes.get(gameDoc.id) || "" };
    })
    .sort((a, b) => b.addedAt - a.addedAt);
};

export const getPublicProfile = async (uid?: string): Promise<PublicProfile | null> => {
  const effectiveUid = uid || auth.currentUser?.uid;
  if (!effectiveUid) return null;

  const snapshot = await getDoc(doc(db, PUBLIC_PROFILES, effectiveUid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
    isPublic: data.isPublic === true,
  };
};

export const savePublicProfile = async (profile: PublicProfile) => {
  const user = requireUser();
  await setDoc(doc(db, PUBLIC_PROFILES, user.uid), {
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    isPublic: profile.isPublic,
  });
};

export const ensurePublicProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await migrateOwnedNotes();

  const profileRef = doc(db, PUBLIC_PROFILES, user.uid);
  const existing = await getDoc(profileRef);
  if (existing.exists()) return;

  const settingsRef = doc(db, "user_settings", user.uid);
  const settingsSnap = await getDoc(settingsRef);
  const settings = settingsSnap.exists() ? settingsSnap.data() : {};
  await setDoc(profileRef, {
    displayName: typeof settings.displayName === "string" ? settings.displayName : user.displayName || "",
    photoURL: typeof settings.photoURL === "string" ? settings.photoURL : user.photoURL || "",
    isPublic: settings.isPublic === true,
  });

  if (settingsSnap.exists()) {
    await updateDoc(settingsRef, {
      displayName: deleteField(),
      photoURL: deleteField(),
      isPublic: deleteField(),
    });
  }
};
