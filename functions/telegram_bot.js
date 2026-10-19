// ACE-USF general website assistant and private admin tools.
// Add this module to functions/index.js with:
// Object.assign(exports, require("./telegram_bot"));
// The parent functions/index.js must initialize Firebase Admin first.

const crypto = require("node:crypto");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");

const db = getFirestore();
const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramWebhookSecret = defineSecret("TELEGRAM_WEBHOOK_SECRET");
const telegramAdminIds = defineString("ACE_USF_TELEGRAM_ADMIN_IDS", { default: "" });
const siteUrlParam = defineString("ACE_USF_SITE_URL", { default: "https://ace-usf-portal.web.app" });

function siteUrl() {
  return siteUrlParam.value().trim().replace(/\/+$/, "");
}

function isAdminTelegramUser(from) {
  if (!from?.id) return false;
  const allowed = telegramAdminIds.value().split(/[\s,]+/).filter(Boolean);
  return allowed.includes(String(from.id));
}

function safeSecretMatch(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string" || expected.length < 32) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function callTelegram(method, payload) {
  const token = telegramBotToken.value();
  if (!token) throw new Error("Telegram bot token is not configured.");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram API call ${method} failed (${response.status}).`);
  }
  return result.result;
}

async function reply(chatId, text, replyMarkup) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text: String(text).slice(0, 4000),
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Apostolic Library", url: `${siteUrl()}/#apostolic-library` },
        { text: "Campus Network", url: `${siteUrl()}/#campus-network` }
      ],
      [
        { text: "Audio Room · home", url: siteUrl() },
        { text: "Meeting Hall · home", url: siteUrl() }
      ]
    ]
  };
}

function helpText() {
  return [
    "Welcome to the ACE-USF Website Assistant.",
    "Ask about the website or use a command:",
    "/library — Apostolic Library",
    "/campus — Campus Network",
    "/audio — Audio Room",
    "/meetings — Meeting Hall and access requests",
    "/advice — Student Advice Room",
    "/support — contact the team",
    "/whoami — show your Telegram ID for administrator setup"
  ].join("\n");
}

function publicAnswer(text) {
  const value = String(text || "").toLocaleLowerCase();
  const root = siteUrl();
  if (/\b(library|bible|book|apostolic library)\b/.test(value)) {
    return `The Apostolic Library is the website’s place to discover available Scripture and Christian reading resources. Open the library section here: ${root}/#apostolic-library`;
  }
  if (/\b(campus|university|college|department|city)\b/.test(value)) {
    return `Use the Campus Network section to explore fellowship information by campus and location: ${root}/#campus-network`;
  }
  if (/\b(audio|preaching|sermon|song|poem|music|video)\b/.test(value)) {
    return `The Audio Room brings together available preaching, songs, poems, and other media. Open the website and choose the Audio Room card in the middle section: ${root}`;
  }
  if (/\b(meeting|bible study|conference|leaders room|women.s ministry)\b/.test(value)) {
    return `Open the Meeting Room card in the website’s middle section to find the Main Hall and restricted gatherings. Access requests are reviewed by an administrator: ${root}`;
  }
  if (/\b(advice|graduate|alumni|family|student)\b/.test(value)) {
    return `The Advice Room shares student, graduate, family, and church-servant guidance. Open the website and choose its card in the middle section: ${root}`;
  }
  if (/\b(help|website|site|start|hello|hi)\b/.test(value)) return helpText();
  return `I can help you find website sections and explain how to use them. Try /library, /campus, /audio, /meetings, or /advice. ${root}`;
}

async function listPendingRequests(chatId) {
  const snapshot = await db.collection("meetingAccessRequests")
    .where("status", "==", "pending")
    .limit(10)
    .get();
  if (snapshot.empty) {
    await reply(chatId, "There are no pending Meeting Hall access requests.");
    return;
  }
  const entries = snapshot.docs.map((item, index) => {
    const request = item.data();
    return `${index + 1}. ${request.requesterName || "ACE-USF member"} — ${request.programTitle || request.audience}\nID: ${item.id}\nApprove: /approve ${item.id}\nReject: /reject ${item.id} reason`;
  });
  await reply(chatId, `Pending access requests (up to 10):\n\n${entries.join("\n\n")}`);
}

async function reviewRequest(requestId, decision, adminNote, actorId) {
  if (!requestId || requestId.includes("/") || !["approved", "rejected"].includes(decision)) {
    return { ok: false, message: "Use /approve REQUEST_ID or /reject REQUEST_ID reason." };
  }
  const requestRef = db.doc(`meetingAccessRequests/${requestId}`);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists) return { ok: false, message: "That access request was not found." };
    const request = snapshot.data();
    if (request.status !== "pending") {
      return { ok: false, message: `This request is already ${request.status}.` };
    }
    if (!request.uid || !["department", "departmentGroup", "leaders", "women"].includes(request.audience)) {
      return { ok: false, message: "This request has invalid access details. Review it in the website admin panel." };
    }

    const now = FieldValue.serverTimestamp();
    if (decision === "approved") {
      const memberUpdate = {
        uid: request.uid,
        name: request.requesterName || "ACE-USF member",
        active: true,
        updatedAt: now
      };
      if (request.audience === "department") memberUpdate.department = request.requestedDepartment || "";
      if (request.audience === "departmentGroup") memberUpdate.departmentGroup = request.departmentGroup || "";
      if (request.audience === "leaders") memberUpdate.leadersOnly = true;
      if (request.audience === "women") memberUpdate.womenMinistry = true;
      transaction.set(db.doc(`meetingRoomMembers/${request.uid}`), memberUpdate, { merge: true });
    }

    transaction.update(requestRef, {
      status: decision,
      adminNote: String(adminNote || (decision === "rejected" ? "Please contact the ACE-USF support team." : "Your access request was approved." )).slice(0, 500),
      reviewedByTelegramId: String(actorId),
      reviewedAt: now,
      updatedAt: now
    });
    return { ok: true, message: `Request ${decision}.` };
  });
}

async function handleAdminText(message, text) {
  const chatId = message.chat.id;
  const actorId = message.from.id;
  if (!isAdminTelegramUser(message.from)) return false;

  if (text === "/admin" || text === "/admin@ACE_USF_AssistantBot") {
    await reply(chatId, "ACE-USF admin tools (private chat only):\n/pending — list access requests\n/approve REQUEST_ID — grant the requested room access\n/reject REQUEST_ID reason — reject with a note\nUse the website admin dashboard for all other content management.");
    return true;
  }
  if (text === "/pending") {
    await listPendingRequests(chatId);
    return true;
  }

  const match = text.match(/^\/(approve|reject)(?:@ACE_USF_AssistantBot)?\s+([^\s]+)(?:\s+([\s\S]+))?$/i);
  if (!match) return false;
  const decision = match[1].toLowerCase() === "approve" ? "approved" : "rejected";
  const result = await reviewRequest(match[2], decision, match[3] || "", actorId);
  await reply(chatId, result.message);
  return true;
}

async function handleMessage(message) {
  if (!message?.chat?.id || message.chat.type !== "private") return;
  const text = String(message.text || "").trim();
  if (!text) return;

  if (text === "/whoami") {
    await reply(message.chat.id, `Your Telegram user ID is ${message.from.id}. Share this number with the website owner only if they want to grant you bot administrator access.`);
    return;
  }

  if (await handleAdminText(message, text)) return;

  if (text === "/start" || text === "/help" || text === "/start@ACE_USF_AssistantBot") {
    await reply(message.chat.id, helpText(), mainKeyboard());
    return;
  }
  const command = text.match(/^\/(library|campus|audio|meetings|advice|support)(?:@ACE_USF_AssistantBot)?(?:\s|$)/i);
  if (command) {
    const answers = {
      library: publicAnswer("library"),
      campus: publicAnswer("campus"),
      audio: publicAnswer("audio"),
      meetings: publicAnswer("meetings"),
      advice: publicAnswer("advice"),
      support: `Contact the ACE-USF support team through Telegram: https://t.me/ACE_USF_AssistantBot`
    };
    await reply(message.chat.id, answers[command[1].toLowerCase()], mainKeyboard());
    return;
  }
  await reply(message.chat.id, publicAnswer(text), mainKeyboard());
}

exports.telegramWebhook = onRequest(
  {
    region: "us-central1",
    secrets: [telegramBotToken, telegramWebhookSecret],
    maxInstances: 2
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    const expectedSecret = telegramWebhookSecret.value();
    const receivedSecret = req.get("x-telegram-bot-api-secret-token") || "";
    if (!safeSecretMatch(receivedSecret, expectedSecret)) {
      res.status(403).send("Forbidden");
      return;
    }
    try {
      if (req.body?.message) await handleMessage(req.body.message);
      // Acknowledge all valid webhook updates. This bot does not accept group commands.
      res.status(200).send("OK");
    } catch (error) {
      console.error("ACE-USF Telegram webhook failed:", error?.message || "unknown error");
      res.status(200).send("OK");
    }
  }
);
