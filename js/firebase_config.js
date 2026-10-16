// ACE-USF Firebase web configuration.
// Browser configuration is public by design; protect data with Firebase Rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
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
export const db = getFirestore(app);
export const storage = getStorage(app);
