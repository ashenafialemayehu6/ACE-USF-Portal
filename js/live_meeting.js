// Browser client for ACE-USF's administrator-approved LiveKit audio rooms.
import { auth } from "./firebase_config.js";

const TOKEN_ENDPOINT = "https://ace-usf-telegram-webhook.vercel.app/api/meeting-token";
const SDK_URL = "https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js";
let sdkPromise;

function loadSdk() {
  if (window.LivekitClient) return Promise.resolve(window.LivekitClient);
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => window.LivekitClient ? resolve(window.LivekitClient) : reject(new Error("The live meeting audio library did not load."));
    script.onerror = () => reject(new Error("Could not load the live meeting audio library. Check your internet connection and retry."));
    document.head.append(script);
  });
  return sdkPromise;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function addStyles() {
  if (document.getElementById("ace-live-meeting-styles")) return;
  const style = document.createElement("style");
  style.id = "ace-live-meeting-styles";
  style.textContent = `
    .ace-live-overlay{position:fixed;inset:0;z-index:10010;display:grid;place-items:center;padding:16px;background:rgba(5,11,24,.88);backdrop-filter:blur(18px);animation:aceLiveIn .22s ease-out}
    .ace-live-shell{position:relative;display:grid;width:min(1040px,100%);max-height:min(94dvh,900px);grid-template-rows:auto 1fr;overflow:hidden;border:1px solid rgba(255,255,255,.2);border-radius:27px;background:#0c1426;color:#f5f7fc;box-shadow:0 36px 120px rgba(0,0,0,.5);animation:aceLiveUp .28s ease-out}
    .ace-live-header{display:flex;align-items:center;gap:16px;padding:17px 22px;border-bottom:1px solid rgba(255,255,255,.1);background:linear-gradient(115deg,#111f39,#172c49)}
    .ace-live-brand{display:grid;width:43px;height:43px;flex:0 0 43px;place-items:center;border:1px solid rgba(238,198,120,.35);border-radius:15px;background:rgba(238,198,120,.12);color:#f0ca7d;font-size:17px}
    .ace-live-heading{min-width:0;flex:1}.ace-live-heading small{display:block;margin-bottom:4px;color:#e9c77d;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.ace-live-heading h2{overflow:hidden;margin:0;color:#fff;font:700 clamp(17px,3vw,23px)/1.2 Georgia,serif;text-overflow:ellipsis;white-space:nowrap}
    .ace-live-close{display:grid;width:39px;height:39px;flex:0 0 39px;place-items:center;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:rgba(255,255,255,.08);color:#fff;font-size:21px;cursor:pointer}.ace-live-close:hover{background:rgba(255,255,255,.17)}
    .ace-live-layout{display:grid;min-height:0;grid-template-columns:minmax(0,1.3fr) minmax(270px,.7fr);overflow:auto}
    .ace-live-stage-wrap{display:flex;min-height:480px;flex-direction:column;align-items:center;justify-content:center;padding:clamp(20px,5vw,56px);background:radial-gradient(ellipse at 50% 40%,rgba(38,102,140,.32),transparent 47%),linear-gradient(155deg,#0c162a,#111c32 70%,#0a1221)}
    .ace-live-orb{position:relative;display:grid;width:clamp(140px,24vw,220px);aspect-ratio:1;place-items:center;border:1px solid rgba(227,193,124,.45);border-radius:50%;background:radial-gradient(circle at 35% 28%,#415e81,#1b3452 49%,#111d32);box-shadow:0 0 0 12px rgba(255,255,255,.025),0 0 0 34px rgba(255,255,255,.018),0 18px 70px rgba(0,0,0,.3);color:#f1d18a;font-size:clamp(48px,8vw,82px)}
    .ace-live-orb.is-speaking{animation:aceLivePulse 1.8s ease-in-out infinite;box-shadow:0 0 0 12px rgba(105,206,176,.07),0 0 0 34px rgba(105,206,176,.045),0 0 55px rgba(83,207,165,.24)}
    .ace-live-stage-name{margin:25px 0 5px;color:#fff;font:700 23px Georgia,serif;text-align:center}.ace-live-stage-caption{margin:0;color:#aebbd0;font-size:12px;text-align:center}
    .ace-live-status{display:inline-flex;align-items:center;gap:8px;margin-top:19px;padding:8px 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);color:#dce5f1;font-size:10px;font-weight:800}.ace-live-dot{width:8px;height:8px;border-radius:50%;background:#63d3a4;box-shadow:0 0 12px #63d3a4}.ace-live-dot.wait{background:#e8bd67;box-shadow:0 0 12px #e8bd67}
    .ace-live-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin-top:26px}.ace-live-control{display:inline-flex;min-height:43px;align-items:center;justify-content:center;gap:8px;padding:10px 14px;border:1px solid rgba(255,255,255,.17);border-radius:13px;background:rgba(255,255,255,.08);color:#fff;font-size:11px;font-weight:850;cursor:pointer;transition:transform .18s,background .18s}.ace-live-control:hover{transform:translateY(-1px);background:rgba(255,255,255,.14)}.ace-live-control.primary{border:0;background:linear-gradient(110deg,#c69a4b,#e0bc70);color:#17233a}.ace-live-control.danger{border:0;background:#a83d4f;color:#fff}.ace-live-control:disabled{opacity:.55;cursor:not-allowed}
    .ace-live-side{display:flex;min-height:480px;flex-direction:column;border-left:1px solid rgba(255,255,255,.1);background:#101a2c}.ace-live-side-head{display:flex;align-items:center;justify-content:space-between;padding:17px 18px;border-bottom:1px solid rgba(255,255,255,.1)}.ace-live-side-head h3{margin:0;color:#fff;font-size:12px;letter-spacing:.03em}.ace-live-count{display:inline-flex;align-items:center;gap:6px;color:#afbdd1;font-size:10px}
    .ace-live-questions{display:flex;min-height:130px;flex:1;flex-direction:column;gap:9px;overflow:auto;padding:14px}.ace-live-empty{margin:auto;color:#8796ae;font-size:11px;line-height:1.7;text-align:center}.ace-live-question{padding:11px 12px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.045)}.ace-live-question b{display:block;margin-bottom:5px;color:#e9c77d;font-size:10px}.ace-live-question p{margin:0;color:#e1e7f0;font-size:11px;line-height:1.55;overflow-wrap:anywhere}
    .ace-live-compose{padding:13px;border-top:1px solid rgba(255,255,255,.1)}.ace-live-compose label{display:block;margin-bottom:7px;color:#b7c3d5;font-size:10px;font-weight:800}.ace-live-compose textarea{width:100%;min-height:75px;resize:vertical;padding:10px;border:1px solid rgba(255,255,255,.14);border-radius:12px;outline:none;background:#0b1424;color:#fff;font:12px/1.5 inherit}.ace-live-compose textarea:focus{border-color:#d7b66e;box-shadow:0 0 0 3px rgba(215,182,110,.12)}.ace-live-compose-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.ace-live-compose-actions small{color:#8796ae;font-size:9px}.ace-live-error{margin:10px 0 0;color:#ffb6bd;font-size:11px;line-height:1.5}.ace-live-audio-bin{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
    @keyframes aceLiveIn{from{opacity:0}to{opacity:1}}@keyframes aceLiveUp{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}@keyframes aceLivePulse{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.035);filter:brightness(1.18)}}
    @media(max-width:720px){.ace-live-overlay{padding:0;align-items:end}.ace-live-shell{max-height:96dvh;border-radius:24px 24px 0 0}.ace-live-layout{grid-template-columns:1fr}.ace-live-stage-wrap{min-height:390px;padding:25px}.ace-live-orb{width:145px}.ace-live-side{min-height:320px;border-top:1px solid rgba(255,255,255,.1);border-left:0}.ace-live-questions{max-height:190px}.ace-live-header{padding:14px 16px}}
    @media(prefers-reduced-motion:reduce){.ace-live-overlay,.ace-live-shell,.ace-live-orb{animation:none}}
  `;
  document.head.append(style);
}

