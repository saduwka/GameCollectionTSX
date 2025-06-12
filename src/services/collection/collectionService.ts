import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { Game } from "../../types/game";

const COLLECTION_NAME = "games";

// ✅ Добавить игру в коллекцию пользователя
export const addGameToCollection = async (
  game: Game & { status: string },
  userId: string
) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("id", "==", game.id),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.warn("Game already in user's collection");
      return;
    }

    await addDoc(collection(db, COLLECTION_NAME), {
      ...game,
      userId,
    });
  } catch (error) {
    console.error("Error adding game:", error);
  }
};

// ✅ Удалить игру пользователя по ID
export const removeGameFromCollection = async (
  gameId: number,
  userId: string
) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("id", "==", gameId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id));
    });
  } catch (error) {
    console.error("Error removing game:", error);
  }
};

// ✅ Получить коллекцию пользователя
export const getUserCollection = async (
  userId: string
): Promise<(Game & { status: string })[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Game & { status: string });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return [];
  }
};
