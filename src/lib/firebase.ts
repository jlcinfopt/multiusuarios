import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Read config from environment or fallback to provisioned values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBJ8C47iZNe3-ATdJoYZLAbXGboiRFRyTU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "primeval-stock-rt8c4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "primeval-stock-rt8c4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "primeval-stock-rt8c4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "3129066788",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:3129066788:web:618980b356c13a4a5d9fb1",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
