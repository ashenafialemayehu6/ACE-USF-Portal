// ACE-USF Student Advice Room — public, searchable advice catalog.
// Administrators publish entries through the existing Site Content Manager.
import { db } from "./firebase_config.js";
import {
  collection,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

let ADVICE = [];
let unsubscribe = null;
let activeSource = "all";
let returnFocus = null;

const SOURCES = [
  { id: "all", label: "All voices", icon: "fa-people-group" },
  { id: "currentStudent", label: "Current students", icon: "fa-user-graduate" },
  { id: "alumnus", label: "Alumni & graduates", icon: "fa-user-tie" },
  { id: "studentFamily", label: "Students’ families", icon: "fa-house-heart" },
  { id: "churchServant", label: "Church servants", icon: "fa-cross" }
];

const LANGUAGES = [
  "Amharic", "Afaan Oromo", "Tigrinya", "Somali", "Afar", "Sidama",
  "Wolaytta", "Gurage (Sebat Bet)", "Gamo", "Gedeo", "Hadiyya", "Kafa",
  "Kembata", "Dawro", "Silte", "Bench", "Konso", "Awi (Agaw)",
  "Kunama", "Nuer", "Me'en", "Anuak", "Harari", "English", "Other"
];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function styles() {
  if (document.getElementById("ace-advice-room-styles")) return;
  const style = document.createElement("style");
  style.id = "ace-advice-room-styles";
  style.textContent = `
    .ace-advice-overlay{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;padding:clamp(10px,3vw,32px);background:rgba(12,25,22,.78);backdrop-filter:blur(14px);animation:aceAdviceFade .2s ease-out}
    .ace-advice-dialog{width:min(1160px,100%);max-height:min(92vh,1050px);overflow:auto;border:1px solid rgba(255,255,255,.18);border-radius:28px;background:#f7f5ef;color:#1c3028;box-shadow:0 32px 100px rgba(0,0,0,.4);animation:aceAdviceRise .32s cubic-bezier(.2,.75,.2,1)}
    .ace-advice-hero{position:relative;overflow:hidden;padding:clamp(28px,5vw,56px);color:#fff;background:radial-gradient(ellipse at 88% 10%,rgba(218,177,104,.27),transparent 35%),linear-gradient(125deg,#102a23,#174436 62%,#365b45)}
    .ace-advice-hero:after{content:"“";position:absolute;right:8%;top:-38%;color:rgba(255,255,255,.055);font:300px/1 Georgia,serif;pointer-events:none}
    .ace-advice-close{position:absolute;right:20px;top:20px;z-index:2;display:grid;width:42px;height:42px;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(255,255,255,.1);color:white;font-size:20px;cursor:pointer;transition:background .2s,transform .2s}
    .ace-advice-close:hover{background:rgba(255,255,255,.22);transform:rotate(90deg)}
    .ace-advice-kicker{margin:0 0 12px;color:#e6cb8b;font-size:10px;font-weight:850;letter-spacing:.2em;text-transform:uppercase}
    .ace-advice-title{max-width:800px;margin:0;font:clamp(34px,5.7vw,62px)/1.04 Georgia,"Times New Roman",serif;letter-spacing:-.035em}
    .ace-advice-lede{max-width:730px;margin:15px 0 0;color:#e7eee8;font-size:14px;line-height:1.8}
    .ace-advice-counts{display:flex;flex-wrap:wrap;gap:9px;margin-top:21px}
    .ace-advice-counts span{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.08);color:#f2f5ef;font-size:11px}
    .ace-advice-counts b{color:#f2d58f}
    .ace-advice-body{padding:clamp(18px,4vw,38px)}
    .ace-advice-tools{display:grid;grid-template-columns:minmax(220px,1fr) repeat(3,minmax(130px,.55fr));gap:10px}
    .ace-advice-search,.ace-advice-filter{min-width:0;min-height:48px;border:1px solid #dedbce;border-radius:14px;background:#fff;color:#41564b}
    .ace-advice-search{display:flex;align-items:center;gap:10px;padding:0 14px}
    .ace-advice-search i{color:#8d753e}
    .ace-advice-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#1c3028;font:inherit;font-size:13px}
    .ace-advice-filter{padding:0 12px;font:inherit;font-size:12px;outline-color:#bf9b4d}
    .ace-advice-filter:disabled{opacity:.55}
    .ace-advice-tabs{display:flex;gap:8px;overflow-x:auto;padding:17px 0 20px;scrollbar-width:thin}
    .ace-advice-tab{display:inline-flex;flex:0 0 auto;align-items:center;gap:8px;padding:10px 13px;border:1px solid #dedbce;border-radius:999px;background:#fff;color:#465a4f;font-size:11px;font-weight:750;cursor:pointer;transition:all .2s}
    .ace-advice-tab:hover,.ace-advice-tab[aria-pressed=true]{border-color:#1e4a39;background:#1e4a39;color:#fff;box-shadow:0 5px 15px rgba(30,74,57,.16)}
    .ace-advice-tab-count{display:grid;min-width:20px;height:20px;place-items:center;padding:0 5px;border-radius:999px;background:rgba(31,75,60,.09);font-size:10px}
    .ace-advice-tab[aria-pressed=true] .ace-advice-tab-count{background:rgba(255,255,255,.16)}
    .ace-advice-results-meta{margin:0 0 12px;color:#66766d;font-size:11px;font-weight:700}
    .ace-advice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:14px}
    .ace-advice-card{position:relative;display:flex;min-height:265px;flex-direction:column;overflow:hidden;padding:20px;border:1px solid #e7e2d7;border-radius:20px;background:linear-gradient(145deg,#fff,#fcfbf7);box-shadow:0 6px 19px rgba(34,51,41,.045);transition:transform .2s,border-color .2s,box-shadow .2s}
    .ace-advice-card:before{position:absolute;inset:0 auto 0 0;width:3px;background:linear-gradient(#c4a05a,#e8d6a8);content:""}
    .ace-advice-card:hover{transform:translateY(-3px);border-color:#d6c59d;box-shadow:0 14px 30px rgba(34,51,41,.09)}
    .ace-advice-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px}
    .ace-advice-tag{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border-radius:999px;background:#edf2eb;color:#315342;font-size:9px;font-weight:800}
    .ace-advice-tag.gold{background:#fbf3df;color:#745a24}
    .ace-advice-card h3{margin:0;color:#20372c;font:700 20px/1.25 Georgia,serif}
    .ace-advice-byline{margin:8px 0 13px;color:#6b786f;font-size:11px;line-height:1.65}
    .ace-advice-quote{margin:0;color:#43574b;font:14px/1.8 Georgia,serif;white-space:pre-line}
    .ace-advice-read{display:inline-flex;align-items:center;gap:7px;margin:auto 0 0;padding:12px 0 0;border:0;background:none;color:#80672f;font-size:11px;font-weight:850;text-align:left;cursor:pointer}
    .ace-advice-read:hover{text-decoration:underline}
    .ace-advice-empty{grid-column:1/-1;padding:38px 20px;border:1px dashed #c8cfc5;border-radius:20px;background:rgba(255,255,255,.65);text-align:center}
    .ace-advice-empty-icon{display:grid;width:54px;height:54px;margin:0 auto 13px;place-items:center;border-radius:18px;background:#eaf0e8;color:#1f4b3c;font-size:20px}
    .ace-advice-empty h3{margin:0;color:#233b30;font:700 21px Georgia,serif}
    .ace-advice-empty p{max-width:540px;margin:9px auto 0;color:#64736a;font-size:12px;line-height:1.7}
    .ace-advice-footnote{margin:20px 0 0;color:#778078;text-align:center;font-size:10px;line-height:1.7}
    @keyframes aceAdviceFade{from{opacity:0}to{opacity:1}}@keyframes aceAdviceRise{from{opacity:0;transform:translateY(13px) scale(.99)}to{opacity:1;transform:none}}
    @media(max-width:820px){.ace-advice-tools{grid-template-columns:repeat(2,minmax(0,1fr))}.ace-advice-search{grid-column:1/-1}}
    @media(max-width:560px){.ace-advice-overlay{padding:0;align-items:end}.ace-advice-dialog{max-height:96dvh;border-radius:24px 24px 0 0}.ace-advice-hero{padding:30px 21px}.ace-advice-close{right:13px;top:13px}.ace-advice-tools{grid-template-columns:1fr}.ace-advice-search{grid-column:auto}.ace-advice-filter{min-height:45px}.ace-advice-card{min-height:0;padding:17px}}
    @media(prefers-reduced-motion:reduce){.ace-advice-overlay,.ace-advice-dialog{animation:none}.ace-advice-card,.ace-advice-tab,.ace-advice-close{transition:none}}
  `;
  document.head.append(style);
}

function modal() { return document.getElementById("ace-advice-room"); }

function labelForSource(id, advice) {
  if (id === "studentFamily") return "Students’ Family";
  if (id === "churchServant") return advice.churchPosition || "Church Servant";
  if (id === "alumnus") return "Alumnus / Graduate";
  if (id === "currentStudent") return "Current Student";
  return "ACE-USF Community";
}

function setupFilters(dialog) {
  const languageSelect = dialog.querySelector("[data-advice-language]");
  const universitySelect = dialog.querySelector("[data-advice-university]");
  const departmentSelect = dialog.querySelector("[data-advice-department]");
  const values = (key) => [...new Set(ADVICE.map(item => String(item[key] || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const fill = (select, allLabel, items) => {
    const previous = select.value;
    select.innerHTML = `<option value="">${allLabel}</option>${items.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
    if (items.includes(previous)) select.value = previous;
  };
  fill(languageSelect, "All languages", [...new Set([...LANGUAGES, ...values("language")])].sort((a, b) => a.localeCompare(b)));
  fill(universitySelect, "All universities", values("university"));
  fill(departmentSelect, "All departments", values("department"));
}

function countFor(source) {
  return source === "all" ? ADVICE.length : ADVICE.filter(item => item.sourceType === source).length;
}

function adviceTime(item) {
  const value = item.updatedAt || item.createdAt;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return 0;
}

function render() {
  const dialog = modal();
  if (!dialog) return;
  setupFilters(dialog);
  const search = dialog.querySelector("[data-advice-search]").value.trim().toLocaleLowerCase();
  const language = dialog.querySelector("[data-advice-language]").value;
  const university = dialog.querySelector("[data-advice-university]").value;
  const department = dialog.querySelector("[data-advice-department]").value;
  const entries = ADVICE.filter(item => {
    const sourceOk = activeSource === "all" || item.sourceType === activeSource;
    const languageOk = !language || item.language === language;
    const universityOk = !university || item.university === university;
    const departmentOk = !department || item.department === department;
    const allText = [item.title, item.author, item.sourceType, item.churchPosition, item.language,
      item.university, item.department, item.category, item.advice].join(" ").toLocaleLowerCase();
    return sourceOk && languageOk && universityOk && departmentOk && allText.includes(search);
  }).sort((a, b) => adviceTime(b) - adviceTime(a));
  dialog.querySelectorAll("[data-advice-source]").forEach(button => {
    const source = button.dataset.adviceSource;
    const count = countFor(source);
    const countNode = button.querySelector(".ace-advice-tab-count");
    if (countNode) countNode.textContent = count;
  });
  dialog.querySelectorAll(".ace-advice-counts span").forEach((node, index) => {
    const count = countFor(SOURCES[index + 1].id);
    const number = node.querySelector("b");
    if (number) number.textContent = count;
  });
  dialog.querySelector("[data-advice-result-count]").textContent = `${entries.length} ${entries.length === 1 ? "message" : "messages"} found`;
  dialog.querySelector("[data-advice-results]").innerHTML = entries.length ? entries.map(item => {
    const source = labelForSource(item.sourceType, item);
    const details = [item.university, item.department ? `Department: ${item.department}` : "", item.category].filter(Boolean);
    const metadata = [item.author, ...details].filter(Boolean).map(escapeHtml).join(" · ");
    const tags = `<span class="ace-advice-tag"><i class="fa-solid fa-user" aria-hidden="true"></i>${escapeHtml(source)}</span><span class="ace-advice-tag gold"><i class="fa-solid fa-language" aria-hidden="true"></i>${escapeHtml(item.language || "Language not set")}</span>`;
    return `<article class="ace-advice-card"><div class="ace-advice-tags">${tags}</div><h3>${escapeHtml(item.title || "Advice for the journey")}</h3><p class="ace-advice-byline">${metadata}</p><p class="ace-advice-quote">${escapeHtml(item.advice || "")}</p></article>`;
  }).join("") : `<div class="ace-advice-empty"><div class="ace-advice-empty-icon"><i class="fa-solid ${search ? "fa-magnifying-glass" : "fa-book-open-reader"}" aria-hidden="true"></i></div><h3>${search || language || university || department ? "No advice matches yet" : "A room ready for shared wisdom"}</h3><p>${search || language || university || department ? "Try a different phrase, language, university, department, or voice category." : "Approved advice will appear here as administrators add messages in the Site Content Manager."}</p></div>`;
}

export function setupAdviceRoom() {
  if (!unsubscribe) {
    unsubscribe = onSnapshot(query(collection(db, "siteContent", "studentAdvice", "items"), where("published", "==", true)), snapshot => {
      ADVICE = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      document.querySelectorAll("[data-advice-count]").forEach(node => {
        const total = ADVICE.length;
        node.textContent = total ? `${total}+ shared messages` : "Stories of wisdom · coming soon";
        node.setAttribute("aria-label", total ? `${total} plus advice messages` : "Advice Room ready for approved messages");
      });
      render();
    }, error => {
      console.warn("Advice Room catalog could not be loaded:", error);
      const results = modal()?.querySelector("[data-advice-results]");
      if (results) results.innerHTML = `<div class="ace-advice-empty"><h3>Advice is temporarily unavailable</h3><p>Please try again in a little while.</p></div>`;
    });
  }
}

export function openAdviceRoom(trigger) {
  if (modal()) return;
  styles();
  activeSource = "all";
  returnFocus = trigger || document.activeElement;
  const overlay = document.createElement("div");
  overlay.id = "ace-advice-room";
  overlay.className = "ace-advice-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.innerHTML = `<section class="ace-advice-dialog" role="dialog" aria-modal="true" aria-labelledby="ace-advice-title"><header class="ace-advice-hero"><button type="button" class="ace-advice-close" data-advice-close aria-label="Close Advice Room">×</button><p class="ace-advice-kicker">ACE-USF · Wisdom shared across generations</p><h2 class="ace-advice-title" id="ace-advice-title">The Advice Room</h2><p class="ace-advice-lede">Guidance for the student journey, shared by current students, graduates, families, and church servants. Explore by voice, language, university, or department.</p><div class="ace-advice-counts" aria-label="Advice room totals">${SOURCES.slice(1).map(source => `<span><i class="fa-solid ${source.icon}" aria-hidden="true"></i><b>${countFor(source.id)}</b>${source.label}</span>`).join("")}</div></header><div class="ace-advice-body"><div class="ace-advice-tools"><label class="ace-advice-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" data-advice-search placeholder="Search advice, names, languages, universities…" aria-label="Search all advice"></label><select class="ace-advice-filter" data-advice-language aria-label="Filter advice by language"><option value="">All languages</option></select><select class="ace-advice-filter" data-advice-university aria-label="Filter by university"><option value="">All universities</option></select><select class="ace-advice-filter" data-advice-department aria-label="Filter by department"><option value="">All departments</option></select></div><div class="ace-advice-tabs" role="group" aria-label="Filter by advice source">${SOURCES.map(source => `<button type="button" class="ace-advice-tab" data-advice-source="${source.id}" aria-pressed="${source.id === "all"}"><i class="fa-solid ${source.icon}" aria-hidden="true"></i>${source.label}<span class="ace-advice-tab-count">${countFor(source.id)}</span></button>`).join("")}</div><p class="ace-advice-results-meta" data-advice-result-count aria-live="polite"></p><section class="ace-advice-grid" data-advice-results aria-live="polite"></section><p class="ace-advice-footnote">Advice is shared for encouragement and learning. Seek trusted local support for personal, pastoral, or urgent needs.</p></div></section>`;
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  overlay.querySelector("[data-advice-close]").addEventListener("click", closeAdviceRoom);
  overlay.querySelectorAll("[data-advice-source]").forEach(button => button.addEventListener("click", () => {
    activeSource = button.dataset.adviceSource;
    overlay.querySelectorAll("[data-advice-source]").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    render();
  }));
  overlay.querySelectorAll("[data-advice-search], [data-advice-language], [data-advice-university], [data-advice-department]").forEach(control => control.addEventListener(control.tagName === "INPUT" ? "input" : "change", render));
  overlay.addEventListener("click", event => { if (event.target === overlay) closeAdviceRoom(); });
  const keyHandler = event => { if (event.key === "Escape") closeAdviceRoom(); };
  overlay._adviceKeyHandler = keyHandler;
  document.addEventListener("keydown", keyHandler);
  render();
  overlay.querySelector("[data-advice-search]").focus();
}

export function closeAdviceRoom() {
  const overlay = modal();
  if (!overlay) return;
  document.removeEventListener("keydown", overlay._adviceKeyHandler);
  overlay.remove();
  document.body.style.overflow = "";
  returnFocus?.focus?.();
}
