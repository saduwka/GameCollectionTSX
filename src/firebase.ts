import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCHBomkD-I4E-NbGXy97EoEWPNVIo-HmCY',
  authDomain: 'gamecollection-ff71a.firebaseapp.com',
  projectId: 'gamecollection-ff71a',
  storageBucket: 'gamecollection-ff71a.appspot.com', 
  messagingSenderId: '295175847930',
  appId: '1:295175847930:web:9ca24dd6d40e1c05f56e43',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, db, auth, provider };
