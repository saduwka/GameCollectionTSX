// FILE: src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

const readEnv = (key: string) => {
  const fromVite = import.meta.env?.[key];
  if (typeof fromVite === "string" && fromVite) return fromVite;
  const nodeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return nodeProcess?.env?.[key] || "";
};

// ✅ Конфигурация Firebase через переменные окружения
const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID")
};

// ✅ Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider };
