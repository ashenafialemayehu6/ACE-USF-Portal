// ACE-USF website assistant: local Telegram polling, support relay, and room approvals.
// Requires Node.js 22. Keep this process running while you want the bot online.
// Telegram token and admin IDs are read from this process environment, never from source.

const token = process.env.TELEGRAM_BOT_TOKEN;
const site = (process.env.ACE_USF_SITE_URL || "https://ace-usf-portal.web.app").replace(/\/+$/, "");
const projectId = process.env.GCLOUD_PROJECT || "ace-usf-portal";
const adminIds = new Set(
  String(process.env.ACE_USF_TELEGRAM_ADMIN_IDS || "")
    .split(/[\s,]+/)
    .filter(value => /^\d+$/.test(value))
);

if (!token) {
  console.error("Telegram token is missing from this PowerShell window.");
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;
const supportSessions = new Set();
const adviceSessions = new Map();
const adviceSources = [
  ["currentStudent", "Current student"],
  ["alumnus", "Alumnus / graduate"],
  ["studentFamily", "Student’s family"],
  ["churchServant", "Church servant"]
];
const adviceLanguages = [
  "Amharic", "Afaan Oromo", "Tigrinya", "Somali", "Afar", "Sidama", "Wolaytta",
  "Gurage (Sebat Bet)", "Gamo", "Gedeo", "Hadiyya", "Kafa", "Kembata", "Dawro",
  "Silte", "Bench", "Konso", "Awi (Agaw)", "Kunama", "Nuer", "Me’en", "Anuak",
  "Harari", "English", "Other"
];
const adviceTopics = ["Faith and prayer", "Student life", "Family", "Church life", "Testimony", "Other"];
let nextOffset = 0;
let stopping = false;
let firestore;
let firestoreFieldValue;
let pendingMeetingUnsubscribe;
let advicePublicationUnsubscribe;
const meetingStatusUnsubscribes = [];
const meetingNotificationsInFlight = new Set();

const keyboard = {
  inline_keyboard: [
    [{ text: "Share advice or a testimony", callback_data: "advice:begin" }],
    [{ text: "Contact support", callback_data: "support:begin" }],
    [{ text: "Meeting Hall", url: site }],
    [{ text: "Apostolic Library", url: `${site}/#apostolic-library` }, { text: "Campus Network", url: `${site}/#campus-network` }]
  ]
};

async function telegram(method, body, timeoutMs = 30000) {
  const response = await fetch(`${api}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    const error = new Error(result.description || `Telegram returned HTTP ${response.status}`);
    error.telegramCode = result.error_code;
    throw error;
  }
  return result.result;
}

function send(chatId, text, replyMarkup) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text: String(text).slice(0, 4000),
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
}

function choiceKeyboard(items, callbackPrefix, columns = 2) {
  const rows = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns).map(([label, value]) => ({
      text: label,
      callback_data: `${callbackPrefix}:${value}`
    })));
  }
  return { inline_keyboard: rows };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function adviceLanguageKeyboard(page = 0) {
  const pageSize = 8;
  const start = page * pageSize;
  const items = adviceLanguages.slice(start, start + pageSize).map((language, index) => [language, String(start + index)]);
  const keyboard = choiceKeyboard(items, "advice:language");
  const controls = [];
  if (page > 0) controls.push({ text: "‹ Previous", callback_data: `advice:languagePage:${page - 1}` });
  if (start + pageSize < adviceLanguages.length) controls.push({ text: "More languages ›", callback_data: `advice:languagePage:${page + 1}` });
  keyboard.inline_keyboard.push(controls);
  return keyboard;
}

function telegramName(from = {}) {
  return [from.first_name, from.last_name].filter(Boolean).join(" ").trim() || "Telegram contributor";
}

function getDatabase() {
  if (firestore) return firestore;
  const { applicationDefault, getApps, initializeApp } = require("firebase-admin/app");
  const { FieldValue, getFirestore } = require("firebase-admin/firestore");
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId });
  firestore = getFirestore();
  firestoreFieldValue = FieldValue;
  return firestore;
}

function answerFor(input) {
  const text = String(input || "").trim().toLowerCase();

  if (/^\/(start|help)(@ace_usf_assistantbot)?\b/.test(text) || /\b(hello|hi|help)\b/.test(text)) {
    return [
      "Welcome to the ACE-USF Website Assistant.",
      "Find a section or contact the team:",
      "/library — Apostolic Library",
      "/campus — Campus Network",
      "/audio — Audio Room",
      "/meetings — Meeting Hall",
      "/advice — Student Advice Room",
      "/share — submit advice or a testimony for review",
      "/support — Send a report to the support team",
      "/whoami — Show your Telegram ID"
    ].join("\n");
  }
  if (/^\/library\b/.test(text) || /\b(library|bible|books?)\b/.test(text)) {
    return `Find Scripture and Christian reading resources in the Apostolic Library: ${site}/#apostolic-library`;
  }
  if (/^\/campus\b/.test(text) || /\b(campus|university|college|department|city)\b/.test(text)) {
    return `Explore fellowship information by campus and location in the Campus Network: ${site}/#campus-network`;
  }
  if (/^\/audio\b/.test(text) || /\b(audio|preaching|sermon|song|poem|music)\b/.test(text)) {
    return `Choose Audio Room in the website's middle section to find available preaching, songs, and poems: ${site}`;
  }
  if (/^\/meetings\b/.test(text) || /\b(meeting|bible study|conference|leaders room|women.?s ministry)\b/.test(text)) {
    return `Choose Meeting Hall in the website's middle section to see gatherings and access information: ${site}`;
  }
  if (/^\/advice\b/.test(text) || /\b(advice|graduate|alumni|family|student)\b/.test(text)) {
    return `Choose Advice Room in the website's middle section for student, graduate, family, and church-servant guidance: ${site}`;
  }
  return `I can help you find ACE-USF website sections. Try /library, /campus, /audio, /meetings, or /advice. ${site}`;
}

function requireAdmin(message) {
  return Boolean(message.from?.id && adminIds.has(String(message.from.id)));
}

async function finishTelegramLink(chatId, from, code) {
  const db = getDatabase();
  const matches = await db.collection("userProfiles").where("telegramLinkCode", "==", code).limit(2).get();
  if (matches.empty) {
    await send(chatId, "That one-time link is invalid or already used. Open your ACE-USF profile and create a fresh Telegram link.", keyboard);
    return;
  }
  if (matches.size !== 1) {
    await send(chatId, "That link could not be verified safely. Please create a new link from your ACE-USF profile.");
    return;
  }
  const profileDoc = matches.docs[0];
  const profile = profileDoc.data();
  const expiresAt = profile.telegramLinkExpiresAt?.toMillis?.() || 0;
  if (expiresAt < Date.now()) {
    await profileDoc.ref.update({ telegramLinkCode: firestoreFieldValue.delete(), telegramLinkExpiresAt: firestoreFieldValue.delete() });
    await send(chatId, "That one-time link expired. Open your ACE-USF profile and create a fresh Telegram link.", keyboard);
    return;
  }
  const otherLinks = await db.collection("userProfiles").where("telegramChatId", "==", String(chatId)).limit(2).get();
  if (otherLinks.docs.some(doc => doc.id !== profileDoc.id)) {
    await send(chatId, "This Telegram account is already linked to another ACE-USF profile. Contact support if you need help changing it.");
    return;
  }
  await profileDoc.ref.update({
    telegramChatId: String(chatId),
    telegramUsername: from.username || "",
    telegramLinkedAt: firestoreFieldValue.serverTimestamp(),
    telegramLinkCode: firestoreFieldValue.delete(),
    telegramLinkExpiresAt: firestoreFieldValue.delete(),
    updatedAt: firestoreFieldValue.serverTimestamp()
  });
  await send(chatId, "Your ACE-USF profile is now securely linked to this Telegram chat. Meeting Hall decisions and Advice Room review updates can reach you here.", keyboard);
}

async function beginAdvice(chatId, from) {
  if (!adminIds.size) return send(chatId, "Advice submissions are temporarily unavailable because the review team is not configured. Please try again later.");
  supportSessions.delete(chatId);
  adviceSessions.set(chatId, { step: "role", telegramName: telegramName(from), telegramUserId: String(from.id) });
  await send(chatId, "Welcome to the ACE-USF Advice Room. Who is sharing this encouragement?", choiceKeyboard(
    adviceSources.map(([id, label]) => [label, id]), "advice:role"
  ));
}

async function askContributorName(chatId) {
  const session = adviceSessions.get(chatId);
  session.step = "author";
  await send(chatId, "What name should appear with your advice? You can type a name or use your Telegram name.", {
    inline_keyboard: [[{ text: `Use ${session.telegramName}`.slice(0, 60), callback_data: "advice:authorTelegram" }]]
  });
}

async function askAdviceTopic(chatId) {
  const session = adviceSessions.get(chatId);
  session.step = "topic";
  await send(chatId, "Choose the topic that best fits your message.", choiceKeyboard(adviceTopics.map((topic, index) => [topic, String(index)]), "advice:topic"));
}

async function askAdviceFormat(chatId) {
  adviceSessions.get(chatId).step = "format";
  await send(chatId, "How would you like to share it? Voice notes go to the administrator for review. Written advice can be approved and published in the searchable Advice Room.", {
    inline_keyboard: [[
      { text: "Write advice", callback_data: "advice:format:text" },
      { text: "Send a voice note", callback_data: "advice:format:voice" }
    ]]
  });
}

async function saveAdviceSubmission(chatId, message, session, submissionType) {
  const db = getDatabase();
  const publicRef = db.collection("siteContent").doc("studentAdvice").collection("items").doc();
  const privateRef = db.collection("telegramAdviceSubmissions").doc(publicRef.id);
  const now = firestoreFieldValue.serverTimestamp();
  const publicEntry = {
    sourceType: session.sourceType,
    title: session.title,
    author: session.author,
    language: session.language,
    university: session.university || "",
    department: session.department || "",
    churchPosition: session.churchPosition || "",
    category: session.category,
    advice: submissionType === "text" ? session.advice : "",
    published: false,
    submissionStatus: submissionType === "voice" ? "voice_review_pending" : "pending_review",
    createdAt: now,
    updatedAt: now
  };
  const privateEntry = {
    adviceId: publicRef.id,
    telegramChatId: String(chatId),
    telegramUserId: String(message.from.id),
    telegramName: telegramName(message.from),
    submissionType,
    status: "pending",
    createdAt: now
  };
  await publicRef.set(publicEntry);
  await privateRef.set(privateEntry);

  const details = [
    "📨 New Advice Room submission",
    `From: ${session.author} (${session.telegramName})`,
    `Voice category: ${adviceSources.find(([id]) => id === session.sourceType)?.[1] || session.sourceType}`,
    `Language: ${session.language}`,
    `Topic: ${session.category}`,
    session.university ? `University: ${session.university}` : "",
    session.department ? `Department: ${session.department}` : "",
    session.churchPosition ? `Church position: ${session.churchPosition}` : "",
    submissionType === "text" ? `Message: ${session.advice.slice(0, 900)}` : "Voice note attached below. For publication, transcribe it into this draft in Admin Dashboard first.",
    `Draft ID: ${publicRef.id}`,
    `Approve written draft: /approveadvice ${publicRef.id}`,
    `Reject: /rejectadvice ${publicRef.id} reason`
  ].filter(Boolean).join("\n");

  if (adminIds.size) {
    for (const adminId of adminIds) {
      try {
        await send(Number(adminId), details);
        if (submissionType === "voice") {
          await telegram("copyMessage", {
            chat_id: Number(adminId),
            from_chat_id: chatId,
            message_id: message.message_id
          });
        }
      } catch (error) {
        console.error(`Could not alert admin ${adminId} about Advice Room draft ${publicRef.id}:`, error.message);
      }
    }
  }
  adviceSessions.delete(chatId);
  await send(chatId, submissionType === "text"
    ? "Thank you for sharing your wisdom. Your message is safely with the ACE-USF team for review. It will appear in the Advice Room only after approval. May God bless and guide you."
    : "Thank you for sharing your voice. Your note has been sent to the ACE-USF team for review. The administrator can decide whether to transcribe it for the searchable Advice Room. May God bless and guide you.");
}

async function continueAdvice(chatId, message) {
  const session = adviceSessions.get(chatId);
  if (!session) return false;
  const value = String(message.text || "").trim();
  if (session.step === "voice") {
    if (!message.voice && !message.audio) {
      await send(chatId, "Please send a Telegram voice note or audio message, or send /cancel to stop.");
      return true;
    }
    await saveAdviceSubmission(chatId, message, session, "voice");
    return true;
  }
  if (!value) {
    await send(chatId, "Please send a text answer, or use /cancel to stop.");
    return true;
  }
  if (session.step === "languageOther") {
    session.language = value.slice(0, 80);
    await askContributorName(chatId);
  } else if (session.step === "author") {
    session.author = value.slice(0, 100);
    if (session.sourceType === "churchServant") {
      session.step = "churchPosition";
      await send(chatId, "What is your church position? For example: bishop, priest, or another servant.");
    } else if (session.sourceType === "currentStudent" || session.sourceType === "alumnus") {
      session.step = "university";
      await send(chatId, "Which university or college should be shown?");
    } else {
      await send(chatId, "Give your message a short title.");
      session.step = "title";
    }
  } else if (session.step === "churchPosition") {
    session.churchPosition = value.slice(0, 100);
    session.step = "title";
    await send(chatId, "Give your message a short title.");
  } else if (session.step === "university") {
    session.university = value.slice(0, 160);
    session.step = "department";
      await send(chatId, "What is your department? This helps students find advice from a similar study path.");
  } else if (session.step === "department") {
    session.department = value.slice(0, 120);
    session.step = "title";
    await send(chatId, "Give your message a short title.");
  } else if (session.step === "title") {
    session.title = value.slice(0, 140);
    await askAdviceTopic(chatId);
  } else if (session.step === "advice") {
    session.advice = value.slice(0, 2500);
    await saveAdviceSubmission(chatId, message, session, "text");
  } else {
    await send(chatId, "Use the buttons to continue, or send /cancel to leave this form.");
  }
  return true;
}

async function handleCallback(callback) {
  await telegram("answerCallbackQuery", { callback_query_id: callback.id });
  const chatId = callback.message?.chat?.id;
  if (!chatId) return;
  const data = callback.data || "";
  if (data === "advice:begin") return beginAdvice(chatId, callback.from);
  if (data === "support:begin") {
    if (!adminIds.size) return send(chatId, "Support is not configured yet. Please use the website contact details.");
    adviceSessions.delete(chatId);
    supportSessions.add(chatId);
    return send(chatId, "Tell us what you need help with. You can also attach a photo, document, or voice note. Send /cancel to stop.");
  }
  const session = adviceSessions.get(chatId);
  if (!session) return send(chatId, "That form has expired. Choose Share advice to begin again.", keyboard);
  if (data.startsWith("advice:role:")) {
    const role = data.split(":")[2];
    if (!adviceSources.some(([id]) => id === role)) return;
    session.sourceType = role;
    session.step = "language";
    return send(chatId, "Choose the language of your advice.", adviceLanguageKeyboard(0));
  }
  if (data.startsWith("advice:languagePage:")) {
    const page = Math.max(0, Number(data.split(":")[2]) || 0);
    return send(chatId, "Choose the language of your advice.", adviceLanguageKeyboard(page));
  }
  if (data.startsWith("advice:language:")) {
    const languageIndex = Number(data.split(":")[2]);
    if (!Number.isInteger(languageIndex) || !adviceLanguages[languageIndex]) return;
    const language = adviceLanguages[languageIndex];
    if (language === "Other") {
      session.step = "languageOther";
      return send(chatId, "Type the language name you will use.");
    }
    session.language = language;
    return askContributorName(chatId);
  }
  if (data === "advice:authorTelegram") {
    session.author = session.telegramName;
    if (session.sourceType === "churchServant") {
      session.step = "churchPosition";
      return send(chatId, "What is your church position? For example: bishop, priest, or another servant.");
    }
    if (session.sourceType === "currentStudent" || session.sourceType === "alumnus") {
      session.step = "university";
      return send(chatId, "Which university or college should be shown?");
    }
    session.step = "title";
    return send(chatId, "Give your message a short title.");
  }
  if (data.startsWith("advice:topic:")) {
    const index = Number(data.split(":")[2]);
    if (!adviceTopics[index]) return;
    session.category = adviceTopics[index];
    return askAdviceFormat(chatId);
  }
  if (data.startsWith("advice:format:")) {
    const format = data.split(":")[2];
    if (format === "text") {
      session.step = "advice";
      return send(chatId, "Write your advice or testimony in one message (up to 2,500 characters).");
    }
    if (format === "voice") {
      session.step = "voice";
      return send(chatId, "Send one voice note now. It will go privately to the administrator for review before anything is shared.");
    }
  }
}

async function listPendingAdvice(chatId) {
  const snapshot = await getDatabase().collection("telegramAdviceSubmissions").where("status", "==", "pending").limit(10).get();
  if (snapshot.empty) return send(chatId, "There are no pending Advice Room submissions.");
  const entries = await Promise.all(snapshot.docs.map(async doc => {
    const submission = doc.data();
    const itemSnap = await getDatabase().doc(`siteContent/studentAdvice/items/${submission.adviceId || doc.id}`).get();
    const item = itemSnap.exists ? itemSnap.data() : {};
    return `${item.author || submission.telegramName || "Contributor"} · ${item.title || "Advice submission"}\n${item.language || "Language not set"} · ${submission.submissionType || "text"}\nID: ${doc.id}\n${submission.submissionType === "voice" ? "Listen to the voice note in the admin chat, transcribe in Site Content Manager, then approve." : `Approve: /approveadvice ${doc.id}`}\nReject: /rejectadvice ${doc.id} reason`;
  }));
  return send(chatId, `Pending Advice Room submissions (up to 10):\n\n${entries.join("\n\n")}`);
}

async function reviewAdviceSubmission(id, decision, note, adminId) {
  if (!id || id.includes("/") || !["approved", "rejected"].includes(decision)) return "Use /approveadvice ID or /rejectadvice ID reason.";
  const db = getDatabase();
  const privateRef = db.doc(`telegramAdviceSubmissions/${id}`);
  const result = await db.runTransaction(async transaction => {
    const privateSnap = await transaction.get(privateRef);
    if (!privateSnap.exists) return { error: "That Telegram advice submission was not found." };
    const submission = privateSnap.data();
    if (submission.status !== "pending") return { error: `This submission is already ${submission.status}.` };
    const publicRef = db.doc(`siteContent/studentAdvice/items/${submission.adviceId || id}`);
    const publicSnap = await transaction.get(publicRef);
    if (!publicSnap.exists) return { error: "The Advice Room draft is missing. Check the Site Content Manager." };
    const item = publicSnap.data();
    if (decision === "approved" && !String(item.advice || "").trim()) {
      return { error: "This draft has no written advice yet. For a voice entry, first add an approved transcript in the Admin Dashboard, save it, then approve here." };
    }
    const now = firestoreFieldValue.serverTimestamp();
    transaction.update(publicRef, { published: decision === "approved", submissionStatus: decision, updatedAt: now });
    transaction.update(privateRef, {
      status: decision,
      reviewedByTelegramId: String(adminId),
      adminNote: String(note || "").slice(0, 500),
      reviewedAt: now
    });
    return { telegramChatId: submission.telegramChatId };
  });
  if (result.error) return result.error;
  try {
    await send(Number(result.telegramChatId), decision === "approved"
      ? "Your advice has been reviewed and published in the ACE-USF Advice Room. Thank you for sharing it. May God bless you."
      : `Thank you for sharing your advice. The team could not publish this submission.${note ? ` Note: ${note}` : ""}`);
  } catch (error) {
    console.error(`Could not send the Advice Room review result for submission ${id}:`, error.message);
  }
  return `Advice submission ${decision}.`;
}

function watchAdvicePublishedInSiteManager() {
  advicePublicationUnsubscribe = getDatabase().collection("siteContent").doc("studentAdvice").collection("items")
    .where("published", "==", true)
    .onSnapshot(snapshot => {
      for (const itemDoc of snapshot.docs) {
        const item = itemDoc.data();
        if (item.submissionStatus !== "pending_review" || meetingNotificationsInFlight.has(`advice:${itemDoc.id}`)) continue;
        meetingNotificationsInFlight.add(`advice:${itemDoc.id}`);
        void (async () => {
          const privateRef = getDatabase().doc(`telegramAdviceSubmissions/${itemDoc.id}`);
          const privateSnap = await privateRef.get();
          if (!privateSnap.exists || privateSnap.data().status !== "pending") return;
          const submission = privateSnap.data();
          await privateRef.update({ status: "approved", reviewedBy: "Site Content Manager", reviewedAt: firestoreFieldValue.serverTimestamp() });
          await itemDoc.ref.update({ submissionStatus: "approved", updatedAt: firestoreFieldValue.serverTimestamp() });
          await send(Number(submission.telegramChatId), "Your advice has been reviewed and published in the ACE-USF Advice Room. Thank you for sharing it. May God bless you.");
        })().catch(error => console.error(`Could not deliver the Advice Room review for ${itemDoc.id}:`, error.message))
          .finally(() => meetingNotificationsInFlight.delete(`advice:${itemDoc.id}`));
      }
    }, error => console.error("Advice Room publication notifications are unavailable:", error.message));
}

function watchPendingMeetingRequests() {
  pendingMeetingUnsubscribe = getDatabase().collection("meetingAccessRequests")
    .where("status", "==", "pending")
    .onSnapshot(snapshot => {
      for (const doc of snapshot.docs) {
        const request = doc.data();
        if (request.telegramAdminNotifiedAt || meetingNotificationsInFlight.has(doc.id)) continue;
        meetingNotificationsInFlight.add(doc.id);
        void (async () => {
          const lines = [
            "🔔 New Meeting Hall access request",
            `Name: ${request.requesterName || "Not provided"}`,
            `University: ${request.universityName || "Not provided"}`,
            `Fellowship role: ${request.fellowshipRole || "Not provided"}`,
            `Gathering: ${request.programTitle || "Meeting Hall"}`,
            `Requested room: ${request.audience || "Not provided"}`,
            request.requestedDepartment ? `Department: ${request.requestedDepartment}` : "",
            request.departmentGroup ? `Study group: ${request.departmentGroup}` : "",
            request.requesterEmail ? `Account email: ${request.requesterEmail}` : "",
            `Request ID: ${doc.id}`,
            `Approve: /approve ${doc.id}`,
            `Reject: /reject ${doc.id} reason`
          ].filter(Boolean).join("\n");
          let delivered = false;
          for (const adminId of adminIds) {
            try { await send(Number(adminId), lines); delivered = true; }
            catch (error) { console.error(`Could not notify admin about Meeting Hall request ${doc.id}:`, error.message); }
          }
          if (delivered) await doc.ref.update({ telegramAdminNotifiedAt: firestoreFieldValue.serverTimestamp() });
        })().catch(error => console.error(`Meeting Hall alert failed for ${doc.id}:`, error.message))
          .finally(() => meetingNotificationsInFlight.delete(doc.id));
      }
    }, error => console.error("Meeting Hall notifications are unavailable:", error.message));
}

function watchReviewedMeetingRequests() {
  for (const decision of ["approved", "rejected"]) {
    const unsubscribe = getDatabase().collection("meetingAccessRequests").where("status", "==", decision)
      .onSnapshot(snapshot => {
        for (const doc of snapshot.docs) {
          const request = doc.data();
          const key = `review:${doc.id}`;
          if (!request.telegramChatId || request.telegramUserNotifiedAt || meetingNotificationsInFlight.has(key)) continue;
          meetingNotificationsInFlight.add(key);
          void (async () => {
            const text = decision === "approved"
              ? `Your access request for “${request.programTitle || "the Meeting Hall"}” has been approved. Return to the Meeting Hall on the ACE-USF website and open the gathering. May God bless your time together.`
              : `The administrator could not approve your request for “${request.programTitle || "the Meeting Hall"}”.${request.adminNote ? `\n\nAdministrator note: ${request.adminNote}` : ""}\n\nYou can reply here to contact support.`;
            try {
              await send(Number(request.telegramChatId), text);
              await doc.ref.update({ telegramUserNotifiedAt: firestoreFieldValue.serverTimestamp() });
            } catch (error) {
              console.error(`Could not send Meeting Hall decision to the linked Telegram account for ${doc.id}:`, error.message);
            }
          })().finally(() => meetingNotificationsInFlight.delete(key));
        }
      }, error => console.error(`Meeting Hall ${decision} update listener failed:`, error.message));
    meetingStatusUnsubscribes.push(unsubscribe);
  }
}

async function listPending(chatId) {
  const db = getDatabase();
  const snapshot = await db.collection("meetingAccessRequests")
    .where("status", "==", "pending")
    .limit(10)
    .get();
  if (snapshot.empty) {
    await send(chatId, "There are no pending Meeting Hall access requests.");
    return;
  }
  const rows = snapshot.docs.map((doc, index) => {
    const request = doc.data();
    return `${index + 1}. ${request.requesterName || "ACE-USF member"}\nUniversity: ${request.universityName || "Not provided"}\nFellowship role: ${request.fellowshipRole || "Not provided"}\nGathering: ${request.programTitle || request.audience || "Meeting Room"}\nID: ${doc.id}\nApprove: /approve ${doc.id}\nReject: /reject ${doc.id} reason`;
  });
  await send(chatId, `Pending Meeting Hall requests (up to 10):\n\n${rows.join("\n\n")}`);
}

async function reviewRequest(requestId, decision, note, adminTelegramId) {
  if (!requestId || requestId.includes("/") || !["approved", "rejected"].includes(decision)) {
    return "Use /approve REQUEST_ID or /reject REQUEST_ID reason.";
  }
  const db = getDatabase();
  const requestRef = db.doc(`meetingAccessRequests/${requestId}`);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists) return "That access request was not found.";
    const request = snapshot.data();
    if (request.status !== "pending") return `This request is already ${request.status}.`;
    if (!request.uid || !["department", "departmentGroup", "leaders", "women"].includes(request.audience)) {
      return "This request has invalid access details. Review it in the website admin panel.";
    }

    const now = firestoreFieldValue.serverTimestamp();
    if (decision === "approved") {
      const member = {
        uid: request.uid,
        name: request.requesterName || "ACE-USF member",
        active: true,
        updatedAt: now
      };
      if (request.audience === "department") member.department = request.requestedDepartment || "";
      if (request.audience === "departmentGroup") member.departmentGroup = request.departmentGroup || "";
      if (request.audience === "leaders") member.leadersOnly = true;
      if (request.audience === "women") member.womenMinistry = true;
      transaction.set(db.doc(`meetingRoomMembers/${request.uid}`), member, { merge: true });
    }

    transaction.update(requestRef, {
      status: decision,
      adminNote: String(note || (decision === "rejected"
        ? "Please contact the ACE-USF support team."
        : "Your access request was approved.")).slice(0, 500),
      reviewedByTelegramId: String(adminTelegramId),
      reviewedAt: now,
      updatedAt: now
    });
    return `Request ${decision}.`;
  });
}

async function handleAdmin(message, text) {
  const chatId = message.chat.id;
  if (!requireAdmin(message)) return false;

  if (text === "/admin" || text.startsWith("/admin@")) {
    await send(chatId, [
      "ACE-USF bot administrator tools:",
      "/pending — list pending Meeting Hall requests",
      "/approve REQUEST_ID — approve a request",
      "/reject REQUEST_ID reason — reject with a note",
      "/pendingadvice — list advice drafts awaiting review",
      "/approveadvice ID — publish a written advice draft",
      "/rejectadvice ID reason — reject an advice draft",
      "/reply TELEGRAM_ID message — reply to a support report"
    ].join("\n"));
    return true;
  }
  if (text === "/pending" || text.startsWith("/pending@")) {
    await listPending(chatId);
    return true;
  }
  if (text === "/pendingadvice" || text.startsWith("/pendingadvice@")) {
    await listPendingAdvice(chatId);
    return true;
  }

  const adviceReviewMatch = text.match(/^\/(approveadvice|rejectadvice)(?:@\w+)?\s+([^\s]+)(?:\s+([\s\S]+))?$/i);
  if (adviceReviewMatch) {
    const decision = adviceReviewMatch[1].toLowerCase() === "approveadvice" ? "approved" : "rejected";
    const result = await reviewAdviceSubmission(adviceReviewMatch[2], decision, adviceReviewMatch[3] || "", message.from.id);
    await send(chatId, result);
    return true;
  }

  const replyMatch = text.match(/^\/reply(?:@\w+)?\s+(\d+)\s+([\s\S]+)$/i);
  if (replyMatch) {
    await send(Number(replyMatch[1]), `ACE-USF Support team:\n\n${replyMatch[2]}`);
    await send(chatId, "Your reply was sent.");
    return true;
  }

  const reviewMatch = text.match(/^\/(approve|reject)(?:@\w+)?\s+([^\s]+)(?:\s+([\s\S]+))?$/i);
  if (reviewMatch) {
    const decision = reviewMatch[1].toLowerCase() === "approve" ? "approved" : "rejected";
    const result = await reviewRequest(reviewMatch[2], decision, reviewMatch[3] || "", message.from.id);
    await send(chatId, result);
    return true;
  }
  return false;
}

