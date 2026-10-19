// ACE-USF Meeting Room — published program calendar with server-enforced access.
import { auth, db } from "./firebase_config.js";
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, where, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { joinLiveMeeting } from "./live_meeting.js";

const TELEGRAM_WEBHOOK_URL = "https://ace-usf-telegram-webhook.vercel.app/api/telegram";

async function notifyMeetingRequest(requestId) {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const response = await fetch(`${TELEGRAM_WEBHOOK_URL}?action=notify`, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ kind: "meeting-request", requestId })
    });
    return response.ok;
  } catch (error) {
    console.warn("Meeting request was saved, but Telegram notification could not be sent.", error);
    return false;
  }
}

let PROGRAMS = [];
let profile = null;
let profileUid = "";
let verifiedMembership = null;
let programsUnsubscribe = null;
let authUnsubscribe = null;
let activeKind = "all";
let activeRoom = "all";
let returnFocus = null;
let identityRevision = 0;

const KINDS = [
  { id: "all", label: "All programs", icon: "fa-calendar-days" },
  { id: "bibleStudy", label: "Bible study", icon: "fa-book-bible" },
  { id: "conference", label: "Conferences", icon: "fa-people-roof" },
  { id: "specialProgram", label: "Special programs", icon: "fa-star" }
];

const ROOMS = [
  { id: "all", label: "All rooms", icon: "fa-door-open" },
  { id: "main", label: "Main Hall", icon: "fa-people-roof" },
  { id: "departmental", label: "Departmental Study", icon: "fa-book-bible" },
  { id: "leaders", label: "Leaders’ Room", icon: "fa-shield-halved" },
  { id: "women", label: "Women’s Ministry", icon: "fa-hands-holding-child" }
];

const GROUP_NAMES = { healthSciences: "Medicine & Health Sciences", technology: "Technology & Computing", engineering: "Engineering & Built Environment", naturalSciences: "Natural Sciences", socialSciences: "Social Sciences & Education", business: "Business & Economics", lawGovernance: "Law & Governance", agriculture: "Agriculture & Life Sciences", other: "Other approved group" };
const MEETING_SUPPORT_TELEGRAM_URL = "https://t.me/ACE_USF_AssistantBot";

