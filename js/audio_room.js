// ACE-USF Audio Room — Firebase-backed media catalog, no added package dependency.
// Visitor-visible resources are read live from Firestore; admins add them in
// the existing Site Content Manager and upload audio to Firebase Storage.
import { db } from "./firebase_config.js";
import {
  collection,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

let AUDIO_LIBRARY = [];
let catalogUnsubscribe = null;

const TYPES = [
  { id: "all", label: "All resources", icon: "fa-layer-group" },
  { id: "preaching", label: "Preaching", icon: "fa-microphone-lines" },
  { id: "solo-song", label: "Solo songs", icon: "fa-music" },
  { id: "apostolic-song", label: "Apostolic songs", icon: "fa-book-open" },
  { id: "poem", label: "Poems & spoken word", icon: "fa-feather-pointed" }
];
const OFFICIAL_APOSTOLIC_SONGS_URL = "https://open.asmeklit.com/";
const OFFICIAL_APOSTOLIC_CHURCH_URL = "https://acieth.org/";
const OFFICIAL_APOSTOLIC_MEDIA_TELEGRAM_URL = "https://t.me/AmenApostolicMedia";
const OFFICIAL_APOSTOLIC_YOUTUBE_URL = "https://youtu.be/OmA9U3AgUss";

let activeType = "all";
let activePreacher = "";
let returnFocus = null;
let keyHandler = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function ensureStyles() {
  if (document.getElementById("ace-audio-room-styles")) return;
  const style = document.createElement("style");
  style.id = "ace-audio-room-styles";
  style.textContent = `
    .ace-audio-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:clamp(10px,3vw,32px);background:rgba(8,20,18,.78);backdrop-filter:blur(14px);animation:aceAudioFade .2s ease-out}
    .ace-audio-dialog{position:relative;width:min(1120px,100%);max-height:min(92vh,1000px);overflow:auto;border:1px solid rgba(255,255,255,.16);border-radius:28px;background:#f7f4ec;color:#172a23;box-shadow:0 32px 100px rgba(0,0,0,.42);animation:aceAudioRise .35s cubic-bezier(.2,.75,.2,1)}
    .ace-audio-hero{position:relative;overflow:hidden;padding:clamp(26px,5vw,58px);color:#fff;background:radial-gradient(ellipse at 90% 15%,rgba(218,177,104,.28),transparent 35%),linear-gradient(125deg,#102b24,#173c32 58%,#294b3d)}
    .ace-audio-hero:after{content:"♪";position:absolute;right:8%;top:2%;font:200px/1 Georgia,serif;color:rgba(255,255,255,.055);pointer-events:none}
    .ace-audio-kicker{margin:0 0 12px;color:#e3c889;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}
    .ace-audio-title{max-width:680px;margin:0;font:clamp(34px,6vw,62px)/1.02 Georgia,"Times New Roman",serif;letter-spacing:-.035em}
    .ace-audio-lede{max-width:650px;margin:16px 0 0;color:#e6eee8;font-size:15px;line-height:1.75}
    .ace-audio-stats{display:flex;flex-wrap:wrap;gap:9px;margin-top:23px}
    .ace-audio-stats span{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(255,255,255,.17);border-radius:999px;background:rgba(255,255,255,.08);color:#e8eee7;font-size:11px}
    .ace-audio-stats i{color:#e3c889}.ace-audio-stats b{color:#fff;font-size:13px}
    .ace-audio-back{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 12px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.1);color:#fff;font-size:12px;font-weight:750;cursor:pointer}
    .ace-audio-back[hidden]{display:none}.ace-audio-back:hover{background:rgba(255,255,255,.2)}
    .ace-audio-close{position:absolute;right:20px;top:20px;z-index:2;display:grid;width:42px;height:42px;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(255,255,255,.1);color:white;font-size:20px;cursor:pointer;transition:background .2s,transform .2s}
    .ace-audio-close:hover{background:rgba(255,255,255,.22);transform:rotate(90deg)}
    .ace-audio-body{padding:clamp(20px,4vw,42px)}
    .ace-audio-official-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 22px}
    .ace-audio-official{display:flex;min-height:194px;flex-direction:column;align-items:flex-start;gap:13px;padding:17px;border:1px solid rgba(201,167,95,.38);border-radius:19px;background:linear-gradient(145deg,#fffaf0,#fff 68%,#f3f5ee);box-shadow:0 8px 24px rgba(38,52,40,.055);transition:transform .2s,border-color .2s,box-shadow .2s}
    .ace-audio-official:hover{transform:translateY(-2px);border-color:rgba(201,167,95,.72);box-shadow:0 14px 30px rgba(38,52,40,.1)}
    .ace-audio-official-icon{display:grid;width:48px;height:48px;place-items:center;border-radius:16px;background:#193f32;color:#e8ca83;font-size:19px}
    .ace-audio-official-copy h3{margin:0;color:#20372c;font:700 18px Georgia,serif}.ace-audio-official-copy p{margin:5px 0 0;color:#66746b;font-size:12px;line-height:1.6}
    .ace-audio-official-link{display:inline-flex;align-items:center;justify-content:center;gap:9px;margin-top:auto;padding:11px 15px;border:0;border-radius:12px;background:#193f32;color:#fff;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap;transition:transform .2s,background .2s}
    .ace-audio-official-link:hover{transform:translateY(-2px);background:#285c46}
    .ace-audio-tools{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}
    .ace-audio-search{display:flex;align-items:center;gap:12px;min-height:52px;padding:0 16px;border:1px solid #ded9cc;border-radius:15px;background:#fff;color:#547067}
    .ace-audio-search input{width:100%;border:0;outline:0;background:transparent;color:#172a23;font:inherit;font-size:14px}
    .ace-audio-count{color:#63746c;font-size:12px;font-weight:700;white-space:nowrap}
    .ace-audio-tabs{display:flex;gap:9px;overflow-x:auto;padding:19px 0 22px;scrollbar-width:thin}
    .ace-audio-tab{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid #ded9cc;border-radius:999px;background:#fff;color:#42594f;font-size:12px;font-weight:750;cursor:pointer;transition:all .2s}
    .ace-audio-tab:hover,.ace-audio-tab[aria-pressed=true]{border-color:#1f4b3c;background:#1f4b3c;color:#fff;box-shadow:0 5px 16px rgba(31,75,60,.18)}
    .ace-audio-tab-count{display:inline-grid;min-width:21px;height:21px;place-items:center;padding:0 5px;border-radius:999px;background:rgba(31,75,60,.09);font-size:10px}
    .ace-audio-tab[aria-pressed=true] .ace-audio-tab-count,.ace-audio-tab:hover .ace-audio-tab-count{background:rgba(255,255,255,.18)}
    .ace-audio-voice-section{margin:0 0 22px;padding:19px;border:1px solid #e6e1d6;border-radius:21px;background:linear-gradient(135deg,#fff,#f2f4ed)}
    .ace-audio-voice-heading{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:13px}
    .ace-audio-section-kicker{margin:0 0 5px;color:#9b7a37;font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}
    .ace-audio-voice-heading h3{margin:0;color:#20372c;font:700 22px Georgia,serif}
    .ace-audio-voice-heading>span{color:#738078;font-size:11px}
    .ace-audio-voices{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin}
    .ace-audio-voice{display:flex;min-width:210px;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e6e1d6;border-radius:15px;background:#fff;text-align:left;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}
    .ace-audio-voice:hover{transform:translateY(-2px);border-color:#c9a75f;box-shadow:0 8px 18px rgba(34,58,44,.09)}
    .ace-audio-voice-icon{display:grid;width:37px;height:37px;flex:0 0 37px;place-items:center;border-radius:12px;background:#eaf0e8;color:#1f4b3c}
    .ace-audio-voice-copy{display:grid;gap:3px;min-width:0}.ace-audio-voice-copy strong{overflow:hidden;color:#25392f;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.ace-audio-voice-copy small{color:#738078;font-size:10px}
    .ace-audio-voice-arrow{margin-left:auto;color:#b18b42;font-size:11px}
    .ace-audio-voices-empty{padding:13px;color:#6b786f;font-size:12px;line-height:1.6}
    .ace-audio-speaker-link{padding:0;border:0;background:none;color:#80662e;font:inherit;font-size:11px;font-weight:750;text-align:left;cursor:pointer}.ace-audio-speaker-link:hover{text-decoration:underline}
    .ace-audio-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:15px}
    .ace-audio-card{overflow:hidden;border:1px solid #e6e1d6;border-radius:19px;background:#fff;box-shadow:0 5px 18px rgba(37,49,40,.045);transition:transform .22s,box-shadow .22s}
    .ace-audio-card:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(37,49,40,.11)}
    .ace-audio-card-top{display:flex;align-items:center;gap:13px;padding:18px 18px 10px}
    .ace-audio-card-icon{display:grid;width:44px;height:44px;flex:0 0 44px;place-items:center;border-radius:14px;background:#edf2eb;color:#1f4b3c;font-size:17px}
    .ace-audio-card h3{margin:0;color:#1e3028;font:700 17px/1.3 Georgia,serif}
    .ace-audio-meta{margin:5px 0 0;color:#718078;font-size:11px}
    .ace-audio-description{padding:0 18px 15px;color:#586960;font-size:13px;line-height:1.65}
    .ace-audio-player{display:block;width:calc(100% - 36px);height:40px;margin:0 18px 18px;accent-color:#1f4b3c}
    .ace-audio-download{display:inline-flex;align-items:center;gap:8px;margin:0 18px 17px;padding:9px 12px;border:1px solid #d8dfd5;border-radius:11px;background:#f4f6f1;color:#1e4b3a;font-size:11px;font-weight:800;text-decoration:none;transition:background .2s,border-color .2s}
    .ace-audio-download:hover{border-color:#c9a75f;background:#fff8e9}
    .ace-audio-poem{margin:0 18px 18px;padding:15px;border-left:3px solid #c9a75f;border-radius:0 12px 12px 0;background:#f8f5ed;color:#34483e;font:15px/1.85 Georgia,serif;white-space:pre-line}
    .ace-audio-empty{grid-column:1/-1;padding:34px 22px;border:1px dashed #c8cfc5;border-radius:20px;background:rgba(255,255,255,.62);text-align:center}
    .ace-audio-empty-icon{display:grid;width:54px;height:54px;margin:0 auto 13px;place-items:center;border-radius:18px;background:#eaf0e8;color:#1f4b3c;font-size:21px}
    .ace-audio-empty h3{margin:0;color:#233b30;font:700 20px Georgia,serif}
    .ace-audio-empty p{max-width:520px;margin:9px auto 0;color:#64736a;font-size:13px;line-height:1.7}
    .ace-audio-footnote{margin:22px 0 0;color:#778078;text-align:center;font-size:11px;line-height:1.6}
    @keyframes aceAudioFade{from{opacity:0}to{opacity:1}}@keyframes aceAudioRise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
    @media(max-width:1020px){.ace-audio-official-links{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:620px){.ace-audio-overlay{padding:0;align-items:end}.ace-audio-dialog{max-height:96dvh;border-radius:24px 24px 0 0}.ace-audio-tools{grid-template-columns:1fr}.ace-audio-count{padding-left:3px}.ace-audio-hero{padding:30px 22px}.ace-audio-close{right:14px;top:14px}.ace-audio-voice-heading{align-items:start;flex-direction:column;gap:5px}.ace-audio-voice-section{padding:14px}.ace-audio-official-links{grid-template-columns:1fr}.ace-audio-official{min-height:0}.ace-audio-official-link{width:100%}.ace-audio-official-copy h3{font-size:16px}}
    @media(prefers-reduced-motion:reduce){.ace-audio-overlay,.ace-audio-dialog{animation:none}.ace-audio-card,.ace-audio-tab,.ace-audio-close,.ace-audio-official{transition:none}}
  `;
  document.head.append(style);
}

function getModal() {
  return document.getElementById("ace-audio-room");
}

function resourceCount(type = "all") {
  return type === "all" ? AUDIO_LIBRARY.length : AUDIO_LIBRARY.filter(item => item.type === type).length;
}

function displayCount(count) {
  return count ? `${count}+` : "Ready";
}

function preachingVoices() {
  const voices = new Map();
  AUDIO_LIBRARY.filter(item => item.type === "preaching" && item.creator?.trim()).forEach(item => {
    const name = item.creator.trim();
    const key = name.toLocaleLowerCase();
    const current = voices.get(key) || { name, count: 0 };
    current.count += 1;
    voices.set(key, current);
  });
  return [...voices.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Call from app.js after the page loads. The Home feature card count is derived
// from this module's real catalog, so it updates when resources are added.
export function setupAudioRoom() {
  if (!catalogUnsubscribe) {
    const publishedResources = query(
      collection(db, "siteContent", "audioLibrary", "items"),
      where("published", "==", true)
    );
    catalogUnsubscribe = onSnapshot(publishedResources, snapshot => {
      AUDIO_LIBRARY = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      updateHomeResourceCount();
      if (getModal()) renderResources();
    }, error => {
      console.warn("Audio Room catalog could not be loaded:", error);
    });
  }
  updateHomeResourceCount();
}

function updateHomeResourceCount() {
  document.querySelectorAll("[data-audio-resource-count]").forEach(node => {
    const count = resourceCount();
    node.textContent = count ? `${displayCount(count)} resources` : "Collection ready";
    node.setAttribute("aria-label", count ? `${count} plus audio and poem resources` : "Audio and poem room ready for resources");
  });
}

function renderResources() {
  const modal = getModal();
  if (!modal) return;
  const query = modal.querySelector("[data-audio-search]").value.trim().toLocaleLowerCase();
  const results = AUDIO_LIBRARY.filter(item => {
    const typeMatch = activeType === "all" || item.type === activeType;
    const preacherMatch = !activePreacher || (item.type === "preaching" && item.creator?.trim().toLocaleLowerCase() === activePreacher.toLocaleLowerCase());
    const searchable = [item.title, item.creator, item.category, item.description, ...(item.tags || [])].join(" ").toLocaleLowerCase();
    return typeMatch && preacherMatch && searchable.includes(query);
  });
  const totalInView = activePreacher
    ? preachingVoices().find(voice => voice.name.toLocaleLowerCase() === activePreacher.toLocaleLowerCase())?.count || 0
    : resourceCount(activeType);
  modal.querySelector("[data-audio-count]").textContent = `${results.length} ${results.length === 1 ? "resource" : "resources"} shown · ${totalInView} in ${activePreacher ? "this room" : "collection"}`;
  renderVoices(query);
  const grid = modal.querySelector("[data-audio-results]");
  if (!results.length) {
    const searched = query ? `No resources match “${escapeHtml(query)}”. Try another title, speaker, or category.` :
      activePreacher ? `No matching teachings by ${activePreacher}. Clear the search to see all of this preacher’s recordings.` :
      activeType === "all" ? "The room is ready. Audio and poem resources will appear here as soon as you add their real files or approved text." :
      activeType === "apostolic-song" ? "Your own Apostolic song collection will appear here when you add its audio entries. You can already explore and listen through the official live library above." :
      `There are no ${TYPES.find(type => type.id === activeType)?.label.toLowerCase() || "resources"} here yet. Add a recording or text when it is ready.`;
    grid.innerHTML = `<div class="ace-audio-empty"><div class="ace-audio-empty-icon"><i class="fa-solid fa-book-open" aria-hidden="true"></i></div><h3>${query ? "No matches yet" : "A quiet room, ready to be filled"}</h3><p>${searched}</p></div>`;
    return;
  }
  grid.innerHTML = results.map(item => {
    const poem = item.type === "poem";
    const icon = poem ? "fa-feather-pointed" : item.type === "solo-song" || item.type === "apostolic-song" ? "fa-music" : "fa-microphone-lines";
    const kind = TYPES.find(type => type.id === item.type)?.label || "Resource";
    const media = poem
      ? `<blockquote class="ace-audio-poem">${escapeHtml(item.text || "")}</blockquote><a class="ace-audio-download" href="data:text/plain;charset=utf-8,${encodeURIComponent(item.text || "")}" download="${escapeHtml(safeDownloadName(item.title, "txt"))}"><i class="fa-solid fa-download" aria-hidden="true"></i> Download poem</a>`
      : item.src ? `<audio class="ace-audio-player" controls preload="none" src="${escapeHtml(item.src)}">Your browser does not support audio playback.</audio><a class="ace-audio-download" href="${escapeHtml(item.src)}" download="${escapeHtml(safeDownloadName(item.title, "mp3"))}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-download" aria-hidden="true"></i> Download / open audio</a>` : "";
    const creator = item.creator ? item.type === "preaching"
      ? `<button type="button" class="ace-audio-speaker-link" data-open-preacher="${escapeHtml(item.creator)}">${escapeHtml(item.creator)} · Open teaching room</button>`
      : escapeHtml(item.creator) : "";
    return `<article class="ace-audio-card"><div class="ace-audio-card-top"><span class="ace-audio-card-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></span><div><h3>${escapeHtml(item.title)}</h3><p class="ace-audio-meta">${escapeHtml(kind)}${creator ? ` · ${creator}` : ""}</p></div></div>${item.description ? `<p class="ace-audio-description">${escapeHtml(item.description)}</p>` : ""}${media}</article>`;
  }).join("");
}

function safeDownloadName(title, extension) {
  const base = String(title || "audio-room-resource").trim().replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "");
  return `${base || "audio-room-resource"}.${extension}`;
}

function renderVoices(query = "") {
  const modal = getModal();
  const shelf = modal?.querySelector("[data-audio-voices]");
  if (!shelf) return;
  const voices = preachingVoices().filter(voice => !query || voice.name.toLocaleLowerCase().includes(query));
  if (!voices.length) {
    shelf.innerHTML = `<div class="ace-audio-voices-empty">${query ? "No preacher name matches this search." : "Preacher rooms will appear here when you add teachings with each minister’s name."}</div>`;
    return;
  }
  shelf.innerHTML = voices.map(voice => `<button type="button" class="ace-audio-voice" data-open-preacher="${escapeHtml(voice.name)}"><span class="ace-audio-voice-icon"><i class="fa-solid fa-microphone-lines" aria-hidden="true"></i></span><span class="ace-audio-voice-copy"><strong>${escapeHtml(voice.name)}</strong><small>${voice.count} ${voice.count === 1 ? "teaching" : "teachings"}</small></span><i class="fa-solid fa-arrow-up-right-from-square ace-audio-voice-arrow" aria-hidden="true"></i></button>`).join("");
}

function openPreacherRoom(name) {
  const modal = getModal();
  if (!modal) return;
  activePreacher = name;
  activeType = "preaching";
  modal.querySelector("[data-audio-search]").value = "";
  modal.querySelector("[data-audio-search]").placeholder = `Search within ${name}’s teaching room…`;
  modal.querySelector("[data-audio-room-title]").textContent = `${name} · Teaching Room`;
  modal.querySelector("[data-audio-room-lede]").textContent = `Explore all preaching and teachings by ${name}. Search this room to find a message by its title or subject.`;
  modal.querySelector("[data-audio-back]").hidden = false;
  modal.querySelectorAll("[data-audio-type]").forEach(tab => tab.setAttribute("aria-pressed", String(tab.dataset.audioType === "preaching")));
  renderResources();
  modal.querySelector("[data-audio-search]").focus();
}

function showAllRooms() {
  const modal = getModal();
  if (!modal) return;
  activePreacher = "";
  activeType = "all";
  modal.querySelector("[data-audio-search]").value = "";
  modal.querySelector("[data-audio-search]").placeholder = "Search title, speaker, or category…";
  modal.querySelector("[data-audio-room-title]").textContent = "The Audio Room";
  modal.querySelector("[data-audio-room-lede]").textContent = "A calm place for biblical teaching, songs of faith, and thoughtful words. Search the collection or choose a listening room below.";
  modal.querySelector("[data-audio-back]").hidden = true;
  modal.querySelectorAll("[data-audio-type]").forEach(tab => tab.setAttribute("aria-pressed", String(tab.dataset.audioType === "all")));
  renderResources();
}

function closeAudioRoom() {
  const modal = getModal();
  if (!modal) return;
  modal.remove();
  document.body.style.overflow = "";
  document.removeEventListener("keydown", keyHandler);
  returnFocus?.focus?.();
}

export function openAudioRoom(trigger) {
  if (getModal()) return;
  ensureStyles();
  activeType = "all";
  activePreacher = "";
  returnFocus = trigger || document.activeElement;
  const modal = document.createElement("div");
  modal.id = "ace-audio-room";
  modal.className = "ace-audio-overlay";
  modal.setAttribute("role", "presentation");
  modal.innerHTML = `<section class="ace-audio-dialog" role="dialog" aria-modal="true" aria-labelledby="ace-audio-title"><header class="ace-audio-hero"><button type="button" class="ace-audio-close" data-audio-close aria-label="Close Audio Room"><span aria-hidden="true">×</span></button><p class="ace-audio-kicker">ACE-USF · Listen, reflect, grow</p><button type="button" class="ace-audio-back" data-audio-back hidden><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All audio rooms</button><h2 class="ace-audio-title" id="ace-audio-title" data-audio-room-title>The Audio Room</h2><p class="ace-audio-lede" data-audio-room-lede>A calm place for biblical teaching, songs of faith, and thoughtful words. Search the collection or choose a listening room below.</p><div class="ace-audio-stats" aria-label="Collection totals">${TYPES.slice(1).map(type => `<span><i class="fa-solid ${type.icon}" aria-hidden="true"></i><b>${resourceCount(type.id)}</b>${type.label}</span>`).join("")}</div></header><div class="ace-audio-body"><section class="ace-audio-official-links" aria-label="Official Apostolic resources"><article class="ace-audio-official"><span class="ace-audio-official-icon"><i class="fa-solid fa-music" aria-hidden="true"></i></span><div class="ace-audio-official-copy"><h3>Apostolic Songs · Live Library</h3><p>Search songs, follow lyrics, and listen directly from the Apostolic Songs library.</p></div><a class="ace-audio-official-link" href="${OFFICIAL_APOSTOLIC_SONGS_URL}" target="_blank" rel="noopener noreferrer">Explore songs <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></article><article class="ace-audio-official"><span class="ace-audio-official-icon"><i class="fa-solid fa-church" aria-hidden="true"></i></span><div class="ace-audio-official-copy"><h3>Apostolic Church of Ethiopia</h3><p>Visit the church website for its official information and resources.</p></div><a class="ace-audio-official-link" href="${OFFICIAL_APOSTOLIC_CHURCH_URL}" target="_blank" rel="noopener noreferrer">Visit official website <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></article><article class="ace-audio-official"><span class="ace-audio-official-icon"><i class="fa-brands fa-telegram" aria-hidden="true"></i></span><div class="ace-audio-official-copy"><h3>AMEN · Apostolic Media</h3><p>Follow the church multimedia service on Telegram for media updates and shared teachings.</p></div><a class="ace-audio-official-link" href="${OFFICIAL_APOSTOLIC_MEDIA_TELEGRAM_URL}" target="_blank" rel="noopener noreferrer">Open Telegram <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></article><article class="ace-audio-official"><span class="ace-audio-official-icon"><i class="fa-brands fa-youtube" aria-hidden="true"></i></span><div class="ace-audio-official-copy"><h3>Apostolic Church · YouTube</h3><p>Watch the official YouTube channel shared for the Apostolic Church of Ethiopia.</p></div><a class="ace-audio-official-link" href="${OFFICIAL_APOSTOLIC_YOUTUBE_URL}" target="_blank" rel="noopener noreferrer">Watch on YouTube <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></article></section><div class="ace-audio-tools"><label class="ace-audio-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input data-audio-search type="search" placeholder="Search title, speaker, or category…" aria-label="Search Audio Room"></label><span class="ace-audio-count" data-audio-count aria-live="polite"></span></div><div class="ace-audio-tabs" role="group" aria-label="Filter audio resources">${TYPES.map(type => `<button type="button" class="ace-audio-tab" data-audio-type="${type.id}" aria-pressed="${type.id === "all"}"><i class="fa-solid ${type.icon}" aria-hidden="true"></i>${type.label}<span class="ace-audio-tab-count">${resourceCount(type.id)}</span></button>`).join("")}</div><section class="ace-audio-voice-section" aria-labelledby="ace-audio-voices-heading"><div class="ace-audio-voice-heading"><div><p class="ace-audio-section-kicker">Browse by voice</p><h3 id="ace-audio-voices-heading">Preacher Rooms</h3></div><span>Choose a minister to explore their teachings</span></div><div class="ace-audio-voices" data-audio-voices></div></section><div class="ace-audio-grid" data-audio-results aria-live="polite"></div><p class="ace-audio-footnote">Listen in a quiet moment. Take what is helpful into prayer, study, and service.</p></div></section>`;
  document.body.append(modal);
  document.body.style.overflow = "hidden";
  modal.querySelector("[data-audio-search]").addEventListener("input", renderResources);
  modal.querySelectorAll("[data-audio-type]").forEach(button => button.addEventListener("click", () => {
    activePreacher = "";
    modal.querySelector("[data-audio-back]").hidden = true;
    modal.querySelector("[data-audio-room-title]").textContent = "The Audio Room";
    modal.querySelector("[data-audio-room-lede]").textContent = "A calm place for biblical teaching, songs of faith, and thoughtful words. Search the collection or choose a listening room below.";
    modal.querySelector("[data-audio-search]").placeholder = "Search title, speaker, or category…";
    activeType = button.dataset.audioType;
    modal.querySelectorAll("[data-audio-type]").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    renderResources();
  }));
  modal.addEventListener("click", event => {
    const preacherButton = event.target.closest("[data-open-preacher]");
    if (preacherButton) { openPreacherRoom(preacherButton.dataset.openPreacher); return; }
    if (event.target.closest("[data-audio-back]")) { showAllRooms(); return; }
    if (event.target === modal || event.target.closest("[data-audio-close]")) closeAudioRoom();
  });
  keyHandler = event => {
    if (event.key === "Escape") closeAudioRoom();
    if (event.key === "Tab" && getModal()) {
      const focusable = [...modal.querySelectorAll("button, input, a[href], audio[controls]")].filter(node => !node.disabled && !node.hidden);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", keyHandler);
  renderResources();
  modal.querySelector("[data-audio-close]").focus();
}

// Data format for real content (append objects to AUDIO_LIBRARY above):
// For every sermon by one minister, use the exact same full name in creator:
// { type: "preaching", title: "…", creator: "Bishop Degu", category: "…", description: "…", src: "assets/audio/file.mp3", tags: [] }
// { type: "solo-song", title: "…", creator: "…", description: "…", src: "assets/audio/file.mp3" }
// { type: "apostolic-song", title: "…", creator: "…", description: "…", src: "assets/audio/file.mp3" }
// { type: "poem", title: "…", creator: "…", description: "…", text: "Approved poem text…" }
