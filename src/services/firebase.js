import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config - replace with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyA9wzcpP9D1LWhLPDhvnWK12eq2zP8zSDg",
  authDomain: "karyakarta-app.firebaseapp.com",
  projectId: "karyakarta-app",
  storageBucket: "karyakarta-app.firebasestorage.app",
  messagingSenderId: "831509294632",
  appId: "1:831509294632:web:fbf9ac923a9946cce88f1d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;