// ACE-USF Fellowship Leaders Network
import { fellowshipUniversityRecords } from "./fellowship_leaders_data.js";

const COPY = {
  en: {
    nav: "Fellowship Leaders", eyebrow: "ACE-USF · UNIVERSITY COMMUNITY",
    title: "Welcome to the ACE-USF Fellowship Leaders Network",
    intro: "A platform to connect university fellowship leaders and students across Ethiopia. Discover the fellowship serving at your campus, learn about its leaders, and find public contact details when they are available. Wherever you study, you are part of a wider fellowship family. Let us grow together in faith, knowledge, unity, and service.",
    search: "Search university, city, leader, department, or role…", searchLabel: "Search the directory",
    university: "All universities", city: "All cities", department: "All departments",
    universities: "Participating universities", leaders: "Published leaders", cities: "Represented cities",
    directory: "Campus directory", emptyTitle: "The directory is getting ready",
    empty: "No verified university or leader records have been published yet. ACE-USF can add a campus once its details and leaders are confirmed.",
    noResults: "No matching university or leader was found. Try changing your search or filters.",
    location: "Location not provided", fellowship: "Campus fellowship", leader: "Fellowship leader",
    departmentMissing: "Department not provided", nameMissing: "Leader details to be confirmed",
    telegramMissing: "Telegram contact not available", contact: "Contact on Telegram",
    privacy: "Leader details and contacts appear only when verified and approved for public sharing.",
    report: "Report outdated information", reportSubject: "ACE-USF directory update",
    close: "Close directory", active: "Active fellowship", open: "View fellowship leaders",
    totalNote: "Counts are calculated from published records."
  },
  am: {
    nav: "የሕብረት መሪዎች", eyebrow: "ACE-USF · የዩኒቨርሲቲ ማኅበረሰብ",
    title: "ወደ ACE-USF የሕብረት መሪዎች አውታረ መረብ እንኳን ደህና መጡ",
    intro: "በኢትዮጵያ ያሉ የዩኒቨርሲቲ ሕብረት መሪዎችንና ተማሪዎችን ለማገናኘት የተዘጋጀ መድረክ ነው። በግቢዎ ያለውን ሕብረት ይፈልጉ፣ መሪዎቹን ይወቁ፣ እና ይፋ የሆኑ የመገኛ መንገዶችን ይጠቀሙ። በየትኛውም ዩኒቨርሲቲ ቢማሩ የአንድ ቤተሰብ አካል ነዎት። በእምነት፣ በእውቀት፣ በአንድነትና በአገልግሎት አብረን እንደግ።",
    search: "ዩኒቨርሲቲ፣ ከተማ፣ መሪ፣ ዲፓርትመንት ወይም ሚና ይፈልጉ…", searchLabel: "ማውጫውን ይፈልጉ",
    university: "ሁሉም ዩኒቨርሲቲዎች", city: "ሁሉም ከተሞች", department: "ሁሉም ዲፓርትመንቶች",
    universities: "የተሳተፉ ዩኒቨርሲቲዎች", leaders: "የታተሙ መሪዎች", cities: "የተወከሉ ከተሞች",
    directory: "የግቢ ማውጫ", emptyTitle: "ማውጫው በዝግጅት ላይ ነው",
    empty: "የተረጋገጡ የዩኒቨርሲቲ ወይም የመሪ መረጃዎች ገና አልታተሙም። የግቢውና የመሪዎቹ መረጃ ከተረጋገጠ በኋላ ACE-USF ሊያክለው ይችላል።",
    noResults: "የፍለጋዎን ቃል ወይም ማጣሪያ በመቀየር እንደገና ይሞክሩ።",
    location: "የመገኛ ቦታ አልተገለጸም", fellowship: "የግቢ ሕብረት", leader: "የሕብረት መሪ",
    departmentMissing: "ዲፓርትመንት አልተገለጸም", nameMissing: "የመሪ መረጃ ይጠበቃል",
    telegramMissing: "የቴሌግራም መገኛ አልተገኘም", contact: "በቴሌግራም ያግኙ",
    privacy: "የመሪዎች መረጃና የመገኛ ዝርዝሮች የሚታዩት ከተረጋገጡና ለሕዝብ እንዲጋሩ ፈቃድ ከተሰጠ ብቻ ነው።",
    report: "ያልተዘመነ መረጃ ሪፖርት ያድርጉ", reportSubject: "የACE-USF ማውጫ ማሻሻያ",
    close: "ማውጫውን ዝጋ", active: "ንቁ ሕብረት", open: "የሕብረት መሪዎችን ይመልከቱ",
    totalNote: "ቁጥሮቹ በታተሙ መረጃዎች መሠረት ይሰላሉ።"
  }
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function cleanRecords() {
  return (Array.isArray(fellowshipUniversityRecords) ? fellowshipUniversityRecords : [])
    .filter(item => item && item.active !== false && String(item.universityName || "").trim())
    .sort((a, b) => String(a.universityName || "").localeCompare(String(b.universityName || ""), undefined, { sensitivity: "base", numeric: true }));
}

function validTelegram(username) {
  const clean = String(username || "").trim().replace(/^@/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(clean) ? clean : "";
}

function validPhone(value) {
  const display = String(value || "").trim();
  const tel = display.replace(/[^\d+]/g, "");
  return /^\+?\d{7,15}$/.test(tel) ? { display, tel } : null;
}

function safePhotoUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.href);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function currentLanguage() {
  const amButton = document.getElementById("lang-am-btn");
  return amButton?.classList.contains("bg-amber-500") ? "am" : "en";
}

export function setupFellowshipLeadersSection() {
  if (document.documentElement.dataset.fellowshipLeadersReady === "true") return;
  const nav = document.getElementById("main-navigation");
  const triggers = [...document.querySelectorAll('a[href="#hubs-section"]')];
  if (!nav && !triggers.length) {
    console.warn("Fellowship Leaders Network: no existing navigation or home card was found.");
    return;
  }
  document.documentElement.dataset.fellowshipLeadersReady = "true";

  // The middle feature tile retains its existing directory behavior. The top
  // navigation link now opens the dedicated room in fellowship_leaders_room.js.
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    const trigger = target?.closest("[data-open-fellowship-leaders-middle]");
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, true);

  let modal = document.getElementById("fellowship-leaders-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "fellowship-leaders-modal";
    modal.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="fln-title" class="fln-dialog relative flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-[1.6rem] bg-[#f4f8f6] shadow-2xl sm:max-h-[92vh]">
        <header class="fln-topbar relative overflow-hidden bg-[#092b32] px-5 py-4 text-white sm:px-8">
          <div class="fln-orbit fln-orbit-one" aria-hidden="true"></div><div class="fln-orbit fln-orbit-two" aria-hidden="true"></div>
          <div class="relative z-10 flex items-start justify-between gap-3">
            <div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/15 text-amber-300"><i class="fa-solid fa-people-group text-lg"></i></span><div><p class="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">ACE-USF</p><p class="text-xs text-teal-100">Fellowship Leaders Network</p></div></div>
            <button id="fln-close" type="button" aria-label="Close directory" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="relative z-10 mt-7 max-w-4xl pb-2"><p id="fln-eyebrow" class="text-[10px] font-black uppercase tracking-[.22em] text-teal-200"></p><h1 id="fln-title" class="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-5xl"></h1><p id="fln-intro" class="mt-4 max-w-3xl text-sm leading-6 text-teal-50/90 sm:text-base sm:leading-7"></p></div>
          <div class="fln-connection-line" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
          <div id="fln-stats" class="grid grid-cols-1 gap-3 sm:grid-cols-3"></div>
          <div class="fln-search-panel mt-5 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm sm:p-5">
            <label for="fln-search" id="fln-search-label" class="mb-2 block text-xs font-extrabold text-slate-700"></label>
            <div class="relative"><i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-teal-700"></i><input id="fln-search" type="search" class="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"></div>
            <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><select id="fln-university-filter" class="fln-filter"></select><select id="fln-city-filter" class="fln-filter"></select><select id="fln-department-filter" class="fln-filter"></select></div>
          </div>
          <div class="mt-7 flex flex-wrap items-end justify-between gap-2"><div><p class="text-[10px] font-black uppercase tracking-[.2em] text-teal-800">ACE-USF</p><h2 id="fln-directory-heading" class="mt-1 text-xl font-black text-slate-950 sm:text-2xl"></h2></div><p id="fln-total-note" class="text-[11px] text-slate-500"></p></div>
          <div id="fln-directory" class="mt-4 grid gap-4 lg:grid-cols-2" aria-live="polite"></div>
          <footer class="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p id="fln-privacy"></p><a id="fln-report" href="mailto:info@aceusf.org?subject=ACE-USF%20directory%20update" class="inline-flex items-center gap-2 font-bold text-teal-800 underline underline-offset-4 hover:text-teal-950"><i class="fa-regular fa-flag"></i><span></span></a></footer>
        </div>
      </section>`;
    document.body.append(modal);
  }

  const style = document.createElement("style");
  style.dataset.fellowshipLeadersStyles = "true";
  style.textContent = `
    #fellowship-leaders-modal .fln-dialog { animation:fln-rise .32s cubic-bezier(.2,.75,.25,1) both; }
    #fellowship-leaders-modal .fln-topbar { background-image:radial-gradient(ellipse at 85% 0%,rgba(25,141,126,.3),transparent 38%),linear-gradient(130deg,#082c32,#0c3d43 55%,#172c42); }
    #fellowship-leaders-modal .fln-orbit { position:absolute; border:1px solid rgba(173,231,219,.16); border-radius:50%; pointer-events:none; }
    #fellowship-leaders-modal .fln-orbit-one { width:320px;height:320px;right:3%;top:-185px;box-shadow:0 0 0 28px rgba(255,255,255,.018),0 0 0 58px rgba(255,255,255,.014);animation:fln-drift 22s ease-in-out infinite alternate; }
    #fellowship-leaders-modal .fln-orbit-two { width:170px;height:170px;right:22%;top:-90px;border-color:rgba(246,190,85,.2); }
    #fellowship-leaders-modal .fln-connection-line { position:absolute;right:6%;bottom:14px;display:flex;align-items:center;gap:22px;opacity:.65; }
    #fellowship-leaders-modal .fln-connection-line::before { content:"";position:absolute;left:4px;right:4px;height:1px;background:linear-gradient(90deg,transparent,#d7b564,transparent); }
    #fellowship-leaders-modal .fln-connection-line span { position:relative;width:7px;height:7px;border:1px solid #f2d18a;border-radius:50%;background:#0f5858;box-shadow:0 0 12px rgba(242,209,138,.55); }
    #fellowship-leaders-modal .fln-filter { min-height:44px;width:100%;border:1px solid #dbe3e6;border-radius:.8rem;background:#f8fafc;padding:.65rem .8rem;font-size:.75rem;font-weight:700;color:#334155;outline:none; }
    #fellowship-leaders-modal .fln-filter:focus { border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12); }
    #fellowship-leaders-modal .fln-campus-card { border:1px solid #dce8e5;background:linear-gradient(145deg,#fff,#f8fbfa);box-shadow:0 8px 24px rgba(15,50,54,.06);transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease; }
    #fellowship-leaders-modal .fln-campus-card:hover { transform:translateY(-2px);border-color:#9bc9bd;box-shadow:0 16px 34px rgba(15,50,54,.12); }
    #fellowship-leaders-modal .fln-leader-card { border:1px solid #e7eceb;background:rgba(255,255,255,.92); }
    #fellowship-leaders-modal .fln-avatar { display:flex;width:46px;height:46px;flex:none;align-items:center;justify-content:center;overflow:hidden;border-radius:15px;background:linear-gradient(140deg,#d9eee8,#f7e8c7);color:#0f4f50;font-weight:900; }
    #fellowship-leaders-modal .fln-avatar img { width:100%;height:100%;object-fit:cover; }
    @keyframes fln-rise { from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes fln-drift { from{transform:translate(0,0)}to{transform:translate(-14px,10px)} }
    @media(prefers-reduced-motion:reduce){#fellowship-leaders-modal .fln-dialog,#fellowship-leaders-modal .fln-orbit-one{animation:none}#fellowship-leaders-modal .fln-campus-card{transition:none}}
  `;
  if (!document.querySelector("style[data-fellowship-leaders-styles]")) document.head.append(style);

  let language = currentLanguage();
  const search = modal.querySelector("#fln-search");
  const filters = {
    university: modal.querySelector("#fln-university-filter"), city: modal.querySelector("#fln-city-filter"),
    department: modal.querySelector("#fln-department-filter")
  };
  let returnFocus = null;

  function textFor(record, key) { return String(record?.[key] || "").trim(); }
  function getLeaders(record) { return Array.isArray(record.leaders) ? record.leaders : []; }
  function roleLabel(role) { return role || (language === "am" ? "የሕብረት መሪ" : "Fellowship leader"); }
  function allRecordLeaders(record) {
    return [
      ...getLeaders(record),
      ...(Array.isArray(record.branches) ? record.branches.flatMap(branch => Array.isArray(branch.leaders) ? branch.leaders : []) : [])
    ];
  }
  function filledLeaders(record) { return allRecordLeaders(record).filter(person => textFor(person, "fullName")); }

  function fillSelect(select, placeholder, values) {
    const existing = select.value;
    select.innerHTML = `<option value="">${escapeHTML(placeholder)}</option>${values.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("")}`;
    if (values.includes(existing)) select.value = existing;
  }

  function refreshFilterOptions() {
    const records = cleanRecords();
    const alpha = (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
    fillSelect(filters.university, COPY[language].university, [...new Set(records.map(item => textFor(item, "universityName")))].sort(alpha));
    fillSelect(filters.city, COPY[language].city, [...new Set(records.map(item => textFor(item, "city")).filter(Boolean))].sort(alpha));
    fillSelect(filters.department, COPY[language].department, [...new Set(records.flatMap(item => getLeaders(item).map(person => textFor(person, "department")).filter(Boolean)))].sort(alpha));
  }

  function matches(record, query) {
    const leaders = allRecordLeaders(record);
    const haystack = [record.universityName, record.city, record.fellowshipName, record.description,
      ...leaders.flatMap(person => [person.fullName, person.department, person.role, roleLabel(person.role)])]
      .join(" ").toLocaleLowerCase();
    const queryMatch = !query || haystack.includes(query);
    const universityMatch = !filters.university.value || record.universityName === filters.university.value;
    const cityMatch = !filters.city.value || record.city === filters.city.value;
    const departmentMatch = !filters.department.value || leaders.some(person => person.department === filters.department.value);
    return queryMatch && universityMatch && cityMatch && departmentMatch;
  }

  function leaderCard(record, leader, role) {
    const info = COPY[language];
    const name = textFor(leader, "fullName");
    const department = textFor(leader, "department") || info.departmentMissing;
    const intro = textFor(leader, "introduction");
    const photo = textFor(leader, "photoUrl") && leader.photoApproved === true ? safePhotoUrl(leader.photoUrl) : "";
    const initials = name ? name.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toLocaleUpperCase()).join("") : "?";
    const username = leader.telegramPublic === true ? validTelegram(leader.telegram) : "";
    const phone = leader.phonePublic === true ? validPhone(leader.phone) : null;
    const contact = username
      ? `<a class="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#168b79] px-3 py-2 text-[11px] font-extrabold text-white transition hover:bg-[#0d6b60] focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2" href="https://t.me/${encodeURIComponent(username)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-telegram text-sm"></i>${info.contact}</a>`
      : `<span class="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold text-slate-500"><i class="fa-brands fa-telegram text-slate-400"></i>${info.telegramMissing}</span>`;
    const phoneContact = phone ? `<a class="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-[11px] font-extrabold text-teal-900 hover:bg-teal-100" href="tel:${escapeHTML(phone.tel)}"><i class="fa-solid fa-phone"></i>${escapeHTML(phone.display)}</a>` : "";
    return `<article class="fln-leader-card rounded-2xl p-3 sm:p-4"><div class="flex items-start gap-3"><div class="fln-avatar" aria-hidden="true">${photo ? `<img src="${escapeHTML(photo)}" alt="" loading="lazy">` : escapeHTML(initials)}</div><div class="min-w-0 flex-1"><span class="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-amber-900">${escapeHTML(roleLabel(role))}</span><h4 class="mt-2 text-sm font-extrabold text-slate-900">${escapeHTML(name || info.nameMissing)}</h4><p class="mt-1 text-[11px] text-slate-600"><i class="fa-solid fa-graduation-cap mr-1 text-teal-700"></i>${escapeHTML(department)}</p>${intro ? `<p class="mt-2 text-xs leading-5 text-slate-600">${escapeHTML(intro)}</p>` : ""}${contact}${phoneContact}</div></div></article>`;
  }

  function renderBranches(record) {
    if (!Array.isArray(record.branches) || !record.branches.length) return "";
    const rows = record.branches.map(branch => {
      const people = (Array.isArray(branch.leaders) ? branch.leaders : []).map(person => {
        const phone = person.phonePublic === true ? validPhone(person.phone) : null;
        return `<li class="py-1.5 text-xs text-slate-700">${escapeHTML(person.fullName || "Leader details pending")}${phone ? ` <a class="ml-2 font-bold text-teal-800 underline" href="tel:${escapeHTML(phone.tel)}">${escapeHTML(phone.display)}</a>` : ""}</li>`;
      }).join("");
      return `<article class="rounded-xl border border-slate-200 bg-white p-3"><h4 class="text-xs font-black text-slate-900">${escapeHTML(branch.name || "University branch")}</h4><ul class="mt-1 divide-y divide-slate-100">${people}</ul></article>`;
    }).join("");
    return `<section class="mt-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-4"><h4 class="mb-2 text-sm font-black text-teal-950"><i class="fa-solid fa-code-branch mr-2"></i>University branches and leaders</h4><div class="grid gap-2 sm:grid-cols-2">${rows}</div></section>`;
  }

  function renderChurchContact(record) {
    const priest = record.churchPriest || {};
    if (!priest.name && !priest.phone) return "";
    const phone = priest.phonePublic === true ? validPhone(priest.phone) : null;
    return `<section class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4"><span><span class="block text-[9px] font-black uppercase tracking-wider text-amber-800">Church priest / chaplain</span><strong class="mt-1 block text-sm text-slate-900">${escapeHTML(priest.name || "Name not provided")}</strong></span>${phone ? `<a class="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-800 px-3 py-2 text-xs font-extrabold text-white" href="tel:${escapeHTML(phone.tel)}"><i class="fa-solid fa-phone"></i>${escapeHTML(phone.display)}</a>` : ""}</section>`;
  }

  function campusCard(record) {
    const info = COPY[language];
    const leaders = getLeaders(record);
    const matchingPeople = leaders.filter(person => {
      const q = search.value.trim().toLocaleLowerCase();
      const selectedDept = filters.department.value;
      const deptMatches = !selectedDept || person.department === selectedDept;
      const personWords = [person.fullName, person.department, person.role, roleLabel(person.role), person.introduction].join(" ").toLocaleLowerCase();
      const personQueryMatches = !q || personWords.includes(q) || [record.universityName, record.city, record.fellowshipName].join(" ").toLocaleLowerCase().includes(q);
      return deptMatches && personQueryMatches;
    });
    const cardId = `fln-campus-${String(record.id || record.universityName).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    const roleCards = !record.branches?.length && matchingPeople.length
      ? `<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">${matchingPeople.map(person => leaderCard(record, person, person.role || "")).join("")}</div>`
      : "";
    return `<details class="fln-campus-card group overflow-hidden rounded-2xl"><summary class="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5"><span class="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-teal-50 text-lg text-teal-800"><i class="fa-solid fa-building-columns"></i></span><span class="min-w-0 flex-1"><span class="block text-base font-black text-slate-950 sm:text-lg">${escapeHTML(record.universityName)}</span><span class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500"><span><i class="fa-solid fa-location-dot mr-1 text-amber-700"></i>${escapeHTML(record.city || info.location)}</span>${record.fellowshipName ? `<span><i class="fa-solid fa-people-group mr-1 text-teal-700"></i>${escapeHTML(record.fellowshipName)}</span>` : ""}</span></span><span class="ml-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-open:rotate-180"><i class="fa-solid fa-chevron-down text-xs"></i></span></summary><div id="${escapeHTML(cardId)}" class="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">${record.description ? `<p class="mb-3 text-xs leading-5 text-slate-600">${escapeHTML(record.description)}</p>` : ""}${roleCards}${renderBranches(record)}${renderChurchContact(record)}</div></details>`;
  }

  function render() {
    const info = COPY[language];
    const records = cleanRecords();
    const publishedLeaders = records.flatMap(filledLeaders);
    const cities = new Set(records.map(item => textFor(item, "city")).filter(Boolean));
    const result = records.filter(record => matches(record, search.value.trim().toLocaleLowerCase()));
    modal.querySelector("#fln-eyebrow").textContent = info.eyebrow;
    modal.querySelector("#fln-title").textContent = info.title;
    modal.querySelector("#fln-intro").textContent = info.intro;
    modal.querySelector("#fln-search-label").textContent = info.searchLabel;
    search.placeholder = info.search;
    modal.querySelector("#fln-directory-heading").textContent = info.directory;
    modal.querySelector("#fln-total-note").textContent = info.totalNote;
    modal.querySelector("#fln-privacy").textContent = info.privacy;
    modal.querySelector("#fln-report span").textContent = info.report;
    modal.querySelector("#fln-close").setAttribute("aria-label", info.close);
    const stats = [
      ["fa-building-columns", records.length, info.universities, "teal"],
      ["fa-user-group", publishedLeaders.length, info.leaders, "amber"],
      ["fa-location-dot", cities.size, info.cities, "blue"]
    ];
    modal.querySelector("#fln-stats").innerHTML = stats.map(([icon, count, label, tone]) => `<article class="flex items-center gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-sm"><span class="flex h-10 w-10 items-center justify-center rounded-xl ${tone === "amber" ? "bg-amber-50 text-amber-800" : tone === "blue" ? "bg-sky-50 text-sky-800" : "bg-teal-50 text-teal-800"}"><i class="fa-solid ${icon}"></i></span><span><strong class="block text-xl font-black leading-none text-slate-900">${count}</strong><span class="mt-1 block text-[10px] font-bold leading-4 text-slate-500">${escapeHTML(label)}</span></span></article>`).join("");
    refreshFilterOptions();
    const directory = modal.querySelector("#fln-directory");
    if (!records.length) {
      directory.innerHTML = `<section class="col-span-full rounded-3xl border border-dashed border-teal-200 bg-white px-6 py-10 text-center shadow-sm"><span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-800"><i class="fa-solid fa-people-group"></i></span><h3 class="mt-4 text-lg font-black text-slate-900">${escapeHTML(info.emptyTitle)}</h3><p class="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">${escapeHTML(info.empty)}</p><p class="mt-4 text-xs font-semibold text-slate-500">${escapeHTML(info.privacy)}</p></section>`;
    } else if (!result.length) {
      directory.innerHTML = `<p class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-600">${escapeHTML(info.noResults)}</p>`;
    } else {
      directory.innerHTML = result.map(campusCard).join("");
    }
  }

  function open() {
    returnFocus = document.activeElement;
    language = currentLanguage();
    render();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    modal.querySelector("#fln-close").focus();
  }
  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  }

  let leadersLink = nav?.querySelector("#nav-fellowship-leaders");
  if (nav && !leadersLink) {
    leadersLink = document.createElement("a");
    leadersLink.id = "nav-fellowship-leaders";
    leadersLink.href = "#fellowship-leaders";
    leadersLink.className = "hover:text-amber-400 transition flex items-center gap-1.5 py-1 lang-text-fellowship";
    leadersLink.innerHTML = '<i class="fa-solid fa-people-group text-amber-500" aria-hidden="true"></i><span></span>';
    nav.append(leadersLink);
  }
  modal.querySelector("#fln-close").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.classList.contains("hidden")) close(); });
  search.addEventListener("input", render);
  Object.values(filters).forEach(select => select.addEventListener("change", render));
  window.addEventListener("ace:language-change", event => {
    language = event.detail?.language === "am" ? "am" : "en";
    if (!modal.classList.contains("hidden")) render();
    const label = nav?.querySelector("#nav-fellowship-leaders span");
    if (label) label.textContent = COPY[language].nav;
  });
  const label = nav?.querySelector("#nav-fellowship-leaders span");
  if (label) label.textContent = COPY[language].nav;
}

export function renderFellowshipLeadersSection() {
  setupFellowshipLeadersSection();
  const modal = document.getElementById("fellowship-leaders-modal");
  const close = modal?.querySelector("#fln-close");
  if (!modal || !close) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("overflow-hidden");
  close.focus();
}
