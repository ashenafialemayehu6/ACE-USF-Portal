// ACE-USF Firebase web configuration.
// Browser configuration is public by design; protect data with Firebase Rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { browserLocalPersistence, getAuth, setPersistence } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1jfD0Mb-GtRDBv4QuVfE06M9MK_SoGKo",
  authDomain: "ace-usf-portal.firebaseapp.com",
  projectId: "ace-usf-portal",
  storageBucket: "ace-usf-portal.firebasestorage.app",
  messagingSenderId: "318441166150",
  appId: "1:318441166150:web:abf569b638ba56b021c147",
  measurementId: "G-GNWD07061J"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Keep member sessions across browser restarts until they explicitly sign out.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch(error => {
  console.warn("Could not set persistent sign-in storage:", error);
  return false;
});
export const db = getFirestore(app);
export const storage = getStorage(app);
