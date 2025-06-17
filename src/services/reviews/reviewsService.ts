import {
    collection,
    addDoc,
    query,
    getDocs,
    serverTimestamp
  } from "firebase/firestore";
import { db } from "../../firebase";
  
  export interface Review {
    id?: string;
    userId: string;
    username: string;
    comment: string;
    rating: number;
    createdAt?: any;
  }
  
  // Добавить новый отзыв
  export async function addReview(gameId: string, review: Omit<Review, "id" | "createdAt">) {
    const docRef = await addDoc(collection(db, "games", gameId, "reviews"), {
      ...review,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
  
  // Получить все отзывы по игре
  export async function getReviews(gameId: string): Promise<Review[]> {
    const reviewsCol = collection(db, "games", gameId, "reviews");
    const q = query(reviewsCol);
    const querySnapshot = await getDocs(q);
  
    const reviews: Review[] = [];
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...(doc.data() as Omit<Review, "id">),
      });
    });
    return reviews;
  }