async function sendSupportReport(message) {
  const chatId = message.chat.id;
  supportSessions.delete(chatId);
  const from = message.from || {};
  const displayName = [from.first_name, from.last_name].filter(Boolean).join(" ") || "Telegram user";
  const username = from.username ? `@${from.username}` : "(no username)";
  const heading = `ACE-USF website support report\nFrom: ${displayName} ${username}\nTelegram ID: ${from.id}\nReply with: /reply ${from.id} your message`;

  for (const adminId of adminIds) {
    await send(Number(adminId), heading);
    await telegram("copyMessage", {
      chat_id: Number(adminId),
      from_chat_id: chatId,
      message_id: message.message_id
    });
  }
  await send(chatId, "Thank you. Your report has been sent to the ACE-USF support team. They can reply to you here.");
}

async function handleUpdate(update) {
  if (update.callback_query) {
    try { await handleCallback(update.callback_query); }
    catch (error) {
      console.error("Could not process a menu selection:", error.cause?.message || error.message);
      if (update.callback_query.message?.chat?.id) await send(update.callback_query.message.chat.id, "That action could not be completed. Please try again or type /help.");
    }
    return;
  }
  const message = update.message;
  if (!message?.chat?.id || message.chat.type !== "private") return;

  const chatId = message.chat.id;
  const text = String(message.text || "").trim();

  if (text === "/whoami" || text.startsWith("/whoami@")) {
    await send(chatId, `Your Telegram user ID is ${message.from.id}. Keep this number private; the website owner uses it to configure bot administration.`);
    return;
  }

  const linkMatch = text.match(/^\/start(?:@\w+)?\s+link_([a-f0-9]{40})$/i);
  if (linkMatch) {
    await finishTelegramLink(chatId, message.from, linkMatch[1]);
    return;
  }

  if (text === "/cancel" && (supportSessions.has(chatId) || adviceSessions.has(chatId))) {
    supportSessions.delete(chatId);
    adviceSessions.delete(chatId);
    await send(chatId, "Your current submission was cancelled.", keyboard);
    return;
  }

  if (await handleAdmin(message, text)) return;

  if (text === "/support" || text.startsWith("/support@")) {
    if (adminIds.size === 0) {
      await send(chatId, "Support messaging is not configured yet. Please use the website support contact for now.");
      return;
    }
    adviceSessions.delete(chatId);
    supportSessions.add(chatId);
    await send(chatId, "Please send your question or describe the problem. You may also attach a photo or document. Send /cancel to stop. Please don’t include passwords or payment-card details.");
    return;
  }

  if (text === "/advice" || text === "/share" || /^(share advice|share a testimony)$/i.test(text)) {
    await beginAdvice(chatId, message.from);
    return;
  }

  if (adviceSessions.has(chatId)) {
    await continueAdvice(chatId, message);
    return;
  }

  if (supportSessions.has(chatId)) {
    await sendSupportReport(message);
    return;
  }

  if (/^\/(start|help)(@ace_usf_assistantbot)?\b/i.test(text) || !text) {
    await send(chatId, answerFor("/help"), keyboard);
    return;
  }

  await send(chatId, answerFor(text), keyboard);
}

