// Secure client-side account helpers for ACE-USF.
// Firestore and Storage Rules enforce data permissions.
import { auth, authPersistenceReady, db, storage } from "./firebase_config.js";
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, sendPasswordResetEmail, updateProfile,
  sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

// The Firebase Authentication UID for the ACE-USF site owner.
const OWNER_ADMIN_UID = "Ya2V98lprcVm9HZvLiB0b6Ax8xj1";

const profileRef = uid => doc(db, "userProfiles", uid);

export async function registerWithEmail({
  name,
  email,
  password,
  campus,
  department = "",
  sex = ""
}) {
  await authPersistenceReady;
  if (String(password || "").length < 8) {
    throw new Error("Use at least 8 characters for your password.");
  }

  const displayName = String(name || "").trim();
  const cleanCampus = String(campus || "").trim();
  const cleanDepartment = String(department || "").trim();
  const cleanSex = String(sex || "").trim().toLowerCase();
  if (!displayName) throw new Error("Enter your full name to create an account.");
  if (!cleanCampus) throw new Error("Choose your university or college to create an account.");
  if (!cleanDepartment) throw new Error("Choose your department to create your account.");
  if (!["female", "male"].includes(cleanSex)) throw new Error("Choose the sex recorded for your account.");

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await updateProfile(credential.user, { displayName });

  await setDoc(profileRef(credential.user.uid), {
    uid: credential.user.uid,
    displayName,
    email: credential.user.email,
    campus: cleanCampus,
    department: cleanDepartment,
    sex: cleanSex,
    telegram: "",
    bio: "",
    photoURL: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await sendEmailVerification(credential.user);

  return credential.user;
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in first.");
  }

  if (!user.emailVerified) {
    await sendEmailVerification(user);
  }
}

export async function signInWithEmail({ email, password }) {
  await authPersistenceReady;
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return credential.user;
}

export async function signInWithGoogle(profileDetails = {}) {
  await authPersistenceReady;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  const refForUser = profileRef(credential.user.uid);
  const existing = await getDoc(refForUser);

  if (!existing.exists()) {
    const campus = String(profileDetails.campus || "").trim();
    const department = String(profileDetails.department || "").trim();
    const sex = String(profileDetails.sex || "").trim().toLowerCase();
    if (!campus || !department || !["female", "male"].includes(sex)) {
      throw new Error("To create a Google account, first open Create Account and choose your university, department, and recorded sex. Then choose Continue with Google.");
    }
    await setDoc(refForUser, {
      uid: credential.user.uid,
      displayName: credential.user.displayName || "",
      email: credential.user.email || "",
      campus,
      department,
      sex,
      telegram: "",
      bio: "",
      photoURL: credential.user.photoURL || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  return credential.user;
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getMyProfile() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in first.");
  }

  const snapshot = await getDoc(profileRef(user.uid));

  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveMyProfile({
  displayName,
  campus,
  telegram,
  bio
}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in first.");
  }

  const cleanName = String(displayName || "").trim();

  if (!cleanName) {
    throw new Error("Enter your name.");
  }

  await updateProfile(user, { displayName: cleanName });

  await setDoc(profileRef(user.uid), {
    displayName: cleanName,
    campus: String(campus || "").trim(),
    telegram: String(telegram || "").trim(),
    bio: String(bio || "").trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function uploadMyProfilePhoto(file) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in first.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file?.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photos must be 5 MB or smaller.");
  }

  const extension =
    file.type === "image/png" ? "png" :
    file.type === "image/webp" ? "webp" :
    "jpg";

  const photoRef = ref(
    storage,
    `profilePhotos/${user.uid}/avatar.${extension}`
  );

  await uploadBytes(photoRef, file, { contentType: file.type });

  const photoURL = await getDownloadURL(photoRef);

  await updateProfile(user, { photoURL });

  await setDoc(profileRef(user.uid), {
    photoURL,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return photoURL;
}

export async function changeMyPassword({ currentPassword, newPassword }) {
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error(
      "Sign in with email and password to change your password."
    );
  }

  if (String(newPassword || "").length < 8) {
    throw new Error("Use at least 8 characters for your new password.");
  }

  const credential = EmailAuthProvider.credential(
    user.email,
    currentPassword
  );

  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function sendPasswordReset(email) {
  if (!email?.trim()) {
    throw new Error("Enter your account email first.");
  }

  await sendPasswordResetEmail(auth, email.trim());
}

export async function isCurrentUserAdmin() {
  return auth.currentUser?.uid === OWNER_ADMIN_UID;
}

export async function signOutCurrentUser() {
  await signOut(auth);
}
