// ACE-USF Telegram webhook for Vercel.
// Persistent conversation state lives in Firestore so requests can run on any instance.
const crypto = require("node:crypto");
// Use Firebase Admin's modular API. This works with firebase-admin v14 on Vercel.
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const defaultSiteUrl = "https://ace-usf-portal.web.app";
const configuredSiteUrl = String(process.env.ACE_USF_SITE_URL || "").trim();
let siteUrl = defaultSiteUrl;
try {
  const parsedSiteUrl = new URL(configuredSiteUrl);
  if (["https:", "http:"].includes(parsedSiteUrl.protocol) && parsedSiteUrl.hostname.includes(".")) {
    siteUrl = parsedSiteUrl.origin;
  }
} catch {
  // Keep the known ACE-USF site URL if the environment value is malformed.
}
const adminIds = new Set(String(process.env.ACE_USF_TELEGRAM_ADMIN_IDS || "").split(/[\s,]+/).filter(x => /^\d+$/.test(x)));
const ownerUid = process.env.ACE_USF_FIREBASE_ADMIN_UID || "Ya2V98lprcVm9HZvLiB0b6Ax8xj1";

function initFirebase() {
  if (getApps().length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  const serviceAccount = JSON.parse(raw);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
}
function db() { initFirebase(); return getFirestore(); }
function constantTimeMatch(a, b) {
  if (!a || !b) return false;
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
async function tg(method, payload) {
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(`Telegram ${method} failed: ${result.description || response.status}`);
  return result.result;
}
const send = (chatId, text, reply_markup) => tg("sendMessage", {
  chat_id: chatId, text: String(text).slice(0, 4000), disable_web_page_preview: true,
  ...(reply_markup ? { reply_markup } : {})
});
const sessionRef = chatId => db().collection("telegramBotSessions").doc(String(chatId));
async function getSession(chatId) { const s = await sessionRef(chatId).get(); return s.exists ? s.data() : null; }
async function saveSession(chatId, value) { await sessionRef(chatId).set({ ...value, updatedAt: FieldValue.serverTimestamp() }); }
async function clearSession(chatId) { await sessionRef(chatId).delete().catch(() => {}); }
function keyboard() {
  return { inline_keyboard: [
    [{ text: "Share advice or testimony", callback_data: "advice:begin" }],
    [{ text: "Contact support", callback_data: "support:begin" }],
    [{ text: "Open ACE-USF website", url: siteUrl }],
    [{ text: "Apostolic Library", url: `${siteUrl}/#apostolic-library` }, { text: "Campus Network", url: `${siteUrl}/#campus-network` }]
  ] };
}
function helpText() {
  return ["Welcome to the ACE-USF Website Assistant.", "Use a command or ask about the website:",
    "/library — Apostolic Library", "/campus — Campus Network", "/audio — Audio Room",
    "/meetings — Meeting Hall", "/advice — share advice or testimony", "/support — contact the support team", "/whoami — show your Telegram ID"].join("\n");
}
function answer(text) {
  const q = String(text || "").toLowerCase();
  if (/library|bible|book/.test(q)) return `Explore Scripture and Christian reading resources in the Apostolic Library: ${siteUrl}/#apostolic-library`;
  if (/campus|university|college|department|city/.test(q)) return `Explore fellowship information by campus in the Campus Network: ${siteUrl}/#campus-network`;
  if (/audio|preaching|sermon|song|poem|music/.test(q)) return `Open the Audio Room from the ACE-USF website to find available preaching, songs, and poems: ${siteUrl}`;
  if (/meeting|bible study|conference|leaders|women.s ministry/.test(q)) return `Open the Meeting Hall from the ACE-USF website. Restricted gatherings require administrator approval: ${siteUrl}`;
  if (/advice|graduate|alumni|family|student/.test(q)) return `Open the Advice Room on the website, or use /advice here to share a submission for review: ${siteUrl}`;
  return helpText();
}
async function finishLink(chatId, from, code) {
  const database = db();
  const found = await database.collection("userProfiles").where("telegramLinkCode", "==", code).limit(2).get();
  if (found.size !== 1) return send(chatId, "That one-time link is invalid or already used. Create a fresh link from your ACE-USF profile.");
  const profile = found.docs[0];
  const expires = profile.data().telegramLinkExpiresAt?.toMillis?.() || 0;
  if (expires < Date.now()) return send(chatId, "That link has expired. Create a fresh link from your ACE-USF profile.");
  const other = await database.collection("userProfiles").where("telegramChatId", "==", String(chatId)).limit(2).get();
  if (other.docs.some(d => d.id !== profile.id)) return send(chatId, "This Telegram chat is already linked to another ACE-USF profile. Contact support if you need help.");
  await profile.ref.update({ telegramChatId: String(chatId), telegramUsername: from.username || "",
    telegramLinkedAt: FieldValue.serverTimestamp(), telegramLinkCode: FieldValue.delete(),
    telegramLinkExpiresAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
  return send(chatId, "Your ACE-USF profile is now linked to this Telegram chat. Meeting Hall decisions and Advice Room review updates can reach you here.", keyboard());
}
const sources = [["Current student", "currentStudent"], ["Alumnus / graduate", "alumnus"], ["Student’s family", "studentFamily"], ["Church servant", "churchServant"]];
const languages = ["Amharic", "Afaan Oromo", "Tigrinya", "Somali", "Afar", "Sidama", "Wolaytta", "Gurage", "Gamo", "Gedeo", "Hadiyya", "Kafa", "Kembata", "Dawro", "Silte", "Bench", "Konso", "Awi (Agaw)", "Kunama", "Nuer", "Me’en", "Anuak", "Harari", "English", "Other"];
function choice(items, prefix) { return { inline_keyboard: items.map((item, index) => [{ text: item[0], callback_data: `${prefix}:${item[1] ?? index}` }]) }; }
async function beginAdvice(chatId, from) {
  await saveSession(chatId, { type: "advice", step: "role", author: [from.first_name, from.last_name].filter(Boolean).join(" ").slice(0, 100) || "Telegram contributor", telegramName: [from.first_name, from.last_name].filter(Boolean).join(" ").slice(0, 100) });
  return send(chatId, "Who are you sharing advice as?", choice(sources.map(([label, id]) => [label, id]), "role"));
}
async function saveAdvice(chatId, message, session) {
  if (!adminIds.size) return send(chatId, "Advice submissions are temporarily unavailable. Please contact the ACE-USF team through the website.", keyboard());
  const database = db(); const ref = database.collection("siteContent").doc("studentAdvice").collection("items").doc();
  const advice = String(message.text || "").trim().slice(0, 2500);
  if (message.voice) {
    for (const adminId of adminIds) await tg("copyMessage", { chat_id: adminId, from_chat_id: chatId, message_id: message.message_id });
    await ref.set({ published: false, submissionStatus: "pending_review", author: session.author, title: session.title || "Voice advice submission", language: session.language, category: session.category || "Testimony", sourceType: session.sourceType, advice: "", university: session.university || "", department: session.department || "", churchPosition: session.churchPosition || "", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await db().collection("telegramAdviceSubmissions").doc(ref.id).set({ adviceId: ref.id, telegramChatId: String(chatId), telegramName: session.telegramName, status: "pending", submissionType: "voice", createdAt: FieldValue.serverTimestamp() });
    for (const id of adminIds) await send(id, `New voice advice submission for review\n${session.author} · ${session.language}\nID: ${ref.id}\nTranscribe it in the Admin Dashboard before approving.`);
  } else {
    if (!advice) return send(chatId, "Please send the advice as text, or use /cancel to stop.");
    await ref.set({ published: false, submissionStatus: "pending_review", author: session.author, title: session.title || "Advice submission", language: session.language, category: session.category || "Testimony", sourceType: session.sourceType, advice, universityName: session.university || "", department: session.department || "", churchPosition: session.churchPosition || "", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await db().collection("telegramAdviceSubmissions").doc(ref.id).set({ adviceId: ref.id, telegramChatId: String(chatId), telegramName: session.telegramName, status: "pending", submissionType: "text", createdAt: FieldValue.serverTimestamp() });
    for (const id of adminIds) await send(id, `New advice submission for review\n${session.author} · ${session.language}\nID: ${ref.id}\nApprove: /approveadvice ${ref.id}\nReject: /rejectadvice ${ref.id} reason`);
  }
  await clearSession(chatId);
  await send(chatId, "Thank you for sharing. Your submission was sent for administrator review. May God bless you.", keyboard());
}
async function handleAdviceCallback(chatId, data) {
  const session = await getSession(chatId); if (!session || session.type !== "advice") return send(chatId, "That form expired. Choose Share advice to begin again.", keyboard());
  const [kind, value] = data.split(":");
  if (kind === "role") { const source = sources.find(([, id]) => id === value); if (!source) return; session.sourceType = value; session.step = "language"; await saveSession(chatId, session); return send(chatId, "Choose the language for your advice.", choice(languages.map((label, i) => [label, i]), "lang")); }
  if (kind === "lang") { const lang = languages[Number(value)]; if (!lang) return; session.language = lang; session.step = lang === "Other" ? "languageOther" : (session.sourceType === "churchServant" ? "churchPosition" : ["currentStudent", "alumnus"].includes(session.sourceType) ? "university" : "title"); await saveSession(chatId, session); const prompts = { languageOther: "Type the language name.", churchPosition: "What is your church position? For example, bishop, priest, or another servant.", university: "Which university or college should be shown?", title: "Give your message a short title." }; return send(chatId, prompts[session.step]); }
}
async function processAdviceText(chatId, message, session) {
  const value = String(message.text || "").trim(); if (!value && !message.voice) return false;
  if (session.step === "languageOther") { session.language = value.slice(0, 60); session.step = session.sourceType === "churchServant" ? "churchPosition" : ["currentStudent", "alumnus"].includes(session.sourceType) ? "university" : "title"; }
  else if (session.step === "churchPosition") { session.churchPosition = value.slice(0, 120); session.step = "title"; }
  else if (session.step === "university") { session.university = value.slice(0, 160); session.step = "department"; }
  else if (session.step === "department") { session.department = value.slice(0, 120); session.step = "title"; }
  else if (session.step === "title") { session.title = value.slice(0, 140); session.step = "advice"; await saveSession(chatId, session); return send(chatId, "Write your advice or testimony. Or send a voice note; it will be reviewed privately."); }
  else if (session.step === "advice") return saveAdvice(chatId, message, session);
  else return false;
  await saveSession(chatId, session);
  return send(chatId, session.step === "department" ? "What is your department?" : session.step === "title" ? "Give your message a short title." : "Continue with your advice or testimony.");
}
async function pendingMeetings(chatId) {
  const snap = await db().collection("meetingAccessRequests").where("status", "==", "pending").limit(10).get();
  if (snap.empty) return send(chatId, "There are no pending Meeting Hall access requests.");
  const lines = snap.docs.map(d => { const x = d.data(); return `${x.requesterName || "Member"} · ${x.universityName || "University not provided"}\nDepartment: ${x.requestedDepartment || "Not recorded"} · Sex: ${x.profileSex || "Not recorded"}\nRole: ${x.fellowshipRole || "Role not provided"}\n${x.programTitle || "Meeting Hall"}\nID: ${d.id}\n/approve ${d.id} · /reject ${d.id} reason`; });
  return send(chatId, `Pending Meeting Hall requests:\n\n${lines.join("\n\n")}`);
}
async function reviewMeeting(id, status, note, actorId) {
  if (!id || id.includes("/")) return { message: "Use /approve ID or /reject ID reason." };
  const ref = db().doc(`meetingAccessRequests/${id}`);
  return db().runTransaction(async tx => {
    const snap = await tx.get(ref); if (!snap.exists) return { message: "Request not found." };
    const x = snap.data(); if (x.status !== "pending") return { message: `Request is already ${x.status}.` };
    if (status === "approved") {
      const profileRef = db().doc(`userProfiles/${x.uid}`);
      const profileSnap = await tx.get(profileRef);
      if (!profileSnap.exists) return { message: "Cannot approve: applicant profile is missing." };
      const profile = profileSnap.data();
      if (x.requestedDepartment !== profile.department || x.profileSex !== profile.sex) return { message: "Cannot approve: the request details do not match the applicant profile." };
      if (x.audience === "department" && x.requestedDepartment !== profile.department) return { message: "Cannot approve: the department does not match the applicant profile." };
      if (x.audience === "women" && profile.sex !== "female") return { message: "Cannot approve: Women’s Ministry requests require an account recorded as female." };
      const member = { uid: x.uid, name: x.requesterName || "ACE-USF member", department: profile.department || "", sex: profile.sex || "", active: true, updatedAt: FieldValue.serverTimestamp() };
      if (x.audience === "department") member.university = x.universityName || "";
      if (x.audience === "departmentGroup") member.departmentGroup = x.departmentGroup || "";
      if (x.audience === "leaders") member.leadersOnly = true;
      if (x.audience === "women") { member.sex = "female"; member.womenMinistry = true; }
      tx.set(db().doc(`meetingRoomMembers/${x.uid}`), member, { merge: true });
    }
    tx.update(ref, { status, adminNote: String(note || "").slice(0, 500), reviewedByTelegramId: String(actorId), reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return { message: `Request ${status}.`, telegramChatId: x.telegramChatId, title: x.programTitle, adminNote: note };
  });
}
async function handleAdmin(message, text) {
  if (!adminIds.has(String(message.from?.id))) return false;
  const chatId = message.chat.id;
  if (text === "/admin") { await send(chatId, "Admin tools:\n/pending\n/approve REQUEST_ID\n/reject REQUEST_ID reason\n/pendingadvice\n/approveadvice ID\n/rejectadvice ID reason\n/reply TELEGRAM_ID message"); return true; }
  if (text === "/pending") { await pendingMeetings(chatId); return true; }
  if (text === "/pendingadvice") { const snap = await db().collection("telegramAdviceSubmissions").where("status", "==", "pending").limit(10).get(); await send(chatId, snap.empty ? "There are no pending Advice Room submissions." : snap.docs.map(d => `${d.id} — /approveadvice ${d.id} · /rejectadvice ${d.id} reason`).join("\n")); return true; }
  let m = text.match(/^\/(approve|reject)\s+(\S+)(?:\s+([\s\S]+))?$/i);
  if (m) { const result = await reviewMeeting(m[2], m[1].toLowerCase() === "approve" ? "approved" : "rejected", m[3] || "", message.from.id); await send(chatId, result.message); if (result.telegramChatId) await send(result.telegramChatId, result.message === "Request approved." ? `Your Meeting Hall request for “${result.title || "the gathering"}” was approved.` : `Your Meeting Hall request was reviewed.${result.adminNote ? ` Note: ${result.adminNote}` : ""}`); return true; }
  m = text.match(/^\/(approveadvice|rejectadvice)\s+(\S+)(?:\s+([\s\S]+))?$/i);
  if (m) {
    const id = m[2];
    if (id.includes("/")) { await send(chatId, "Invalid submission ID."); return true; }
    const snap = await db().doc(`telegramAdviceSubmissions/${id}`).get();
    if (!snap.exists || snap.data().status !== "pending") { await send(chatId, "Pending advice submission not found."); return true; }
    const sub = snap.data(); const published = m[1].toLowerCase() === "approveadvice";
    const itemRef = db().doc(`siteContent/studentAdvice/items/${sub.adviceId || id}`);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) { await send(chatId, "The Advice Room item is missing; it was not changed."); return true; }
    if (published && !String(itemSnap.data().advice || "").trim()) { await send(chatId, "This submission has no text yet. For a voice note, transcribe it in the website Admin Dashboard, save it, then approve it here."); return true; }
    await itemRef.update({ published, submissionStatus: published ? "approved" : "rejected", updatedAt: FieldValue.serverTimestamp() });
    await snap.ref.update({ status: published ? "approved" : "rejected", adminNote: String(m[3] || "").slice(0, 500), reviewedAt: FieldValue.serverTimestamp() });
    await send(sub.telegramChatId, published ? "Your advice was reviewed and published in the Advice Room. Thank you. May God bless you." : `Thank you for sharing. The team could not publish this submission.${m[3] ? ` Note: ${m[3]}` : ""}`);
    await send(chatId, `Advice submission ${published ? "approved" : "rejected"}.`); return true;
  }
  m = text.match(/^\/reply\s+(\d+)\s+([\s\S]+)$/i); if (m) { await send(m[1], `ACE-USF Support team:\n\n${m[2]}`); await send(chatId, "Your reply was sent."); return true; }
  return false;
}
async function handleMessage(message) {
  if (!message?.chat?.id || message.chat.type !== "private") return;
  const chatId = message.chat.id; const text = String(message.text || "").trim();
  const start = text.match(/^\/start(?:@\w+)?\s+link_([a-f0-9]{40})$/i); if (start) return finishLink(chatId, message.from, start[1]);
  if (text === "/whoami") return send(chatId, `Your Telegram ID is ${message.from.id}.`);
  if (text === "/cancel") { await clearSession(chatId); return send(chatId, "Cancelled.", keyboard()); }
  if (await handleAdmin(message, text)) return;
  if (/^\/(start|help)(?:@\w+)?$/i.test(text)) return send(chatId, helpText(), keyboard());
  if (/^\/support(?:@\w+)?$/i.test(text)) { await saveSession(chatId, { type: "support", step: "message", name: [message.from.first_name, message.from.last_name].filter(Boolean).join(" "), username: message.from.username || "" }); return send(chatId, "Please send your question or describe the problem. You may attach a photo or document. Send /cancel to stop. Never include passwords or payment-card details."); }
  if (/^\/(advice|share)(?:@\w+)?$/i.test(text)) return beginAdvice(chatId, message.from);
  const session = await getSession(chatId);
  if (session?.type === "support") { for (const adminId of adminIds) await tg("copyMessage", { chat_id: adminId, from_chat_id: chatId, message_id: message.message_id }); for (const adminId of adminIds) await send(adminId, `ACE-USF support report from ${session.name || "Telegram user"} @${session.username || "no username"}\nTelegram ID: ${chatId}\nReply with /reply ${chatId} your message`); await clearSession(chatId); return send(chatId, "Thank you. Your report has been sent to the ACE-USF support team."); }
  if (session?.type === "advice") return processAdviceText(chatId, message, session);
  if (text) return send(chatId, answer(text), keyboard());
}
async function handleCallback(callback) {
  const chatId = callback.message?.chat?.id; if (!chatId) return;
  await tg("answerCallbackQuery", { callback_query_id: callback.id });
  if (callback.data === "advice:begin") return beginAdvice(chatId, callback.from);
  if (callback.data === "support:begin") { await saveSession(chatId, { type: "support", step: "message", name: [callback.from.first_name, callback.from.last_name].filter(Boolean).join(" "), username: callback.from.username || "" }); return send(chatId, "Please describe the problem. You may attach a photo or document. Send /cancel to stop."); }
  if (callback.data?.startsWith("role:") || callback.data?.startsWith("lang:")) return handleAdviceCallback(chatId, callback.data);
}
async function notifyWebsite(req) {
  const authHeader = req.headers.authorization || ""; const idToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!idToken) return { status: 401, body: "Sign-in required" };
  const { getAuth } = require("firebase-admin/auth");
  const decoded = await getAuth().verifyIdToken(idToken);
  const { kind, requestId, itemId } = req.body || {};
  if (kind === "meeting-request") {
    if (typeof requestId !== "string" || !requestId || requestId.includes("/")) return { status: 400, body: "Invalid request ID" };
    const snap = await db().doc(`meetingAccessRequests/${requestId}`).get(); if (!snap.exists || snap.data().uid !== decoded.uid) return { status: 403, body: "Not authorized" };
    const x = snap.data(); const text = `🚨 MEETING HALL ACCESS REQUEST\nName: ${x.requesterName || "Not provided"}\nUniversity: ${x.universityName || "Not provided"}\nDepartment: ${x.requestedDepartment || "Not provided"}\nRecorded sex: ${x.profileSex || "Not provided"}\nFellowship role: ${x.fellowshipRole || "Not provided"}\nGathering: ${x.programTitle || "Meeting Hall"}\nRoom: ${x.audience || "Not provided"}\nRequest ID: ${snap.id}\nApprove: /approve ${snap.id}\nReject: /reject ${snap.id} reason`;
    for (const id of adminIds) await send(id, text);
    return { status: 200, body: "Notification sent" };
  }
  if (decoded.uid !== ownerUid) return { status: 403, body: "Administrator only" };
  if (kind === "meeting-decision") {
    if (typeof requestId !== "string" || !requestId || requestId.includes("/")) return { status: 400, body: "Invalid request ID" };
    const snap = await db().doc(`meetingAccessRequests/${requestId}`).get(); if (!snap.exists) return { status: 404, body: "Request not found" };
    const x = snap.data(); if (x.telegramChatId) await send(x.telegramChatId, x.status === "approved" ? `Your request for “${x.programTitle || "the gathering"}” was approved. May God bless your time together.` : `Your Meeting Hall request was reviewed.${x.adminNote ? ` Note: ${x.adminNote}` : ""}`);
  }
  if (kind === "advice-published") {
    if (typeof itemId !== "string" || !itemId || itemId.includes("/")) return { status: 400, body: "Invalid advice item ID" };
    const snap = await db().doc(`siteContent/studentAdvice/items/${itemId}`).get(); if (!snap.exists) return { status: 404, body: "Advice item not found" };
    const privateSnap = await db().doc(`telegramAdviceSubmissions/${itemId}`).get(); if (privateSnap.exists && privateSnap.data().telegramChatId) await send(privateSnap.data().telegramChatId, "Your advice has been published in the ACE-USF Advice Room. Thank you for sharing. May God bless you.");
  }
  return { status: 200, body: "OK" };
}
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  try {
    initFirebase();
    if (req.query?.action === "notify") { const result = await notifyWebsite(req); return res.status(result.status).send(result.body); }
    if (!constantTimeMatch(req.headers["x-telegram-bot-api-secret-token"], webhookSecret)) return res.status(403).send("Forbidden");
    const update = req.body || {};
    if (update.message) await handleMessage(update.message);
    if (update.callback_query) await handleCallback(update.callback_query);
    return res.status(200).send("OK");
  } catch (error) {
    const message = String(error?.message || "No error message");
    const detail = message
      .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, "[REDACTED KEY]")
      .replace(/bot\d+:[A-Za-z0-9_-]+/g, "[REDACTED BOT TOKEN]")
      .slice(0, 240);
    const trace = String(error?.stack || "")
      .split("\n")
      .slice(0, 5)
      .join(" | ")
      .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, "[REDACTED KEY]")
      .replace(/bot\d+:[A-Za-z0-9_-]+/g, "[REDACTED BOT TOKEN]")
      .slice(0, 900);

    console.error("ACE-USF webhook error:", error?.name || "Error", error?.code || "no code");
    return res.status(500).json({
      error: "Webhook processing failed",
      errorType: error?.name || "Error",
      errorCode: error?.code || null,
      detail,
      trace
    });
  }
};
