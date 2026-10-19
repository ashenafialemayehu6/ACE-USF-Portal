// Issues a short-lived LiveKit token only after Firebase authentication and
// the Meeting Hall's current Firestore membership rules are checked server-side.
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { AccessToken } = require("livekit-server-sdk");

const OWNER_UID = process.env.ACE_USF_FIREBASE_ADMIN_UID || "Ya2V98lprcVm9HZvLiB0b6Ax8xj1";

function initializeFirebase() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Firebase service account is not configured on the server.");
  const serviceAccount = JSON.parse(raw);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
}

function setCors(req, res) {
  const origin = String(req.headers.origin || "");
  const allowed = new Set([
    "https://ace-usf-portal.web.app",
    "https://ace-usf-portal.firebaseapp.com"
  ]);
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (allowed.has(origin) || local) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");
}

function json(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

function roomName(programId) {
  const clean = String(programId || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 48);
  if (!clean) throw new Error("Invalid meeting program.");
  return `ace-${clean}`;
}

function membershipAllows(audience, program, member, profile, isAdmin) {
  if (isAdmin) return true;
  if (audience === "all") return true;
  if (!member || member.active !== true || !profile) return false;
  if (typeof profile.department !== "string" || !profile.department.trim()) return false;
  if (audience === "department") return Boolean(program.department) && profile.department === program.department && member.department === profile.department;
  if (audience === "departmentGroup") return Boolean(program.departmentGroup) && member.department === profile.department && member.departmentGroup === program.departmentGroup;
  if (audience === "leaders") return member.department === profile.department && member.leadersOnly === true;
  if (audience === "women") return profile.sex === "female" && member.sex === "female" && member.womenMinistry === true;
  return false;
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return json(res, 405, { error: "Method not allowed" });
  }

  const origin = String(req.headers.origin || "");
  const allowedOrigin = origin === "https://ace-usf-portal.web.app"
    || origin === "https://ace-usf-portal.firebaseapp.com"
    || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin && !allowedOrigin) return json(res, 403, { error: "This website is not allowed to request meeting access." });

  try {
    initializeFirebase();
    const bearer = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
    if (!bearer) return json(res, 401, { error: "Sign in to your ACE-USF account before joining." });
    const decoded = await getAuth().verifyIdToken(bearer[1], true);
    const programId = String(req.body?.programId || "").trim();
    if (!programId || programId.length > 150 || programId.includes("/")) return json(res, 400, { error: "A valid meeting program is required." });

    const database = getFirestore();
    const programRef = database.doc(`siteContent/meetingPrograms/items/${programId}`);
    const memberRef = database.doc(`meetingRoomMembers/${decoded.uid}`);
    const profileRef = database.doc(`userProfiles/${decoded.uid}`);
    const secretRef = database.doc(`meetingProgramSecrets/${programId}`);
    const [programSnapshot, memberSnapshot, profileSnapshot, secretSnapshot, userRecord] = await Promise.all([
      programRef.get(), memberRef.get(), profileRef.get(), secretRef.get(), getAuth().getUser(decoded.uid)
    ]);
    if (!programSnapshot.exists || programSnapshot.data().published !== true) {
      return json(res, 404, { error: "This meeting is not currently published." });
    }
    const program = programSnapshot.data();
    if (program.liveAudioRoom !== true || !["online", "hybrid"].includes(program.format)) {
      return json(res, 409, { error: "The administrator has not enabled a Live Audio Room for this gathering." });
    }

    const isOwner = decoded.uid === OWNER_UID;
    const member = memberSnapshot.exists ? memberSnapshot.data() : null;
    const profile = profileSnapshot.exists ? profileSnapshot.data() : null;
    if (!membershipAllows(program.audience, program, member, profile, isOwner)) {
      return json(res, 403, { error: "Your account is not approved for this meeting group." });
    }

    const secret = secretSnapshot.exists ? secretSnapshot.data() : {};
    const isHost = isOwner || (Boolean(secret.hostUid) && secret.hostUid === decoded.uid && member?.active === true);
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;
    if (!apiKey || !apiSecret || !serverUrl) return json(res, 503, { error: "Live meeting service is not configured yet." });

    const name = String(userRecord.displayName || decoded.name || userRecord.email || "ACE-USF member").slice(0, 100);
    const token = new AccessToken(apiKey, apiSecret, { identity: decoded.uid, name, ttl: "45m" });
    token.addGrant({
      roomJoin: true,
      room: roomName(programId),
      canSubscribe: true,
      canPublish: isHost,
      canPublishSources: isHost ? ["microphone"] : [],
      canPublishData: true,
      roomAdmin: false
    });
    return json(res, 200, {
      token: await token.toJwt(),
      serverUrl,
      roomName: roomName(programId),
      role: isHost ? "leader" : "listener",
      displayName: name,
      title: String(program.title || "ACE-USF Live Meeting").slice(0, 200)
    });
  } catch (error) {
    console.error("Meeting token request failed:", error?.name || "Error", error?.code || "");
    if (error?.code === "auth/id-token-expired" || error?.code === "auth/argument-error" || error?.code === "auth/invalid-id-token") {
      return json(res, 401, { error: "Your sign-in session expired. Sign in again and retry." });
    }
    return json(res, 500, { error: "Could not prepare this meeting. Please try again or contact support." });
  }
};