function showError(root, message) {
  const node = root.querySelector("[data-live-error]");
  if (node) node.textContent = message;
}

export async function joinLiveMeeting(program) {
  if (!auth.currentUser) throw new Error("Sign in to your ACE-USF account before joining.");
  addStyles();
  const overlay = document.createElement("div");
  overlay.className = "ace-live-overlay";
  overlay.innerHTML = `<section class="ace-live-shell" role="dialog" aria-modal="true" aria-labelledby="ace-live-title"><header class="ace-live-header"><div class="ace-live-brand"><i class="fa-solid fa-book-open" aria-hidden="true"></i></div><div class="ace-live-heading"><small>ACE-USF · Live Bible Study</small><h2 id="ace-live-title">${escapeHtml(program.title || "Meeting Hall")}</h2></div><button type="button" class="ace-live-close" data-live-close aria-label="Leave meeting">×</button></header><div class="ace-live-layout"><main class="ace-live-stage-wrap"><div class="ace-live-orb" data-live-orb aria-hidden="true"><i class="fa-solid fa-microphone-lines"></i></div><h3 class="ace-live-stage-name" data-live-speaker>Connecting to the meeting…</h3><p class="ace-live-stage-caption" data-live-caption>Preparing your secure audio room</p><div class="ace-live-status"><span class="ace-live-dot wait" data-live-dot></span><span data-live-status>Connecting</span></div><div class="ace-live-controls"><button type="button" class="ace-live-control primary hidden" data-live-mic><i class="fa-solid fa-microphone" aria-hidden="true"></i><span>Turn microphone on</span></button><button type="button" class="ace-live-control" data-live-hand><i class="fa-solid fa-hand" aria-hidden="true"></i><span>Raise hand</span></button><button type="button" class="ace-live-control danger" data-live-leave><i class="fa-solid fa-phone-slash" aria-hidden="true"></i><span>Leave room</span></button></div><p class="ace-live-error" data-live-error role="status" aria-live="polite"></p><div class="ace-live-audio-bin" data-live-audio></div></main><aside class="ace-live-side"><div class="ace-live-side-head"><h3 data-live-q-title>Questions & raised hands</h3><span class="ace-live-count"><i class="fa-solid fa-users" aria-hidden="true"></i><span data-live-count>1 here</span></span></div><div class="ace-live-questions" data-live-questions><p class="ace-live-empty">Questions and hand raises from this room will appear here.</p></div><form class="ace-live-compose" data-live-form><label for="ace-live-question">Ask a question</label><textarea id="ace-live-question" maxlength="500" placeholder="Type a question for the Bible study leader…"></textarea><div class="ace-live-compose-actions"><small>Keep it respectful · 500 characters</small><button class="ace-live-control primary" type="submit"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i><span>Send</span></button></div></form></aside></div></section>`;
  document.body.append(overlay);

  let room = null;
  let closed = false;
  let handRaised = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    overlay.remove();
    if (room) {
      try { await room.disconnect(); } catch { /* Leaving still closes the room panel. */ }
    }
  };
  overlay.querySelectorAll("[data-live-close],[data-live-leave]").forEach(button => button.addEventListener("click", close));
  overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
  const keyHandler = event => { if (event.key === "Escape" && !closed) { document.removeEventListener("keydown", keyHandler); close(); } };
  document.addEventListener("keydown", keyHandler);

  const setStatus = (text, connected = false) => {
    if (closed) return;
    overlay.querySelector("[data-live-status]").textContent = text;
    overlay.querySelector("[data-live-dot]").classList.toggle("wait", !connected);
  };
  const addItem = (name, text, kind = "question") => {
    const list = overlay.querySelector("[data-live-questions]");
    list.querySelector(".ace-live-empty")?.remove();
    const item = document.createElement("article");
    item.className = "ace-live-question";
    const author = document.createElement("b");
    author.textContent = kind === "hand" ? `${name} · raised a hand` : name;
    const body = document.createElement("p");
    body.textContent = kind === "hand" ? "The leader can invite this participant to speak." : text;
    item.append(author, body);
    list.append(item);
    list.scrollTop = list.scrollHeight;
  };

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Your sign-in session ended. Sign in again and reopen this meeting.");
    setStatus("Verifying your approved access…");
    const idToken = await currentUser.getIdToken();
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ programId: program.id })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `The meeting service responded with ${response.status}.`);

    const sdk = await loadSdk();
    room = new sdk.Room({ adaptiveStream: true, dynacast: true, audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const events = sdk.RoomEvent;
    room.on(events.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === "audio") {
        const element = track.attach();
        element.autoplay = true;
        element.setAttribute("playsinline", "");
        overlay.querySelector("[data-live-audio]").append(element);
        overlay.querySelector("[data-live-speaker]").textContent = participant.name || "Bible study leader";
        overlay.querySelector("[data-live-caption]").textContent = "Speaking live · ACE-USF Meeting Hall";
        overlay.querySelector("[data-live-orb]").classList.add("is-speaking");
        overlay.querySelector("[data-live-orb]").innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      }
    });
    room.on(events.TrackUnsubscribed, track => {
      track.detach().forEach(element => element.remove());
      if (![...room.remoteParticipants.values()].some(participant => [...participant.audioTrackPublications.values()].some(publication => publication.track))) {
        overlay.querySelector("[data-live-orb]").classList.remove("is-speaking");
        overlay.querySelector("[data-live-orb]").innerHTML = '<i class="fa-solid fa-microphone-lines"></i>';
      }
    });
    const updateCount = () => {
      overlay.querySelector("[data-live-count]").textContent = `${room.numParticipants} ${room.numParticipants === 1 ? "person" : "people"} here`;
    };
    room.on(events.ParticipantConnected, updateCount);
    room.on(events.ParticipantDisconnected, updateCount);
    room.on(events.DataReceived, (bytes, participant, _kind, topic) => {
      if (topic !== "ace-qa" || !participant) return;
      try {
        const message = JSON.parse(new TextDecoder().decode(bytes));
        if (["question", "hand"].includes(message.type)) addItem(participant.name || "Participant", String(message.text || "").slice(0, 500), message.type);
      } catch { /* Ignore malformed room data. */ }
    });
    room.on(events.Disconnected, () => { if (!closed) setStatus("Connection ended. You may leave and rejoin."); });

    await room.connect(payload.serverUrl, payload.token);
    if (closed) { await room.disconnect(); return; }
    const isLeader = payload.role === "leader";
    overlay.querySelector("[data-live-speaker]").textContent = isLeader ? "You are leading this study" : "Waiting for the leader to speak";
    overlay.querySelector("[data-live-caption]").textContent = isLeader ? "Your microphone is private until you turn it on." : `Listening as ${payload.displayName || "an approved member"}`;
    overlay.querySelector("[data-live-q-title]").textContent = isLeader ? "Questions & raised hands" : "Room questions";
    overlay.querySelector("[data-live-mic]").classList.toggle("hidden", !isLeader);
    overlay.querySelector("[data-live-hand]").classList.toggle("hidden", isLeader);
    overlay.querySelector("[data-live-form]").classList.toggle("hidden", isLeader);
    setStatus("Connected securely", true);
    updateCount();
    if (isLeader) {
      const micButton = overlay.querySelector("[data-live-mic]");
      let microphoneOn = false;
      micButton.addEventListener("click", async () => {
        micButton.disabled = true;
        try {
          microphoneOn = !microphoneOn;
          await room.localParticipant.setMicrophoneEnabled(microphoneOn);
          micButton.innerHTML = microphoneOn ? '<i class="fa-solid fa-microphone-slash"></i><span>Mute microphone</span>' : '<i class="fa-solid fa-microphone"></i><span>Turn microphone on</span>';
          micButton.classList.toggle("danger", microphoneOn);
          overlay.querySelector("[data-live-caption]").textContent = microphoneOn ? "Your microphone is live to this approved meeting." : "Your microphone is muted.";
          setStatus(microphoneOn ? "You are live" : "Connected securely", true);
        } catch (error) {
          microphoneOn = false;
          showError(overlay, error?.message || "Could not access your microphone. Check browser microphone permission.");
        } finally { micButton.disabled = false; }
      });
    } else {
      const handButton = overlay.querySelector("[data-live-hand]");
      handButton.addEventListener("click", async () => {
        if (handRaised) return;
        handRaised = true;
        handButton.disabled = true;
        try {
          await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: "hand", text: "" })), { reliable: true, topic: "ace-qa" });
          handButton.innerHTML = '<i class="fa-solid fa-check"></i><span>Hand raised</span>';
          handButton.classList.add("primary");
        } catch (error) {
          handRaised = false;
          handButton.disabled = false;
          showError(overlay, error?.message || "Could not raise your hand. Try again.");
        }
      });
      overlay.querySelector("[data-live-form]").addEventListener("submit", async event => {
        event.preventDefault();
        const textarea = event.currentTarget.querySelector("textarea");
        const text = textarea.value.trim();
        if (!text) { textarea.focus(); return; }
        const sendButton = event.currentTarget.querySelector('[type="submit"]');
        sendButton.disabled = true;
        try {
          await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: "question", text: text.slice(0, 500) })), { reliable: true, topic: "ace-qa" });
          addItem("You · sent", text.slice(0, 500));
          textarea.value = "";
          showError(overlay, "");
        } catch (error) { showError(overlay, error?.message || "Your question could not be sent. Try again."); }
        finally { sendButton.disabled = false; }
      });
    }
  } catch (error) {
    if (!closed) {
      setStatus("Unable to join");
      showError(overlay, error?.message || "Could not open the live meeting. Please try again.");
      overlay.querySelector("[data-live-speaker]").textContent = "The room is not ready yet";
      overlay.querySelector("[data-live-caption]").textContent = "Your approval remains private and unchanged.";
    }
  }
}
