// js/auth_service.js

// Register new student account
export async function registerStudent(email, password) {
  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    console.log("Registered student:", userCredential.user);
    alert("Welcome to ACE-USF! Account created successfully.");
    return userCredential.user;
  } catch (error) {
    console.error("Registration error:", error.message);
    throw error; // Let app.js handle displaying the error in the form
  }
}

// Sign in existing student
export async function loginStudent(email, password) {
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    console.log("Logged in student:", userCredential.user);
    alert("Welcome back to ACE-USF!");
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error; // Let app.js handle displaying the error in the form
  }
}

// Sign out student
export async function logoutStudent() {
  try {
    await firebase.auth().signOut();
    alert("Signed out successfully.");
  } catch (error) {
    console.error("Logout error:", error.message);
  }
}

// Listen for auth state changes
export function checkAuthState(callback) {
  firebase.auth().onAuthStateChanged((user) => {
    callback(user);
  });
}