// Firebase configuration for ACE-USF Portal
const firebaseConfig = {
  apiKey: "AIzaSyA1jfD0Mb-GtRDBv4QuVfE06M9MK_SoGKo",
  authDomain: "ace-usf-portal.firebaseapp.com",
  projectId: "ace-usf-portal",
  storageBucket: "ace-usf-portal.firebasestorage.app",
  messagingSenderId: "318441166150",
  appId: "1:318441166150:web:abf569b638ba56b021c147",
  measurementId: "G-GNWD07061J"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Export Firebase services for global app access
const auth = firebase.auth();
const db = firebase.firestore();