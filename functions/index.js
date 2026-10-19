const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");

initializeApp();
// ACE-USF Telegram website assistant webhook
Object.assign(exports, require("./telegram_bot"));

const auth = getAuth();
const db = getFirestore();
const ownerEmail = defineString("ACE_USF_OWNER_EMAIL");

// One-time setup for the verified owner account.
exports.bootstrapOwner = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const email = String(request.auth.token.email || "")
    .trim()
    .toLowerCase();
  const configuredOwner = ownerEmail.value().trim().toLowerCase();

  if (
    !request.auth.token.email_verified ||
    !configuredOwner ||
    email !== configuredOwner
  ) {
    throw new HttpsError(
      "permission-denied",
      "This account is not the configured owner."
    );
  }

  const stateRef = db.doc("_system/security");

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(stateRef);

    if (
      snapshot.exists &&
      snapshot.data().adminBootstrapComplete === true
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Admin setup has already been completed."
      );
    }

    if (
      snapshot.exists &&
      snapshot.data().bootstrapUid &&
      snapshot.data().bootstrapUid !== request.auth.uid
    ) {
      throw new HttpsError(
        "permission-denied",
        "Admin setup is reserved for the owner account."
      );
    }

    transaction.set(
      stateRef,
      {
        bootstrapUid: request.auth.uid,
        adminBootstrapComplete: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  const user = await auth.getUser(request.auth.uid);

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: true,
  });

  await stateRef.set(
    {
      bootstrapUid: user.uid,
      adminBootstrapComplete: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ok: true,
    message: "Admin enabled. Sign out and back in to refresh access.",
  };
});

// Existing admins can grant or remove admin access.
exports.setAdminAccess = onCall(async (request) => {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Administrator permission is required."
    );
  }

  const email = String(request.data?.email || "")
    .trim()
    .toLowerCase();
  const enabled = request.data?.enabled === true;

  if (!email || email.length > 254) {
    throw new HttpsError("invalid-argument", "Enter a valid account email.");
  }

  // Keep the configured owner account protected from admin removal.
  if (
    !enabled &&
    email === ownerEmail.value().trim().toLowerCase()
  ) {
    throw new HttpsError(
      "failed-precondition",
      "The configured owner cannot be removed as an administrator."
    );
  }

  let target;

  try {
    target = await auth.getUserByEmail(email);
  } catch {
    throw new HttpsError("not-found", "That account has not registered yet.");
  }

  if (!target.emailVerified) {
    throw new HttpsError(
      "failed-precondition",
      "The account must verify its email first."
    );
  }

  const claims = { ...(target.customClaims || {}) };

  if (enabled) {
    claims.admin = true;
  } else {
    delete claims.admin;
  }

  await auth.setCustomUserClaims(target.uid, claims);

  await db.doc(`adminAudit/${Date.now()}-${target.uid}`).set({
    actorUid: request.auth.uid,
    targetUid: target.uid,
    targetEmail: target.email,
    action: enabled ? "grant-admin" : "remove-admin",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, enabled };
});
