const crypto = require("node:crypto");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function secretMatches(received, expected) {
  if (!received || !expected) return false;

  const receivedBuffer = Buffer.from(String(received));
  const expectedBuffer = Buffer.from(String(expected));

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function getDatabase() {
  const existingApps = getApps();
  let app = existingApps.find((item) => item.name === "[DEFAULT]");

  if (!app) {
    const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!rawAccount) {
      throw Object.assign(new Error("Firebase credentials are not configured"), {
        code: "MISSING_CREDENTIALS"
      });
    }

    const serviceAccount = JSON.parse(rawAccount);

    if (serviceAccount.private_key) {
      serviceAccount.private_key =
        serviceAccount.private_key.replace(/\\n/g, "\n");
    }

    if (
      !serviceAccount.project_id ||
      !serviceAccount.client_email ||
      !serviceAccount.private_key
    ) {
      throw Object.assign(new Error("Firebase credentials are incomplete"), {
        code: "INVALID_CREDENTIALS"
      });
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }

  return getFirestore(app);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const receivedSecret =
    req.headers["x-telegram-bot-api-secret-token"];

  if (!secretMatches(receivedSecret, expectedSecret)) {
    return res.status(403).send("Forbidden");
  }

  try {
    const database = getDatabase();

    // Read-only check: this does not create or change a Firestore document.
    await database.collection("telegramBotSessions").limit(1).get();

    return res.status(200).json({
      ok: true,
      firebase: "connected",
      check: "read-only"
    });
  } catch (error) {
    console.error(
      "ACE-USF Firebase check failed:",
      error?.name || "Error",
      error?.code || "NO_CODE"
    );

    return res.status(500).json({
      ok: false,
      error: "Firebase check failed",
      errorType: error?.name || "Error",
      errorCode: error?.code || null
    });
  }
};