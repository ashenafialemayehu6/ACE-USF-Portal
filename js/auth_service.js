// Drop-in replacement for js/auth_service.js.
// Keeps the existing export names, while using modular Firebase imports.
// Import this from app.js with: import { registerStudent, loginStudent,
// logoutStudent, checkAuthState } from './auth_service.js';
import {
  registerWithEmail, signInWithEmail, signOutCurrentUser, watchAuth,
  getMyProfile, saveMyProfile, uploadMyProfilePhoto, changeMyPassword,
  sendPasswordReset, resendVerificationEmail, signInWithGoogle, isCurrentUserAdmin
} from "./firebase_auth_service.js";

// Existing callers can keep registerStudent(email, password). Pass profile
// fields as the optional third argument to save name and campus on registration.
export async function registerStudent(email, password, profile = {}) {
  const name = String(profile.name || profile.displayName || email.split("@")[0]).trim();
  const campus = String(profile.campus || "").trim();
  const department = String(profile.department || "").trim();
  const sex = String(profile.sex || "").trim();
  return registerWithEmail({ name, email, password, campus, department, sex });
}

export async function loginStudent(email, password) {
  return signInWithEmail({ email, password });
}

export async function logoutStudent() {
  return signOutCurrentUser();
}

export function checkAuthState(callback) {
  return watchAuth(callback);
}

// Account tools for the signed-in user's private account page.
export {
  getMyProfile,
  saveMyProfile,
  uploadMyProfilePhoto,
  changeMyPassword,
  sendPasswordReset,
  resendVerificationEmail,
  signInWithGoogle,
  isCurrentUserAdmin
};