async function main() {
  console.log("ACE-USF assistant is running. Press Ctrl+C to stop.");
  if (adminIds.size === 0) {
    console.log("Admin ID is not configured yet; support forwarding and admin commands are disabled.");
  } else {
    try {
      watchPendingMeetingRequests();
      watchReviewedMeetingRequests();
      watchAdvicePublishedInSiteManager();
      console.log("Meeting Hall request notifications are active.");
    } catch (error) {
      console.error("Meeting Hall notifications could not start:", error.message);
    }
  }
  while (!stopping) {
    try {
      const updates = await telegram("getUpdates", {
        offset: nextOffset,
        timeout: 20,
        allowed_updates: ["message", "callback_query"]
      }, 35000);
      for (const update of updates) {
        nextOffset = update.update_id + 1;
        try {
          await handleUpdate(update);
        } catch (error) {
          console.error("Could not answer an update:", error.cause?.message || error.message);
        }
      }
    } catch (error) {
      if (error.telegramCode === 409) {
        console.error("This bot has a webhook configured or another poller is active. Stop the other connection before polling.");
        process.exitCode = 1;
        break;
      }
      console.error("Telegram connection issue:", error.cause?.message || error.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

process.on("SIGINT", () => {
  stopping = true;
  if (pendingMeetingUnsubscribe) pendingMeetingUnsubscribe();
  if (advicePublicationUnsubscribe) advicePublicationUnsubscribe();
  meetingStatusUnsubscribes.forEach(unsubscribe => unsubscribe());
  console.log("\nStopping ACE-USF assistant...");
});

main().catch(error => {
  console.error("Bot stopped:", error.message);
  process.exitCode = 1;
});
