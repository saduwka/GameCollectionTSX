
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

  
  // Коллекция Firestore
  const COLLECTION_NAME = "games";
  
  // ✅ Добавить игру в коллекцию
  export const addGameToCollection = async (game: Game & { status: string }) => {
    try {
      // Проверка: уже есть такая игра?
      const q = query(
        collection(db, COLLECTION_NAME),
        where("id", "==", game.id)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.warn("Game already in collection");
        return;
      }
  
      await addDoc(collection(db, COLLECTION_NAME), game);
    } catch (error) {
      console.error("Error adding game:", error);
    }
  };
  
  // ✅ Удалить игру по ID
  export const removeGameFromCollection = async (gameId: number) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("id", "==", gameId)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id));
      });
    } catch (error) {
      console.error("Error removing game:", error);
    }
  };
  
  // ✅ Получить все игры из коллекции
  export const getUserCollection = async (): Promise<(Game & { status: string })[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs.map((doc) => doc.data() as Game & { status: string });
    } catch (error) {
      console.error("Error fetching collection:", error);
      return [];
    }
  };