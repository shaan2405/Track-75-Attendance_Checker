import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQZ8bBE2-z04VNnsFQjknGXZB_k_FuvxM",
  authDomain: "track75-f2b72.firebaseapp.com",
  projectId: "track75-f2b72",
  storageBucket: "track75-f2b72.firebasestorage.app",
  messagingSenderId: "39139019846",
  appId: "1:39139019846:web:5c8602c4f071f0c1b84e47",
  measurementId: "G-ZW8KWK38ZQ",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only runs in supported browser environments
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});