function roomMatches(program, room) {
  if (room === "all") return true;
  if (room === "main") return program.audience === "all";
  if (room === "departmental") return program.audience === "department" || program.audience === "departmentGroup";
  return program.audience === room;
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function addStyles() {
  if (document.getElementById("ace-meeting-room-styles")) return;
  const style = document.createElement("style");
  style.id = "ace-meeting-room-styles";
  style.textContent = `
    .ace-meeting-overlay{position:fixed;inset:0;z-index:10002;display:grid;place-items:center;padding:clamp(10px,3vw,32px);background:rgba(10,16,32,.8);backdrop-filter:blur(15px);animation:aceMeetFade .22s ease-out}
    .ace-meeting-dialog{width:min(1190px,100%);max-height:min(93vh,1080px);overflow:auto;border:1px solid rgba(255,255,255,.2);border-radius:29px;background:#f4f5f9;color:#19243d;box-shadow:0 35px 110px rgba(0,0,0,.48);animation:aceMeetRise .34s cubic-bezier(.2,.75,.2,1)}
    .ace-meeting-hero{position:relative;isolation:isolate;overflow:hidden;padding:clamp(30px,5.5vw,62px);color:#fff;background:radial-gradient(ellipse at 74% 12%,rgba(48,152,218,.48),transparent 25%),radial-gradient(ellipse at 88% 86%,rgba(231,172,79,.25),transparent 30%),linear-gradient(125deg,#09152d 3%,#132b50 47%,#345a7b 100%)}
    .ace-meeting-hero:before{position:absolute;z-index:-1;inset:0;content:"";opacity:.68;background:linear-gradient(90deg,transparent 0 8%,rgba(160,209,242,.2) 8.2%,transparent 8.5% 24%,rgba(160,209,242,.16) 24.2%,transparent 24.5% 75%,rgba(160,209,242,.15) 75.2%,transparent 75.5%),linear-gradient(0deg,rgba(247,190,97,.25),transparent 1.3%,transparent 72%,rgba(238,195,128,.22) 72.5%,transparent 73%),repeating-linear-gradient(90deg,transparent 0 94px,rgba(169,211,239,.1) 95px 97px,transparent 98px 150px),repeating-linear-gradient(0deg,transparent 0 70px,rgba(169,211,239,.08) 71px 73px,transparent 74px 120px);mask-image:linear-gradient(90deg,transparent,#000 20%,#000)}
    .ace-meeting-hero:after{content:"";position:absolute;z-index:-1;right:-8%;bottom:-58%;width:70%;height:90%;transform:perspective(300px) rotateX(55deg);border:1px solid rgba(255,215,151,.35);border-radius:50%;background:repeating-linear-gradient(0deg,transparent 0 27px,rgba(255,221,164,.18) 28px 29px,transparent 30px 58px);box-shadow:0 0 60px rgba(81,171,225,.18);pointer-events:none}
    .ace-meeting-hero>*{position:relative;z-index:1}
    .ace-meeting-close{position:absolute;right:20px;top:20px;z-index:2;display:grid;width:42px;height:42px;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(255,255,255,.1);color:#fff;font-size:20px;cursor:pointer;transition:background .2s,transform .2s}
    .ace-meeting-close:hover{background:rgba(255,255,255,.22);transform:rotate(90deg)}
    .ace-meeting-kicker{margin:0 0 12px;color:#f3cf8c;font-size:10px;font-weight:850;letter-spacing:.2em;text-transform:uppercase}
    .ace-meeting-title{max-width:850px;margin:0;font:clamp(34px,5.8vw,64px)/1.03 Georgia,"Times New Roman",serif;letter-spacing:-.035em}
    .ace-meeting-lede{max-width:760px;margin:15px 0 0;color:#e6eaf2;font-size:14px;line-height:1.8}
    .ace-meeting-highlights{display:flex;flex-wrap:wrap;gap:9px;margin-top:22px}
    .ace-meeting-highlights span{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.09);color:#f3f4f8;font-size:11px}
    .ace-meeting-highlights i{color:#f3cf8c}.ace-meeting-highlights b{color:#fff}
    .ace-meeting-body{padding:clamp(18px,4vw,40px)}
    .ace-meeting-notice{display:flex;align-items:flex-start;gap:11px;margin:0 0 17px;padding:14px 16px;border:1px solid #d9ddec;border-radius:16px;background:linear-gradient(110deg,#eef2fb,#fff9ec);color:#43516e;font-size:11px;line-height:1.65}
    .ace-meeting-notice i{margin-top:2px;color:#a87c37}
    .ace-meeting-tools{display:grid;grid-template-columns:minmax(220px,1fr) minmax(190px,.55fr);gap:10px}
    .ace-meeting-search,.ace-meeting-filter{min-width:0;min-height:49px;border:1px solid #d8ddeb;border-radius:14px;background:#fff;color:#43516e}
    .ace-meeting-search{display:flex;align-items:center;gap:10px;padding:0 14px}.ace-meeting-search i{color:#a87c37}
    .ace-meeting-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#19243d;font:inherit;font-size:13px}
    .ace-meeting-filter{padding:0 12px;font:inherit;font-size:12px;outline-color:#ae853d}
    .ace-meeting-tabs{display:flex;gap:8px;overflow-x:auto;padding:16px 0 18px;scrollbar-width:thin}
    .ace-meeting-room-heading{margin:22px 0 9px;color:#283653;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
    .ace-meeting-room-tabs{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:9px;overflow-x:auto;padding:2px 1px 8px}
    .ace-meeting-room-tab{display:flex;min-height:68px;align-items:center;gap:10px;padding:11px 13px;border:1px solid #d9deea;border-radius:16px;background:linear-gradient(145deg,#fff,#f3f5fa);color:#35435f;text-align:left;font-size:11px;font-weight:850;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s,background .2s}
    .ace-meeting-room-tab i{display:grid;width:34px;height:34px;flex:0 0 34px;place-items:center;border-radius:11px;background:#e9edf5;color:#526c88}
    .ace-meeting-room-tab:hover{transform:translateY(-2px);border-color:#b9a06d;box-shadow:0 8px 18px rgba(29,42,72,.1)}
    .ace-meeting-room-tab[aria-pressed=true]{border-color:#263b67;background:linear-gradient(135deg,#1c2948,#405b82);color:#fff;box-shadow:0 8px 20px rgba(29,42,72,.18)}
    .ace-meeting-room-tab[aria-pressed=true] i{background:rgba(255,255,255,.14);color:#f4d48f}
    .ace-meeting-room-tab b{margin-left:auto;color:inherit;font-size:13px}
    .ace-meeting-tab{display:inline-flex;flex:0 0 auto;align-items:center;gap:8px;padding:10px 13px;border:1px solid #d8ddeb;border-radius:999px;background:#fff;color:#465471;font-size:11px;font-weight:750;cursor:pointer;transition:all .2s}
    .ace-meeting-tab:hover,.ace-meeting-tab[aria-pressed=true]{border-color:#283d69;background:#283d69;color:#fff;box-shadow:0 5px 15px rgba(40,61,105,.19)}
    .ace-meeting-tab-count{display:grid;min-width:20px;height:20px;place-items:center;padding:0 5px;border-radius:999px;background:rgba(40,61,105,.1);font-size:10px}
    .ace-meeting-tab[aria-pressed=true] .ace-meeting-tab-count{background:rgba(255,255,255,.18)}
    .ace-meeting-results-meta{margin:0 0 12px;color:#66728b;font-size:11px;font-weight:700}
    .ace-meeting-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:15px}
    .ace-meeting-card{position:relative;display:flex;min-height:310px;flex-direction:column;overflow:hidden;border:1px solid #dfe3ed;border-radius:21px;background:#fff;box-shadow:0 7px 20px rgba(29,42,72,.06);transition:transform .22s,border-color .22s,box-shadow .22s}
    .ace-meeting-card:hover{transform:translateY(-3px);border-color:#c1a66f;box-shadow:0 15px 33px rgba(29,42,72,.12)}
    .ace-meeting-card-head{position:relative;overflow:hidden;padding:18px 19px 16px;color:white;background:linear-gradient(120deg,#202b50,#455d86)}
    .ace-meeting-card-head:after{position:absolute;right:16px;bottom:-49px;color:rgba(255,255,255,.08);content:"✦";font:110px/1 Georgia,serif;pointer-events:none}
    .ace-meeting-labels{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:6px;margin-bottom:11px}
    .ace-meeting-label{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.1);color:#fff;font-size:9px;font-weight:800}
    .ace-meeting-label.gold{border-color:rgba(243,207,140,.35);background:rgba(243,207,140,.14);color:#ffe3aa}
    .ace-meeting-card h3{position:relative;z-index:1;margin:0;color:white;font:700 21px/1.25 Georgia,serif}
    .ace-meeting-card-content{display:flex;flex:1;flex-direction:column;padding:17px 19px 19px}
    .ace-meeting-schedule{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 13px}
    .ace-meeting-fact{display:flex;align-items:flex-start;gap:8px;padding:9px;border-radius:12px;background:#f2f4f8;color:#4b5872;font-size:10px;line-height:1.5}
    .ace-meeting-fact i{margin-top:2px;color:#a77b36}
    .ace-meeting-description{margin:0 0 12px;color:#56627a;font-size:12px;line-height:1.75;white-space:pre-line}
    .ace-meeting-scripture{margin:0 0 14px;padding:11px 13px;border-left:3px solid #d3b36e;border-radius:0 12px 12px 0;background:#fbf7ed;color:#6c572d;font:italic 13px/1.6 Georgia,serif}
    .ace-meeting-actions{margin-top:auto}
    .ace-meeting-join{display:inline-flex;width:100%;min-height:44px;align-items:center;justify-content:center;gap:9px;padding:10px 14px;border:0;border-radius:13px;background:linear-gradient(110deg,#263b67,#3f5a81);color:#fff;font-size:11px;font-weight:850;cursor:pointer;transition:transform .2s,filter .2s}
    .ace-meeting-join:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.12)}
    .ace-meeting-join:disabled{background:#e8ebf1;color:#58637a;cursor:not-allowed}
    .ace-meeting-join:focus-visible,.ace-meeting-tab:focus-visible,.ace-meeting-close:focus-visible{outline:3px solid #d4ad62;outline-offset:2px}
    .ace-meeting-access-note{margin:9px 1px 0;color:#8b5629;font-size:10px;line-height:1.55}
    .ace-meeting-status{min-height:16px;margin:8px 1px 0;color:#385a47;font-size:10px;line-height:1.5}
    .ace-meeting-empty{grid-column:1/-1;padding:39px 21px;border:1px dashed #c7cedd;border-radius:20px;background:rgba(255,255,255,.7);text-align:center}
    .ace-meeting-empty-icon{display:grid;width:55px;height:55px;margin:0 auto 13px;place-items:center;border-radius:18px;background:#e9edf6;color:#344d7a;font-size:20px}
    .ace-meeting-empty h3{margin:0;color:#233252;font:700 21px Georgia,serif}.ace-meeting-empty p{max-width:560px;margin:9px auto 0;color:#66728b;font-size:12px;line-height:1.7}
    .ace-meeting-footnote{margin:20px 0 0;color:#758098;text-align:center;font-size:10px;line-height:1.7}
    .ace-meeting-request-overlay{position:fixed;inset:0;z-index:10004;display:grid;place-items:center;padding:18px;background:rgba(6,14,30,.75);backdrop-filter:blur(12px);animation:aceMeetFade .18s ease-out}
    .ace-meeting-request-card{width:min(520px,100%);overflow:hidden;border:1px solid rgba(255,255,255,.55);border-radius:24px;background:#fff;box-shadow:0 30px 90px rgba(0,0,0,.4);animation:aceMeetRise .24s ease-out}
    .ace-meeting-request-head{padding:24px 26px;background:radial-gradient(circle at 90% 0,rgba(232,192,118,.35),transparent 40%),linear-gradient(125deg,#10213c,#365b79);color:#fff}
    .ace-meeting-request-head h3{margin:5px 0 0;font:700 25px/1.15 Georgia,serif}.ace-meeting-request-head p{margin:8px 0 0;color:#e4edf5;font-size:12px;line-height:1.6}
    .ace-meeting-request-body{padding:22px 26px}.ace-meeting-request-body p{color:#4f5d73;font-size:12px;line-height:1.7}
    .ace-meeting-request-confirm{display:flex;align-items:flex-start;gap:10px;margin:17px 0;padding:14px;border:1px solid #dce4eb;border-radius:14px;background:#f5f8fa;color:#34445e;font-size:12px;line-height:1.55}.ace-meeting-request-confirm input{width:17px;height:17px;accent-color:#176354}
    .ace-meeting-request-role{display:grid;gap:7px;margin:0 0 15px;color:#34445e;font-size:11px;font-weight:800}.ace-meeting-request-role select{width:100%;min-height:44px;padding:0 12px;border:1px solid #d8e0e8;border-radius:12px;background:#fff;color:#263752;font:inherit;font-weight:600;outline-color:#ae853d}
    .ace-meeting-request-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}.ace-meeting-request-actions button,.ace-meeting-request-actions a{display:inline-flex;min-height:43px;align-items:center;justify-content:center;gap:8px;padding:10px 14px;border:0;border-radius:12px;background:#183b60;color:#fff;font-size:11px;font-weight:850;text-decoration:none;cursor:pointer}.ace-meeting-request-actions .secondary{border:1px solid #d9e0e9;background:#fff;color:#40516a}
    @keyframes aceMeetFade{from{opacity:0}to{opacity:1}}@keyframes aceMeetRise{from{opacity:0;transform:translateY(15px) scale(.99)}to{opacity:1;transform:none}}
    @media(max-width:720px){.ace-meeting-tools{grid-template-columns:1fr}.ace-meeting-card{min-height:0}.ace-meeting-room-tabs{grid-template-columns:repeat(5,minmax(150px,1fr))}}
    @media(max-width:560px){.ace-meeting-overlay{padding:0;align-items:end}.ace-meeting-dialog{max-height:96dvh;border-radius:24px 24px 0 0}.ace-meeting-hero{padding:31px 21px}.ace-meeting-close{right:13px;top:13px}.ace-meeting-schedule{grid-template-columns:1fr 1fr}.ace-meeting-card-head{padding:16px}}
    @media(prefers-reduced-motion:reduce){.ace-meeting-overlay,.ace-meeting-dialog,.ace-meeting-request-overlay,.ace-meeting-request-card{animation:none}.ace-meeting-card,.ace-meeting-tab,.ace-meeting-join,.ace-meeting-close,.ace-meeting-room-tab{transition:none}}
  `;
  document.head.append(style);
}

function modal() { return document.getElementById("ace-meeting-room"); }

function countFor(kind) {
  return kind === "all" ? PROGRAMS.length : PROGRAMS.filter(item => item.programType === kind).length;
}

function countRoom(room) { return PROGRAMS.filter(program => roomMatches(program, room)).length; }

function setCountBadges() {
  const badges = document.querySelectorAll("[data-meeting-count]");
  badges.forEach(node => {
    const count = PROGRAMS.length;
    node.textContent = count ? `${count}+ programs` : "Gather, study, grow";
    node.setAttribute("aria-label", count ? `${count} plus meeting programs` : "Bible study and fellowship meeting room");
  });
}

function normalized(value) { return String(value || "").trim().toLocaleLowerCase(); }

function sameDepartment(program) {
  return Boolean(verifiedMembership?.department) && String(verifiedMembership.department).trim() === String(program.department || "").trim();
}

function sameStudyGroup(program) {
  return Boolean(verifiedMembership?.departmentGroup) && verifiedMembership.departmentGroup === program.departmentGroup;
}

function access(program) {
  if (!auth.currentUser) return { allowed: false, label: "Sign in to participate", note: "Sign in with your ACE-USF account to enter this program." };
  if (program.audience === "all") return { allowed: true, label: "Enter the program", note: "Open to all signed-in ACE-USF members." };
  if (program.audience === "department") {
    if (!profile?.department) return { allowed: false, canRequest: false, label: "Department required", note: "Your account has no recorded department. Contact the administrator to correct your account details before applying." };
    if (normalized(profile.department) !== normalized(program.department)) return { allowed: false, canRequest: false, label: "Department mismatch", note: `This Bible study is only for ${program.department}. Your recorded department is ${profile.department}; ask the administrator to correct it if this is wrong.` };
    if (verifiedMembership?.active && normalized(verifiedMembership.department) !== normalized(profile.department)) return { allowed: false, canRequest: false, label: "Membership needs review", note: "Your approved membership does not match your recorded department. Contact the administrator before applying." };
    if (sameDepartment(program) && verifiedMembership?.active) return { allowed: true, label: "Enter your department room", note: `Verified for ${verifiedMembership.department}${verifiedMembership.university ? ` · ${verifiedMembership.university}` : ""}.` };
    return { allowed: false, canRequest: true, label: "Apply for department access", note: `Your account records ${profile.department}. The administrator must approve access to this department room.` };
  }
  if (program.audience === "departmentGroup") {
    if (!profile?.department) return { allowed: false, canRequest: false, label: "Department required", note: "Your account has no recorded department. Contact the administrator before applying to a grouped study." };
    if (verifiedMembership?.active && normalized(verifiedMembership.department) !== normalized(profile.department)) return { allowed: false, canRequest: false, label: "Department mismatch", note: "Your approved membership does not match your recorded department. Contact the administrator before applying." };
    if (!verifiedMembership?.active || !verifiedMembership.departmentGroup) return { allowed: false, canRequest: true, label: "Request study group access", note: `Your recorded department is ${profile.department}. The administrator will assign and verify the appropriate study group.` };
    if (sameStudyGroup(program)) return { allowed: true, label: "Enter your study hall", note: `Verified for ${GROUP_NAMES[verifiedMembership.departmentGroup] || verifiedMembership.departmentGroup}.` };
    return { allowed: false, canRequest: false, label: "Study group mismatch", note: `This study is for ${GROUP_NAMES[program.departmentGroup] || "another approved group"}. Your approved group is ${GROUP_NAMES[verifiedMembership.departmentGroup] || verifiedMembership.departmentGroup}.` };
  }
  if (program.audience === "leaders") {
    if (verifiedMembership?.active && normalized(verifiedMembership.department) !== normalized(profile?.department)) return { allowed: false, canRequest: false, label: "Membership needs review", note: "Your approved leader record does not match your recorded department. Contact the administrator." };
    return verifiedMembership?.active === true && verifiedMembership.leadersOnly === true
      ? { allowed: true, label: "Enter leaders’ program", note: "Your leader access is verified." }
      : { allowed: false, label: "Request leaders’ access", note: "This program is reserved for leaders approved by the fellowship administrator." };
  }
  if (program.audience === "women") {
    if (profile?.sex !== "female") return { allowed: false, canRequest: false, label: profile?.sex === "male" ? "Women’s Ministry is restricted" : "Eligibility review required", note: profile?.sex === "male" ? "This room is reserved for women. Your recorded account details do not meet this room’s eligibility rule." : "Your account has no recorded sex. Contact the administrator for an account review; you cannot change this detail in your profile." };
    return verifiedMembership?.active === true && verifiedMembership.womenMinistry === true && verifiedMembership.sex === "female"
      ? { allowed: true, label: "Enter Women’s Ministry room", note: "Your Women’s Ministry access is administrator-approved." }
      : { allowed: false, canRequest: true, label: "Apply for Women’s Ministry", note: "Your account is recorded as female. An administrator must review and approve Women’s Ministry access before you can enter." };
  }
  return { allowed: false, label: "Access unavailable", note: "This program has an unrecognized audience setting." };
}

function setFilterOptions(select, values, defaultLabel) {
  const previous = select.value;
  select.innerHTML = `<option value="">${defaultLabel}</option>${values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join("")}`;
  if (values.includes(previous)) select.value = previous;
}

function formatSchedule(program) {
  const dateValue = String(program.eventDate || "").trim();
  let dateText = "Date to be announced";
  if (dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    dateText = Number.isNaN(date.valueOf()) ? dateValue : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
  }
  const time = [program.startTime, program.endTime].filter(Boolean).join("–");
  return { date: dateText, time: time ? `${time} EAT` : "Time to be announced" };
}

function render() {
  const dialog = modal();
  if (!dialog) return;
  const departmentFilter = dialog.querySelector("[data-meeting-department]");
  const groupFilter = dialog.querySelector("[data-meeting-group]");
  const departments = [...new Set([...PROGRAMS.map(item => String(item.department || "").trim()).filter(Boolean), verifiedMembership?.department].filter(Boolean))].sort((a,b) => a.localeCompare(b));
  setFilterOptions(departmentFilter, departments, "All departments");
  const groups = [...new Set([...PROGRAMS.map(item => item.departmentGroup).filter(Boolean), verifiedMembership?.departmentGroup].filter(Boolean))].sort();
  const previousGroup = groupFilter.value;
  groupFilter.innerHTML = `<option value="">All study groups</option>${groups.map(value => `<option value="${esc(value)}">${esc(GROUP_NAMES[value] || value)}</option>`).join("")}`;
  if (groups.includes(previousGroup)) groupFilter.value = previousGroup;
  const search = normalized(dialog.querySelector("[data-meeting-search]").value);
  const selectedDepartment = departmentFilter.value;
  const selectedGroup = groupFilter.value;
  const results = PROGRAMS.filter(program => {
    const typeMatch = activeKind === "all" || program.programType === activeKind;
    const roomMatch = roomMatches(program, activeRoom);
    const departmentMatch = !selectedDepartment || normalized(program.department) === normalized(selectedDepartment);
    const groupMatch = !selectedGroup || program.departmentGroup === selectedGroup;
    const haystack = [program.title, program.description, program.category, program.scripture, program.department, GROUP_NAMES[program.departmentGroup],
      program.university, program.location, program.format, program.audience].join(" ").toLocaleLowerCase();
    return roomMatch && typeMatch && departmentMatch && groupMatch && haystack.includes(search);
  }).sort((a,b) => String(a.eventDate || "9999-12-31").localeCompare(String(b.eventDate || "9999-12-31")));
  dialog.querySelectorAll("[data-meeting-room-tab]").forEach(button => {
    button.querySelector("b").textContent = countRoom(button.dataset.meetingRoomTab);
  });
  dialog.querySelectorAll("[data-meeting-kind]").forEach(button => {
    button.querySelector(".ace-meeting-tab-count").textContent = countFor(button.dataset.meetingKind);
  });
  dialog.querySelectorAll(".ace-meeting-highlights span").forEach((node, index) => {
    const number = node.querySelector("b");
    if (number) number.textContent = countFor(KINDS[index + 1].id);
  });
  dialog.querySelector("[data-meeting-result-count]").textContent = `${results.length} ${results.length === 1 ? "program" : "programs"} shown`;
  dialog.querySelector("[data-meeting-results]").innerHTML = results.length ? results.map(program => {
    const schedule = formatSchedule(program);
    const kind = KINDS.find(item => item.id === program.programType)?.label || "Gathering";
    const audience = program.audience === "leaders" ? "Leaders only" : program.audience === "women" ? "Women’s Ministry · restricted" : program.audience === "department" ? "Department only" : program.audience === "departmentGroup" ? (GROUP_NAMES[program.departmentGroup] || "Approved study group") : "Main Hall · all members";
    const eligibility = access(program);
    const facts = [
      `<span class="ace-meeting-fact"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${esc(schedule.date)}</span>`,
      `<span class="ace-meeting-fact"><i class="fa-regular fa-clock" aria-hidden="true"></i>${esc(schedule.time)}</span>`,
      `<span class="ace-meeting-fact"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${esc(program.location || program.format || "Location to be announced")}</span>`,
      `<span class="ace-meeting-fact"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>${esc(program.department ? `${program.department}${program.university ? ` · ${program.university}` : ""}` : GROUP_NAMES[program.departmentGroup] || audience)}</span>`
    ].join("");
    return `<article class="ace-meeting-card" data-meeting-card="${esc(program.id)}"><header class="ace-meeting-card-head"><div class="ace-meeting-labels"><span class="ace-meeting-label"><i class="fa-solid ${KINDS.find(item => item.id === program.programType)?.icon || "fa-calendar"}" aria-hidden="true"></i>${esc(kind)}</span><span class="ace-meeting-label gold"><i class="fa-solid ${program.liveAudioRoom ? "fa-headphones" : program.audience === "leaders" ? "fa-shield-halved" : program.audience === "department" ? "fa-people-group" : "fa-earth-africa"}" aria-hidden="true"></i>${program.liveAudioRoom ? "Live audio room" : esc(audience)}</span></div><h3>${esc(program.title || "ACE-USF Gathering")}</h3></header><div class="ace-meeting-card-content"><div class="ace-meeting-schedule">${facts}</div>${program.description ? `<p class="ace-meeting-description">${esc(program.description)}</p>` : ""}${program.scripture ? `<blockquote class="ace-meeting-scripture">${esc(program.scripture)}</blockquote>` : ""}<div class="ace-meeting-actions"><button type="button" class="ace-meeting-join" data-enter-meeting="${esc(program.id)}"><i class="fa-solid ${program.liveAudioRoom && eligibility.allowed ? "fa-headphones" : eligibility.allowed ? "fa-arrow-right-to-bracket" : !auth.currentUser ? "fa-right-to-bracket" : "fa-lock"}" aria-hidden="true"></i>${program.liveAudioRoom && eligibility.allowed ? "Enter live audio room" : esc(eligibility.label)}</button><p class="ace-meeting-access-note">${esc(eligibility.note)}</p><p class="ace-meeting-status" data-meeting-status aria-live="polite"></p></div></div></article>`;
  }).join("") : `<div class="ace-meeting-empty"><div class="ace-meeting-empty-icon"><i class="fa-solid ${search || selectedDepartment ? "fa-magnifying-glass" : "fa-calendar-check"}" aria-hidden="true"></i></div><h3>${search || selectedDepartment ? "No programs match your search" : "The room is ready for your next gathering"}</h3><p>${search || selectedDepartment ? "Try a different title, topic, department, or program type." : "Published Bible studies, conferences, and special programs will appear here when added by the administrator."}</p></div>`;
}

async function refreshIdentity(user) {
  const revision = ++identityRevision;
  profile = null;
  verifiedMembership = null;
  profileUid = user?.uid || "";
  if (user) {
    try {
      const [profileSnapshot, membershipSnapshot] = await Promise.all([
        getDoc(doc(db, "userProfiles", user.uid)),
        getDoc(doc(db, "meetingRoomMembers", user.uid))
      ]);
      if (revision !== identityRevision) return;
      profile = profileSnapshot.exists() ? profileSnapshot.data() : null;
      verifiedMembership = membershipSnapshot.exists() ? membershipSnapshot.data() : null;
    } catch (error) {
      // The server still verifies eligibility before returning a room link.
      console.warn("Meeting Room profile/access check was unavailable:", error);
      if (revision !== identityRevision) return;
    }
  }
  if (modal()) render();
}

function accessRequestId(userId, programId) {
  return `${userId}_${programId}`;
}

function closeAccessRequest(layer) {
  layer?.remove();
}

async function showAccessRequest(program) {
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("auth-btn")?.click();
    return;
  }
  const eligibility = access(program);
  if (eligibility.canRequest === false) { window.alert(eligibility.note); return; }
  const requestId = accessRequestId(user.uid, program.id);
  const requestRef = doc(db, "meetingAccessRequests", requestId);
  let previous = null;
  try {
    const requests = await getDocs(query(
      collection(db, "meetingAccessRequests"),
      where("uid", "==", user.uid),
      where("programId", "==", program.id)
    ));
    if (!requests.empty) previous = requests.docs[0].data();
  } catch (error) {
    console.warn("Could not check the previous access request:", error);
  }

  const roomName = program.audience === "women" ? "Women’s Ministry" : program.audience === "leaders" ? "Leaders’ Room" : program.audience === "departmentGroup" ? (GROUP_NAMES[program.departmentGroup] || "your departmental study group") : "your department room";
  const layer = document.createElement("div");
  layer.className = "ace-meeting-request-overlay";
  layer.setAttribute("role", "presentation");
  const heading = previous?.status === "pending" ? "Request received" : previous?.status === "rejected" ? "Request not approved" : previous?.status === "approved" ? "Approval recorded" : "Request room access";
  let body = "";
  if (previous?.status === "pending") {
    body = `<p>Your request for <strong>${esc(program.title || roomName)}</strong> is with the fellowship administrator. You can return here to check again after it is reviewed.</p><div class="ace-meeting-request-actions"><button type="button" class="secondary" data-request-close>Close</button></div>`;
  } else if (previous?.status === "rejected") {
    body = `<p>The administrator could not approve this request for <strong>${esc(program.title || roomName)}</strong>.</p>${previous.adminNote ? `<p><strong>Administrator note:</strong> ${esc(previous.adminNote)}</p>` : ""}<p>If you believe this was a mistake, contact the support team on Telegram for help.</p><div class="ace-meeting-request-actions"><a href="${MEETING_SUPPORT_TELEGRAM_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-telegram" aria-hidden="true"></i>Contact support on Telegram</a><button type="button" class="secondary" data-request-close>Close</button></div>`;
  } else if (previous?.status === "approved") {
    body = `<p>Your request was approved. Your room access is being refreshed; close this message and try the room button again.</p><div class="ace-meeting-request-actions"><button type="button" data-request-refresh>Refresh access</button></div>`;
  } else {
    body = `<p>You selected <strong>${esc(roomName)}</strong>. Your recorded department is <strong>${esc(profile?.department || "Not recorded")}</strong>${program.audience === "women" ? ` and your account eligibility is recorded as <strong>${esc(profile?.sex || "Not recorded")}</strong>` : ""}. Confirm that these details are correct. An administrator will review the request; submitting it does not grant access.</p><label class="ace-meeting-request-confirm"><input type="checkbox" data-eligibility-confirm><span>I confirm that the account details above are accurate and ask the administrator to review my access.</span></label><label class="ace-meeting-request-role">Your fellowship role<select data-request-role><option value="">Choose your role</option><option>Current student</option><option>Campus fellowship leader</option><option>Church servant</option><option>Students’ family</option><option>Alumnus / graduate</option><option>Other fellowship member</option></select></label><p>Your request is sent to the admin request queue and Telegram immediately after it is saved.</p><div class="ace-meeting-request-actions"><button type="button" data-send-request disabled>Send access request</button><button type="button" class="secondary" data-request-close>Cancel</button></div>`;
  }
  layer.innerHTML = `<section class="ace-meeting-request-card" role="dialog" aria-modal="true" aria-labelledby="ace-meeting-request-title"><header class="ace-meeting-request-head"><p class="ace-meeting-kicker">ACE-USF · ${esc(roomName)}</p><h3 id="ace-meeting-request-title">${heading}</h3><p>${esc(program.title || "Meeting Hall access")}</p></header><div class="ace-meeting-request-body">${body}<p class="ace-meeting-status" data-request-status aria-live="polite"></p></div></section>`;
  document.body.append(layer);
  layer.addEventListener("click", event => {
    if (event.target === layer || event.target.closest("[data-request-close]")) closeAccessRequest(layer);
    if (event.target.closest("[data-request-refresh]")) {
      closeAccessRequest(layer);
      refreshIdentity(auth.currentUser).then(render);
    }
  });
  layer.addEventListener("keydown", event => { if (event.key === "Escape") { event.stopPropagation(); closeAccessRequest(layer); } });
  const confirm = layer.querySelector("[data-eligibility-confirm]");
  const roleSelect = layer.querySelector("[data-request-role]");
  const send = layer.querySelector("[data-send-request]");
  const updateRequestButton = () => { send.disabled = !confirm?.checked || !roleSelect?.value; };
  confirm?.addEventListener("change", updateRequestButton);
  roleSelect?.addEventListener("change", updateRequestButton);
  send?.addEventListener("click", async () => {
    if (!confirm.checked || !auth.currentUser) return;
    send.disabled = true;
    send.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…`;
    const status = layer.querySelector("[data-request-status]");
    try {
      await setDoc(requestRef, {
        uid: user.uid,
        requesterName: profile?.displayName || user.displayName || user.email || "ACE-USF member",
        requesterEmail: user.email || "",
        universityName: profile?.campus || "",
        fellowshipRole: roleSelect.value,
        ...(profile?.telegramChatId ? { telegramChatId: String(profile.telegramChatId) } : {}),
        programId: program.id,
        programTitle: program.title || "ACE-USF Gathering",
        audience: program.audience,
        requestedDepartment: profile?.department || "",
        profileSex: profile?.sex || "",
        departmentGroup: program.audience === "departmentGroup" ? program.departmentGroup || "" : "",
        eligibilityConfirmed: true,
        status: "pending",
        adminNote: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const notified = await notifyMeetingRequest(requestId);
      layer.querySelector(".ace-meeting-request-body").innerHTML = `<div class="ace-meeting-empty-icon"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i></div><p><strong>Your request is saved in the administrator queue.</strong> ${notified ? "A Telegram alert was sent to the admin." : "The admin dashboard will show it now; the Telegram alert could not be delivered, so the administrator should check the queue."} It is waiting for review.</p><div class="ace-meeting-request-actions"><button type="button" data-request-close>Done</button></div>`;
    } catch (error) {
      status.textContent = error?.code === "permission-denied"
        ? "The request could not be saved. The administrator may need to publish the updated Firestore rules."
        : (error?.message || "The request could not be sent. Please try again.");
      send.disabled = false;
      send.textContent = "Send access request";
    }
  });
  layer.querySelector("[data-eligibility-confirm]")?.focus();
}

async function enterProgram(button) {
  const program = PROGRAMS.find(item => item.id === button.dataset.enterMeeting);
  if (!program) return;
  const status = button.closest(".ace-meeting-actions")?.querySelector("[data-meeting-status]");
  const eligibility = access(program);
  if (!auth.currentUser) {
    document.getElementById("auth-btn")?.click();
    if (status) status.textContent = "Sign in, then return here to enter the gathering.";
    return;
  }
  if (!eligibility.allowed) {
    if (status) status.textContent = eligibility.note;
    if (eligibility.canRequest !== false && ["department", "departmentGroup", "leaders", "women"].includes(program.audience)) showAccessRequest(program);
    return;
  }

  if (program.liveAudioRoom === true) {
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Preparing live room…`;
    if (status) status.textContent = "Verifying this meeting with the secure room service…";
    try {
      await joinLiveMeeting(program);
      if (status) status.textContent = "The live room was opened. Your access is verified by the server.";
    } catch (error) {
      if (status) status.textContent = error?.message || "Could not open the live room.";
    } finally {
      button.disabled = false;
      button.innerHTML = `<i class="fa-solid fa-headphones" aria-hidden="true"></i>Enter live audio room`;
    }
    return;
  }

  // The join URL is private and intentionally absent from the public program card,
  // so open a user-initiated tab before the async Firestore authorization check.
  const popup = program.format === "inPerson" ? null : window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Verifying access…`;
  if (status) status.textContent = "Checking your account against this meeting’s access rules…";
  try {
    const secret = await getDoc(doc(db, "meetingProgramSecrets", program.id));
    if (!secret.exists()) throw new Error("The organizer has not added the private meeting details yet.");
    const { meetingUrl = "", accessNotes = "" } = secret.data();
    if (meetingUrl) {
      const url = new URL(meetingUrl);
      if (url.protocol !== "https:") throw new Error("The meeting link is not a secure HTTPS address.");
      if (!popup) throw new Error("Your browser blocked the meeting tab. Allow pop-ups for this site and try again.");
      popup.location.replace(url.href);
      if (status) status.textContent = `Access verified. Your meeting is opening in a new tab. ${accessNotes}`;
    } else {
      popup?.close();
      if (status) status.textContent = `Access verified. ${program.location ? `Meet at ${program.location}.` : "Check with the organizer for the location."} ${accessNotes}`;
    }
  } catch (error) {
    popup?.close();
    if (status) status.textContent = error?.code === "permission-denied"
      ? "Access was not approved for this room. Check your department and profile, or contact the fellowship leaders."
      : (error?.message || "Could not load the meeting details.");
  } finally {
    button.disabled = false;
    const current = access(program);
    button.innerHTML = `<i class="fa-solid ${current.allowed ? "fa-arrow-right-to-bracket" : !auth.currentUser ? "fa-right-to-bracket" : "fa-lock"}" aria-hidden="true"></i>${esc(current.label)}`;
  }
}

export function setupMeetingRoom() {
  if (!programsUnsubscribe) {
    const published = query(collection(db, "siteContent", "meetingPrograms", "items"), where("published", "==", true));
    programsUnsubscribe = onSnapshot(published, snapshot => {
      PROGRAMS = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setCountBadges();
      render();
    }, error => {
      console.warn("Meeting Room programs could not be loaded:", error);
      const results = modal()?.querySelector("[data-meeting-results]");
      if (results) results.innerHTML = `<div class="ace-meeting-empty"><h3>Programs are temporarily unavailable</h3><p>Please try again later.</p></div>`;
    });
  }
  if (!authUnsubscribe) authUnsubscribe = onAuthStateChanged(auth, refreshIdentity);
}

export function openMeetingRoom(trigger) {
  if (modal()) return;
  addStyles();
  activeKind = "all";
  activeRoom = "all";
  returnFocus = trigger || document.activeElement;
  const overlay = document.createElement("div");
  overlay.id = "ace-meeting-room";
  overlay.className = "ace-meeting-overlay";
  overlay.setAttribute("role", "presentation");
  overlay.innerHTML = `<section class="ace-meeting-dialog" role="dialog" aria-modal="true" aria-labelledby="ace-meeting-title"><header class="ace-meeting-hero"><button type="button" class="ace-meeting-close" data-meeting-close aria-label="Close Meeting Room">×</button><p class="ace-meeting-kicker">ACE-USF · Gather with purpose</p><h2 class="ace-meeting-title" id="ace-meeting-title">The Meeting Hall</h2><p class="ace-meeting-lede">A welcoming campus hall with separate spaces for the main fellowship, grouped departmental Bible study, leaders’ meetings, and Women’s Ministry. Restricted spaces open only to members approved by the administrator.</p><div class="ace-meeting-highlights" aria-label="Program totals">${KINDS.slice(1).map(kind => `<span><i class="fa-solid ${kind.icon}" aria-hidden="true"></i><b>${countFor(kind.id)}</b>${kind.label}</span>`).join("")}</div></header><div class="ace-meeting-body"><p class="ace-meeting-notice"><i class="fa-solid fa-shield-heart" aria-hidden="true"></i><span>Choose a room to browse its gatherings. Study groups are assigned by an administrator; leaders’ access and Women’s Ministry eligibility are private roster approvals. Firestore checks eligibility again before releasing a meeting link.</span></p><div class="ace-meeting-tools"><label class="ace-meeting-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" data-meeting-search placeholder="Search programs, topics, departments, or study groups…" aria-label="Search meeting programs"></label><select class="ace-meeting-filter" data-meeting-department aria-label="Filter programs by department"><option value="">All departments</option></select><select class="ace-meeting-filter" data-meeting-group aria-label="Filter programs by approved study group"><option value="">All study groups</option></select></div><h3 class="ace-meeting-room-heading">Choose your meeting hall</h3><div class="ace-meeting-room-tabs" role="group" aria-label="Choose a meeting room">${ROOMS.map(room => `<button type="button" class="ace-meeting-room-tab" data-meeting-room-tab="${room.id}" aria-pressed="${room.id === activeRoom}"><i class="fa-solid ${room.icon}" aria-hidden="true"></i><span>${room.label}</span><b>${countRoom(room.id)}</b></button>`).join("")}</div><div class="ace-meeting-tabs" role="group" aria-label="Filter meeting program type">${KINDS.map(kind => `<button type="button" class="ace-meeting-tab" data-meeting-kind="${kind.id}" aria-pressed="${kind.id === "all"}"><i class="fa-solid ${kind.icon}" aria-hidden="true"></i>${kind.label}<span class="ace-meeting-tab-count">${countFor(kind.id)}</span></button>`).join("")}</div><p class="ace-meeting-results-meta" data-meeting-result-count aria-live="polite"></p><section class="ace-meeting-grid" data-meeting-results aria-live="polite"></section><p class="ace-meeting-footnote">Respect the audience and privacy rules for each gathering.</p></div></section>`;
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  overlay.querySelector("[data-meeting-close]").addEventListener("click", closeMeetingRoom);
  overlay.querySelectorAll("[data-meeting-room-tab]").forEach(button => button.addEventListener("click", () => {
    activeRoom = button.dataset.meetingRoomTab;
    overlay.querySelectorAll("[data-meeting-room-tab]").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    render();
  }));
  overlay.querySelectorAll("[data-meeting-kind]").forEach(button => button.addEventListener("click", () => {
    activeKind = button.dataset.meetingKind;
    overlay.querySelectorAll("[data-meeting-kind]").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
    render();
  }));
  overlay.querySelector("[data-meeting-search]").addEventListener("input", render);
  overlay.querySelector("[data-meeting-department]").addEventListener("change", render);
  overlay.querySelector("[data-meeting-group]").addEventListener("change", render);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeMeetingRoom();
    const enterButton = event.target.closest("[data-enter-meeting]");
    if (enterButton) enterProgram(enterButton);
  });
  overlay._meetingKeyHandler = event => { if (event.key === "Escape") closeMeetingRoom(); };
  document.addEventListener("keydown", overlay._meetingKeyHandler);
  render();
  overlay.querySelector("[data-meeting-search]").focus();
  if (auth.currentUser && profileUid !== auth.currentUser.uid) refreshIdentity(auth.currentUser);
}

export function closeMeetingRoom() {
  const overlay = modal();
  if (!overlay) return;
  document.removeEventListener("keydown", overlay._meetingKeyHandler);
  overlay.remove();
  document.body.style.overflow = "";
  returnFocus?.focus?.();
}
