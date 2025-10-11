// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6oytRqE418n0NH0MZWNZl151y9fDdiG8",
  authDomain: "lifesync-9cdfd.firebaseapp.com",
  projectId: "lifesync-9cdfd",
  storageBucket: "lifesync-9cdfd.appspot.com",
  messagingSenderId: "5598507336",
  appId: "1:5598507336:web:60b6cb0dcd1129ccbb437d"
};

const app = initializeApp(firebaseConfig); // ✅ This is what we want to export as firebaseApp
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth state persistence initialized");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export { auth, getAuth, db, app as firebaseApp }; // ✅ Add this line
