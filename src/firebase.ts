import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

// ✅ Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHBomkD-I4E-NbGXy97EoEWPNVIo-HmCY",
  authDomain: "gamecollection-ff71a.firebaseapp.com", // Всегда полный домен проекта!
  projectId: "gamecollection-ff71a",
  storageBucket: "gamecollection-ff71a.appspot.com",
  messagingSenderId: "295175847930",
  appId: "1:295175847930:web:9ca24dd6d40e1c05f56e43"
};

// ✅ Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ✅ Локальное сохранение сессии
setPersistence(auth, browserLocalPersistence).catch(console.error);

export { app, db, auth, googleProvider };
