// ACE-USF top-navigation Fellowship Leaders room.
// Uses verified public records from fellowship_leaders_data.js and fetches live
// weather only when a campus card is opened and verified coordinates are present.
import { fellowshipUniversityRecords, watchFellowshipUniversityRecords } from "./fellowship_leaders_data.js";

const ROLES = ["Astebabari", "Genzeb Yazh", "Tsehafi"];
const ROLE_TITLE = {
  Astebabari: "Coordinator አስተባባሪ",
  "Genzeb Yazh": "Treasurer ገንዘብ ያዥ",
  Tsehafi: "Secretary ጸሐፊ"
};
const weatherCache = new Map();
let visibilitySnapshot = [];
let focusReturn = null;
let selectedYear = "";
let currentQuery = "";
let currentCity = "";

const WORDS = {
  en: {
    eyebrow: "ACE-USF · UNITED IN FAITH, SERVICE & LEADERSHIP",
    title: "Meet the people serving your campus fellowship.",
    intro: "Explore current campus teams, connect with leaders, learn about their university community, and follow each fellowship’s leadership journey year by year.",
    campuses: "Campus fellowships", members: "Active fellowship members", leaders: "Current leaders", cities: "Cities represented",
    search: "Search university, city, leader, department, or role…", city: "All campus cities", year: "All leadership years",
    directory: "Campus fellowship directory", records: "Verified campus records", emptyTitle: "Campus profiles are being prepared",
    empty: "Verified fellowship and leadership information will appear here as campuses share their approved records.",
    noResults: "No campus matches your search or filters. Try a different term.",
    membersCount: "Active members", currentTeam: "Current leadership team", serviceHistory: "Leadership service history",
    campusWeather: "Campus weather now", weatherLoading: "Checking current conditions…", weatherUnavailable: "Weather is unavailable right now.",
    weatherLocation: "Verified campus coordinates are needed for local weather.", temperature: "Temperature", feelsLike: "Feels like", humidity: "Humidity", wind: "Wind",
    weatherAttribution: "Weather data by Open-Meteo", updated: "Updated", contact: "Contact on Telegram", contactUnavailable: "Public Telegram contact not listed",
    department: "Department", elected: "Elected", term: "Service term", serviceYear: "Year", of: "of", current: "Current team", previous: "Previous team",
    profile: "Leader profile", profileEmpty: "No profile summary has been added.", locationMissing: "Campus location not provided", membersMissing: "Member count not reported",
    termMissing: "Term dates not listed", leadersMissing: "No current leaders have been published for this campus yet.", historyMissing: "No earlier leadership years have been published yet.",
    transition: "Each new election can be added as a new service year. Previous teams remain in this history.",
    back: "Back to portal", privacy: "Profiles and contact details are shown only with approval to publish. Campus counts and election records should be verified by the fellowship.",
    report: "Report an update", reportSubject: "ACE-USF Fellowship Leaders update", loadError: "Weather could not be loaded. Try again later.",
    role: "Role", searchLabel: "Search leaders and campuses"
  },
  am: {
    eyebrow: "ACE-USF · በእምነት፣ በአገልግሎትና በአመራር አንድ ነን",
    title: "በግቢያችሁ የሚያገለግሉ መሪዎችን ያግኙ።",
    intro: "የአሁኑን የግቢ ቡድኖች ይመልከቱ፣ ከመሪዎች ጋር ይገናኙ፣ ስለ ዩኒቨርሲቲ ማኅበረሰባቸው ይወቁ፣ እና የአመራር ታሪኩን በዓመት ይከታተሉ።",
    campuses: "የግቢ ሕብረቶች", members: "ንቁ የሕብረት አባላት", leaders: "የአሁኑ መሪዎች", cities: "የተወከሉ ከተሞች",
    search: "ዩኒቨርሲቲ፣ ከተማ፣ መሪ፣ ዲፓርትመንት ወይም ሚና ይፈልጉ…", city: "ሁሉም ከተሞች", year: "ሁሉም የአመራር ዓመታት",
    directory: "የግቢ ሕብረት ማውጫ", records: "የተረጋገጡ የግቢ መረጃዎች", emptyTitle: "የግቢ መረጃዎች በዝግጅት ላይ ናቸው",
    empty: "የተረጋገጡ የሕብረትና የአመራር መረጃዎች ከግቢዎች ፈቃድ ጋር ሲደርሱ እዚህ ይታያሉ።",
    noResults: "ከፍለጋው ወይም ከማጣሪያው ጋር የሚዛመድ ግቢ አልተገኘም። ሌላ ቃል ይሞክሩ።",
    membersCount: "ንቁ አባላት", currentTeam: "የአሁኑ የአመራር ቡድን", serviceHistory: "የአመራር አገልግሎት ታሪክ",
    campusWeather: "የአሁኑ የግቢ የአየር ሁኔታ", weatherLoading: "የአሁኑ ሁኔታ እየተፈተሸ ነው…", weatherUnavailable: "የአየር ሁኔታ መረጃ አሁን አልተገኘም።",
    weatherLocation: "የአየር ሁኔታ ለማሳየት የተረጋገጠ የግቢ አቅጣጫ ያስፈልጋል።",
    temperature: "የአየር ሙቀት", feelsLike: "የሚሰማው", humidity: "እርጥበት", wind: "ነፋስ", weatherAttribution: "የአየር መረጃ፦ Open-Meteo", updated: "የተዘመነበት",
    contact: "በቴሌግራም ያግኙ", contactUnavailable: "ይፋዊ የቴሌግራም መረጃ አልተዘረዘረም", department: "ዲፓርትመንት", elected: "የተመረጠበት ዓመት",
    term: "የአገልግሎት ዘመን", serviceYear: "ዓመት", of: "ከ", current: "የአሁኑ ቡድን", previous: "የቀድሞ ቡድን", profile: "የመሪ መገለጫ", profileEmpty: "የመሪ መግለጫ አልተጨመረም።",
    locationMissing: "የግቢ ቦታ አልተገለጸም", membersMissing: "የአባላት ብዛት አልተዘገበም", termMissing: "የአገልግሎት ቀናት አልተዘረዘሩም",
    leadersMissing: "ለዚህ ግቢ የአሁኑ መሪዎች ገና አልታተሙም።", historyMissing: "ያለፉ የአመራር ዓመታት ገና አልታተሙም።",
    transition: "ከእያንዳንዱ አዲስ ምርጫ በኋላ አዲሱ ዓመት ይጨመራል። ያለፉ ቡድኖች በዚህ ታሪክ ውስጥ ይቆያሉ።",
    back: "ወደ ዋና ገጽ", privacy: "የመሪዎች መገለጫና መገኛ የሚታተሙት ፈቃድ ሲኖር ብቻ ነው። የአባላት ብዛትና የምርጫ መረጃ በሕብረቱ መረጋገጥ አለበት።",
    report: "ማሻሻያ ያሳውቁ", reportSubject: "ACE-USF የሕብረት መሪዎች ማሻሻያ", loadError: "የአየር ሁኔታ መረጃ ሊጫን አልቻለም። በኋላ ይሞክሩ።",
    role: "ሚና", searchLabel: "መሪዎችንና ግቢዎችን ይፈልጉ"
  }
};

function language() {
  return document.getElementById("lang-am-btn")?.classList.contains("bg-amber-500") ? "am" : "en";
}
function t(key) { return WORDS[language()][key] || WORDS.en[key] || key; }
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function textNode(tag, classes, value) {
  const node = document.createElement(tag);
  if (classes) node.className = classes;
  node.textContent = value ?? "";
  return node;
}
function icon(name, classes = "") {
  const node = document.createElement("i");
  node.className = `${name} ${classes}`.trim();
  node.setAttribute("aria-hidden", "true");
  return node;
}
function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function records() {
  return (Array.isArray(fellowshipUniversityRecords) ? fellowshipUniversityRecords : [])
    .filter(row => row && row.active !== false && String(row.universityName || "").trim());
}
function currentLeaders(row) { return Array.isArray(row.leaders) ? row.leaders : []; }
function leadershipTerms(row) {
  const legacy = Array.isArray(row.leadershipHistory) ? row.leadershipHistory : [];
  return [...legacy].filter(term => term && (term.academicYear || term.year)).sort((a, b) => String(b.academicYear || b.year).localeCompare(String(a.academicYear || a.year), undefined, { numeric: true }));
}
function allSearchableWords(row) {
  const people = [...currentLeaders(row), ...leadershipTerms(row).flatMap(term => term.leaders || [])];
  return [row.universityName, row.city, row.fellowshipName, row.description, ...leadershipTerms(row).map(term => term.academicYear || term.year), ...people.flatMap(person => [person.fullName, person.department, ROLE_TITLE[person.role], person.introduction, person.electedYear, person.termStartYear, person.termEndYear])].join(" ").toLocaleLowerCase();
}

export function setupFellowshipLeadersRoom() {
  const room = document.getElementById("fellowship-leaders-room-view");
  if (!room || room.dataset.ready === "true") return;
  room.dataset.ready = "true";
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isLeadersRoomOpen()) closeFellowshipLeadersRoom();
  });
  window.addEventListener("ace:language-change", () => {
    if (isLeadersRoomOpen()) renderRoom();
    updateStaticHeader();
  });
  watchFellowshipUniversityRecords(() => {
    if (isLeadersRoomOpen()) renderRoom();
  }, error => console.error("Could not load published fellowship records:", error));
  document.getElementById("leaders-room-close")?.addEventListener("click", closeFellowshipLeadersRoom);
  updateStaticHeader();
}

function updateStaticHeader() {
  const title = document.getElementById("leaders-room-title");
  const subtitle = document.getElementById("leaders-room-subtitle");
  const close = document.getElementById("leaders-room-close");
  if (title) title.textContent = language() === "am" ? "የሕብረት መሪዎች አውታረ መረብ" : "Fellowship Leaders Network";
  if (subtitle) subtitle.textContent = language() === "am" ? "የግቢ ቡድኖች፣ የመሪ መገለጫዎች፣ የአየር ሁኔታና የአገልግሎት ታሪክ።" : "Campus teams, profiles, live weather, and service history.";
  if (close) {
    close.setAttribute("aria-label", t("back"));
    const label = close.querySelector("span");
    if (label) label.textContent = t("back");
  }
}

function handleClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (target.closest("#leaders-room-close")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeFellowshipLeadersRoom();
    return;
  }
  const trigger = target.closest("[data-open-fellowship-leaders-top]");
  if (trigger) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openFellowshipLeadersRoom(trigger);
    return;
  }
  if (isLeadersRoomOpen() && target.closest("a")) closeFellowshipLeadersRoom();
}

function openFellowshipLeadersRoom(trigger) {
  const room = document.getElementById("fellowship-leaders-room-view");
  const slot = document.getElementById("fellowship-leaders-room-home-slot");
  if (!room || !slot || isLeadersRoomOpen()) return;
  focusReturn = trigger instanceof HTMLElement ? trigger : document.activeElement;
  const homeSurface = ["portal-home", "about-section", "personalized-greeting", "app-dashboard"]
    .map(id => document.getElementById(id)).filter(Boolean);
  visibilitySnapshot = homeSurface.map(element => ({
    element,
    wasHidden: element.classList.contains("hidden"),
    ariaHidden: element.getAttribute("aria-hidden")
  }));
  homeSurface.forEach(element => {
    element.classList.add("hidden");
    element.setAttribute("aria-hidden", "true");
  });
  room.classList.remove("hidden");
  room.setAttribute("aria-hidden", "false");
  renderRoom();
  document.getElementById("leaders-room-close")?.focus();
  room.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export function closeFellowshipLeadersRoom() {
  const room = document.getElementById("fellowship-leaders-room-view");
  const content = document.getElementById("leaders-room-content");
  if (!room || !content || !isLeadersRoomOpen()) return;
  content.replaceChildren();
  room.classList.add("hidden");
  room.setAttribute("aria-hidden", "true");
  visibilitySnapshot.forEach(({ element, wasHidden, ariaHidden }) => {
    element.classList.toggle("hidden", wasHidden);
    if (ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", ariaHidden);
  });
  visibilitySnapshot = [];
  if (focusReturn instanceof HTMLElement) focusReturn.focus();
  focusReturn = null;
}

export function isLeadersRoomOpen() {
  return document.getElementById("fellowship-leaders-room-view")?.classList.contains("hidden") === false;
}

function renderRoom() {
  const host = document.getElementById("leaders-room-content");
  if (!host) return;
  updateStaticHeader();
  host.replaceChildren();
  const page = document.createElement("div");
  page.className = "space-y-5 sm:space-y-6";
  page.append(buildHero(), buildStats(), buildDirectory());
  const footer = document.createElement("footer");
  footer.className = "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-[10px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5";
  footer.append(textNode("p", "max-w-4xl", t("privacy")));
  const report = document.createElement("a");
  report.className = "inline-flex shrink-0 items-center gap-2 font-extrabold text-teal-800 underline underline-offset-4 hover:text-teal-950";
  report.href = `mailto:info@aceusf.org?subject=${encodeURIComponent(t("reportSubject"))}`;
  report.append(icon("fa-regular fa-flag"), document.createTextNode(t("report")));
  footer.append(report);
  page.append(footer);
  host.append(page);
}

function buildHero() {
  const section = document.createElement("section");
  section.className = "relative isolate overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 px-5 py-8 text-white shadow-xl sm:px-8 sm:py-10";
  section.setAttribute("aria-labelledby", "leaders-hero-title");
  const glow = document.createElement("div");
  glow.className = "pointer-events-none absolute -right-12 -top-20 -z-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl";
  const glow2 = document.createElement("div");
  glow2.className = "pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-60 w-60 rounded-full bg-teal-300/15 blur-3xl";
  const content = document.createElement("div");
  content.className = "relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end";
  const copy = document.createElement("div");
  copy.className = "max-w-4xl";
  const eyebrow = document.createElement("p");
  eyebrow.className = "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-amber-200";
  eyebrow.append(icon("fa-solid fa-sparkles"), document.createTextNode(t("eyebrow")));
  copy.append(eyebrow, textNode("h1", "mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl", t("title")), textNode("p", "mt-4 max-w-3xl text-sm leading-6 text-teal-50/90 sm:text-base sm:leading-7", t("intro")));
  const stamp = document.createElement("div");
  stamp.className = "flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm";
  const stampIcon = document.createElement("span");
  stampIcon.className = "flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-xl text-amber-200";
  stampIcon.append(icon("fa-solid fa-hands-praying"));
  const stampCopy = document.createElement("div");
  stampCopy.append(textNode("p", "text-[9px] font-black uppercase tracking-[.16em] text-amber-200", "ACE-USF"), textNode("p", "mt-1 text-xs font-bold text-white", "One fellowship across campuses"));
  stamp.append(stampIcon, stampCopy);
  content.append(copy, stamp);
  section.append(glow, glow2, content);
  return section;
}

function buildStats() {
  const list = records();
  const memberValues = list.map(row => safeNumber(row.activeMembers));
  const memberTotal = memberValues.reduce((sum, value) => sum + (value || 0), 0);
  const memberCountComplete = memberValues.length > 0 && memberValues.every(value => value !== null);
  const leadersTotal = list.reduce((sum, row) => sum + currentLeaders(row).filter(person => person?.fullName).length, 0);
  const cities = new Set(list.map(row => String(row.city || "").trim()).filter(Boolean));
  const stats = document.createElement("section");
  stats.className = "grid grid-cols-2 gap-3 lg:grid-cols-4";
  stats.setAttribute("aria-label", "Fellowship network statistics");
  stats.append(
    statCard(list.length ? String(list.length) : "—", t("campuses"), "fa-solid fa-building-columns", "teal"),
    statCard(memberCountComplete ? memberTotal.toLocaleString() : "—", t("members"), "fa-solid fa-people-group", "amber"),
    statCard(list.length ? String(leadersTotal) : "—", t("leaders"), "fa-solid fa-user-tie", "blue"),
    statCard(cities.size ? String(cities.size) : "—", t("cities"), "fa-solid fa-location-dot", "purple")
  );
  return stats;
}

function statCard(value, label, glyph, tone) {
  const palette = { teal: "bg-teal-50 text-teal-800", amber: "bg-amber-50 text-amber-800", blue: "bg-blue-50 text-blue-800", purple: "bg-purple-50 text-purple-800" }[tone];
  const item = document.createElement("article");
  item.className = "flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4";
  const tile = document.createElement("span");
  tile.className = `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${palette}`;
  tile.append(icon(glyph));
  const copy = document.createElement("div");
  copy.className = "min-w-0";
  copy.append(textNode("p", "text-xl font-black leading-none text-slate-950 sm:text-2xl", value), textNode("p", "mt-1 truncate text-[9px] font-bold leading-4 text-slate-500 sm:text-[10px]", label));
  item.append(tile, copy);
  return item;
}

function buildDirectory() {
  const shell = document.createElement("section");
  shell.className = "rounded-3xl border border-slate-200 bg-slate-50/70 p-3.5 shadow-sm sm:p-5";
  const heading = document.createElement("div");
  heading.className = "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between";
  heading.append(textNode("div", "text-[9px] font-black uppercase tracking-[.18em] text-teal-800", t("records")), textNode("h2", "text-xl font-black text-slate-950 sm:text-2xl", t("directory")));
  const filterPanel = document.createElement("div");
  filterPanel.className = "mt-4 grid gap-2 rounded-2xl border border-teal-100 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(11rem,.45fr)_minmax(11rem,.45fr)] sm:p-4";
  const searchWrap = document.createElement("label");
  searchWrap.className = "relative block";
  searchWrap.append(icon("fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-700"));
  const search = document.createElement("input");
  search.type = "search";
  search.className = "min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10";
  search.placeholder = t("search");
  search.setAttribute("aria-label", t("searchLabel"));
  search.value = currentQuery;
  searchWrap.append(search);
  const citySelect = selectControl(t("city"));
  const yearSelect = selectControl(t("year"));
  fillOptions(citySelect, t("city"), [...new Set(records().map(row => row.city).filter(Boolean))].sort());
  fillOptions(yearSelect, t("year"), [...new Set(records().flatMap(row => [
    ...currentLeaders(row).flatMap(person => [person.termStartYear, person.electedYear]),
    ...leadershipTerms(row).map(term => term.academicYear || term.year)
  ]).filter(Boolean).map(String))].sort().reverse());
  citySelect.value = currentCity;
  yearSelect.value = selectedYear;
  filterPanel.append(searchWrap, citySelect, yearSelect);
  const results = document.createElement("div");
  results.className = "mt-4 grid items-start gap-4 xl:grid-cols-2";
  results.id = "leaders-campus-results";
  const empty = document.createElement("div");
  empty.className = "mt-4 rounded-3xl border border-dashed border-teal-200 bg-white px-5 py-10 text-center shadow-sm";
  const emptyIcon = document.createElement("span");
  emptyIcon.className = "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-800";
  emptyIcon.append(icon("fa-solid fa-building-circle-check"));
  empty.append(emptyIcon, textNode("h3", "mt-4 text-lg font-black text-slate-900", t("emptyTitle")), textNode("p", "mx-auto mt-2 max-w-2xl text-xs leading-6 text-slate-600", t("empty")));
  shell.append(heading, filterPanel, results, empty);
  const draw = () => {
    const all = records();
    const year = yearSelect.value;
    const matches = all.filter(row => {
      const cityMatch = !citySelect.value || row.city === citySelect.value;
      const searchMatch = !currentQuery.trim() || allSearchableWords(row).includes(currentQuery.toLocaleLowerCase().trim());
      const yearMatch = !year || currentLeaders(row).some(person => String(person.termStartYear || person.electedYear || "") === year) || leadershipTerms(row).some(term => String(term.academicYear || term.year) === year);
      return cityMatch && searchMatch && yearMatch;
    });
    results.replaceChildren(...matches.map(buildCampusCard));
    results.classList.toggle("hidden", !matches.length);
    empty.classList.toggle("hidden", matches.length > 0);
    if (all.length && !matches.length) {
      empty.querySelector("h3").textContent = t("noResults");
      empty.querySelector("p").textContent = "";
      emptyIcon.classList.add("hidden");
    } else {
      empty.querySelector("h3").textContent = t("emptyTitle");
      empty.querySelector("p").textContent = t("empty");
      emptyIcon.classList.remove("hidden");
    }
  };
  search.addEventListener("input", () => { currentQuery = search.value; draw(); });
  citySelect.addEventListener("change", () => { currentCity = citySelect.value; draw(); });
  yearSelect.addEventListener("change", () => { selectedYear = yearSelect.value; draw(); });
  draw();
  return shell;
}

function selectControl(label) {
  const select = document.createElement("select");
  select.className = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";
  select.setAttribute("aria-label", label);
  return select;
}
function fillOptions(select, first, values) {
  select.replaceChildren(new Option(first, ""), ...values.map(value => new Option(String(value), String(value))));
}

function buildCampusCard(row) {
  const details = document.createElement("details");
  details.className = "group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md";
  const summary = document.createElement("summary");
  summary.className = "flex cursor-pointer list-none items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 sm:gap-4 sm:p-5";
  const emblem = document.createElement("span");
  emblem.className = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 text-lg text-teal-900";
  emblem.append(icon("fa-solid fa-building-columns"));
  const name = document.createElement("span");
  name.className = "min-w-0 flex-1";
  name.append(textNode("span", "block truncate text-sm font-black text-slate-950 sm:text-base", row.universityName), textNode("span", "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500", row.city || t("locationMissing")));
  const badges = document.createElement("span");
  badges.className = "hidden shrink-0 flex-col items-end gap-1 sm:flex";
  const memberCount = safeNumber(row.activeMembers);
  badges.append(textNode("span", "rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-900", memberCount === null ? t("membersMissing") : `${memberCount.toLocaleString()} ${t("membersCount")}`));
  const chevron = document.createElement("span");
  chevron.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-open:rotate-180";
  chevron.append(icon("fa-solid fa-chevron-down text-xs"));
  summary.append(emblem, name, badges, chevron);
  const body = document.createElement("div");
  body.className = "border-t border-slate-100 p-4 sm:p-5";
  body.append(buildCampusOverview(row));
  const weather = buildWeatherPanel(row);
  body.append(weather);
  body.append(buildLeaderRoster(row), buildHistory(row));
  details.append(summary, body);
  details.addEventListener("toggle", () => {
    if (details.open) loadWeather(row, weather);
  });
  return details;
}

function buildCampusOverview(row) {
  const overview = document.createElement("div");
  overview.className = "grid gap-3 sm:grid-cols-3";
  const active = safeNumber(row.activeMembers);
  overview.append(
    miniMetric("fa-solid fa-people-group", t("membersCount"), active === null ? t("membersMissing") : active.toLocaleString(), "emerald"),
    miniMetric("fa-solid fa-location-dot", t("location"), row.city || t("locationMissing"), "amber"),
    miniMetric("fa-solid fa-calendar-check", t("current"), termSummary(currentLeaders(row)), "blue")
  );
  if (row.description) overview.append(textNode("p", "sm:col-span-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600", row.description));
  return overview;
}

function miniMetric(glyph, label, value, tone) {
  const colors = { emerald: "bg-emerald-50 text-emerald-800", amber: "bg-amber-50 text-amber-800", blue: "bg-blue-50 text-blue-800" }[tone];
  const block = document.createElement("div");
  block.className = "flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3";
  const iconBox = document.createElement("span");
  iconBox.className = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors}`;
  iconBox.append(icon(glyph));
  const words = document.createElement("span");
  words.className = "min-w-0";
  words.append(textNode("span", "block text-[9px] font-bold uppercase tracking-wide text-slate-500", label), textNode("span", "mt-0.5 block truncate text-[11px] font-extrabold text-slate-800", value));
  block.append(iconBox, words);
  return block;
}

function termSummary(people) {
  const terms = people.map(person => person.termStartYear || person.electedYear).filter(Boolean).map(String);
  return terms.length ? [...new Set(terms)].sort().join("–") : t("termMissing");
}

function buildWeatherPanel(row) {
  const panel = document.createElement("section");
  panel.className = "mt-4 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4";
  panel.dataset.weatherLoaded = "false";
  panel.dataset.weatherKey = String(row.id || row.universityName);
  const head = document.createElement("div");
  head.className = "flex items-center justify-between gap-2";
  const title = document.createElement("h4");
  title.className = "flex items-center gap-2 text-xs font-black text-slate-900";
  title.append(icon("fa-solid fa-cloud-sun text-sky-700"), document.createTextNode(t("campusWeather")));
  const source = document.createElement("a");
  source.href = "https://open-meteo.com/";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.className = "text-[9px] font-bold text-sky-800 underline underline-offset-2";
  source.textContent = t("weatherAttribution");
  head.append(title, source);
  const content = textNode("p", "mt-3 text-[11px] text-slate-500", t("weatherLoading"));
  content.dataset.weatherContent = "true";
  panel.append(head, content);
  return panel;
}

async function loadWeather(row, panel) {
  if (panel.dataset.weatherLoaded === "true") return;
  panel.dataset.weatherLoaded = "true";
  const content = panel.querySelector("[data-weather-content]");
  const latitude = safeNumber(row.latitude);
  const longitude = safeNumber(row.longitude);
  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    content.textContent = t("weatherLocation");
    return;
  }
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  try {
    let data = weatherCache.get(key);
    if (!data || Date.now() - data.savedAt > 15 * 60 * 1000) {
      const params = new URLSearchParams({
        latitude: String(latitude), longitude: String(longitude),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        timezone: "auto"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
      const payload = await response.json();
      if (!payload.current) throw new Error("Weather response has no current conditions");
      data = { savedAt: Date.now(), current: payload.current, units: payload.current_units || {} };
      weatherCache.set(key, data);
    }
    if (!content.isConnected) return;
    renderWeather(content, data);
  } catch (error) {
    if (!content.isConnected) return;
    content.replaceChildren(textNode("span", "text-[11px] text-slate-500", t("loadError")));
    console.info("Campus weather unavailable:", error.message);
  }
}

function renderWeather(content, data) {
  const current = data.current;
  const condition = describeWeather(current.weather_code);
  content.className = "mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center";
  const main = document.createElement("div");
  main.className = "flex items-center gap-3";
  const glyph = document.createElement("span");
  glyph.className = "flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-sky-700 shadow-sm";
  glyph.append(icon(condition.icon));
  const degrees = textNode("p", "text-2xl font-black leading-none text-slate-950", `${Math.round(current.temperature_2m)}°C`);
  const details = document.createElement("div");
  details.append(textNode("p", "text-xs font-extrabold text-slate-900", condition.label), textNode("p", "mt-1 text-[10px] text-slate-500", `${t("feelsLike")} ${Math.round(current.apparent_temperature)}°C`));
  main.append(glyph, degrees, details);
  const metrics = document.createElement("div");
  metrics.className = "grid grid-cols-2 gap-2";
  metrics.append(weatherMetric("fa-solid fa-droplet", t("humidity"), `${current.relative_humidity_2m}%`), weatherMetric("fa-solid fa-wind", t("wind"), `${Math.round(current.wind_speed_10m)} ${data.units.wind_speed_10m || "km/h"}`));
  content.replaceChildren(main, metrics);
  if (current.time) {
    const time = document.createElement("p");
    time.className = "text-[9px] text-slate-500 sm:col-span-2";
    const date = new Date(current.time);
    time.textContent = `${t("updated")}: ${Number.isNaN(date.getTime()) ? current.time : date.toLocaleString()}`;
    content.append(time);
  }
}

function weatherMetric(glyph, label, value) {
  const item = document.createElement("span");
  item.className = "rounded-xl border border-white bg-white/90 px-3 py-2 shadow-sm";
  item.append(textNode("span", "block text-[9px] font-bold text-slate-500", label), textNode("span", "mt-0.5 flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800", `${value}`));
  item.querySelector("span:last-child").prepend(icon(glyph, "text-sky-700"));
  return item;
}

function describeWeather(code) {
  const map = {
    0: ["Clear sky", "fa-solid fa-sun"], 1: ["Mainly clear", "fa-solid fa-sun"], 2: ["Partly cloudy", "fa-solid fa-cloud-sun"], 3: ["Overcast", "fa-solid fa-cloud"],
    45: ["Fog", "fa-solid fa-smog"], 48: ["Rime fog", "fa-solid fa-smog"], 51: ["Light drizzle", "fa-solid fa-cloud-rain"], 53: ["Drizzle", "fa-solid fa-cloud-rain"], 55: ["Dense drizzle", "fa-solid fa-cloud-rain"],
    56: ["Freezing drizzle", "fa-solid fa-cloud-rain"], 57: ["Freezing drizzle", "fa-solid fa-cloud-rain"], 61: ["Light rain", "fa-solid fa-cloud-rain"], 63: ["Rain", "fa-solid fa-cloud-rain"], 65: ["Heavy rain", "fa-solid fa-cloud-showers-heavy"],
    66: ["Freezing rain", "fa-solid fa-cloud-rain"], 67: ["Freezing rain", "fa-solid fa-cloud-rain"], 71: ["Light snow", "fa-solid fa-snowflake"], 73: ["Snow", "fa-solid fa-snowflake"], 75: ["Heavy snow", "fa-solid fa-snowflake"], 77: ["Snow grains", "fa-solid fa-snowflake"],
    80: ["Rain showers", "fa-solid fa-cloud-showers-heavy"], 81: ["Rain showers", "fa-solid fa-cloud-showers-heavy"], 82: ["Heavy showers", "fa-solid fa-cloud-showers-heavy"], 85: ["Snow showers", "fa-solid fa-snowflake"], 86: ["Heavy snow showers", "fa-solid fa-snowflake"],
    95: ["Thunderstorm", "fa-solid fa-cloud-bolt"], 96: ["Thunderstorm with hail", "fa-solid fa-cloud-bolt"], 99: ["Thunderstorm with hail", "fa-solid fa-cloud-bolt"]
  };
  const found = map[Number(code)] || ["Conditions available", "fa-solid fa-cloud"];
  return { label: found[0], icon: found[1] };
}

function buildLeaderRoster(row) {
  const section = document.createElement("section");
  section.className = "mt-5";
  const heading = document.createElement("div");
  heading.className = "flex items-center gap-2";
  heading.append(icon("fa-solid fa-user-tie text-teal-800"), textNode("h4", "text-sm font-black text-slate-950", t("currentTeam")));
  const grid = document.createElement("div");
  grid.className = "mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3";
  const leads = currentLeaders(row);
  for (const role of ROLES) {
    const leader = leads.find(person => person.role === role);
    grid.append(leader ? leaderCard(leader, role, "current") : missingLeaderCard(role));
  }
  section.append(heading, grid);
  return section;
}

function leaderCard(leader, role, status) {
  const article = document.createElement("article");
  article.className = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
  const upper = document.createElement("div");
  upper.className = "flex items-start gap-3 p-4";
  const avatar = document.createElement("span");
  avatar.className = "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-100 to-amber-100 text-sm font-black text-teal-950";
  const photo = leader.photoApproved === true ? safeImage(leader.photoUrl) : "";
  if (photo) {
    const image = document.createElement("img");
    image.src = photo;
    image.alt = "";
    image.loading = "lazy";
    image.className = "h-full w-full object-cover";
    avatar.append(image);
  } else avatar.textContent = initials(leader.fullName);
  const details = document.createElement("div");
  details.className = "min-w-0 flex-1";
  details.append(roleBadge(role, status), textNode("h5", "mt-2 break-words text-sm font-black text-slate-950", leader.fullName || t("leader")), textNode("p", "mt-1 text-[10px] font-semibold text-slate-600", `${t("department")}: ${leader.department || "—"}`));
  if (leader.introduction) details.append(textNode("p", "mt-2 text-[11px] leading-5 text-slate-600", leader.introduction));
  upper.append(avatar, details);
  const meta = document.createElement("div");
  meta.className = "flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3";
  meta.append(termPill(leader));
  if (leader.telegramPublic === true && validTelegram(leader.telegram)) {
    const contact = document.createElement("a");
    contact.className = "inline-flex items-center gap-1.5 rounded-lg bg-[#168b79] px-2.5 py-1.5 text-[9px] font-extrabold text-white transition hover:bg-[#0d6b60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
    contact.href = `https://t.me/${encodeURIComponent(validTelegram(leader.telegram))}`;
    contact.target = "_blank";
    contact.rel = "noopener noreferrer";
    contact.append(icon("fa-brands fa-telegram"), document.createTextNode(t("contact")));
    meta.append(contact);
  } else meta.append(textNode("span", "inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-500", t("contactUnavailable")));
  article.append(upper, meta);
  return article;
}

function missingLeaderCard(role) {
  const card = document.createElement("article");
  card.className = "flex min-h-28 items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4";
  const iconBox = document.createElement("span");
  iconBox.className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400";
  iconBox.append(icon("fa-regular fa-user"));
  card.append(iconBox, elText("div", "", [roleBadge(role, "current"), textNode("p", "mt-2 text-[10px] text-slate-500", t("leadersMissing"))]));
  return card;
}

function roleBadge(role, status) {
  const badge = document.createElement("span");
  badge.className = "inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-950";
  badge.append(icon(status === "current" ? "fa-solid fa-star text-amber-700" : "fa-solid fa-clock-rotate-left text-slate-500"), document.createTextNode(ROLE_TITLE[role] || role || t("role")));
  return badge;
}

function termPill(leader) {
  const start = safeNumber(leader.termStartYear ?? leader.electedYear);
  const end = safeNumber(leader.termEndYear);
  const chip = document.createElement("span");
  chip.className = "inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-600";
  chip.append(icon("fa-regular fa-calendar text-teal-700"));
  if (start !== null) {
    const stop = end === null ? start + 1 : end;
    const current = new Date().getFullYear();
    const years = Math.max(1, stop - start);
    const elapsed = Math.max(1, Math.min(years, current - start + 1));
    chip.append(document.createTextNode(`${t("term")}: ${start}–${stop} · ${t("serviceYear")} ${elapsed} ${t("of")} ${years}`));
  } else chip.append(document.createTextNode(t("termMissing")));
  return chip;
}

function buildHistory(row) {
  const section = document.createElement("section");
  section.className = "mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/60 p-4 sm:p-5";
  const heading = document.createElement("div");
  heading.className = "flex items-start gap-3";
  const mark = document.createElement("span");
  mark.className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800";
  mark.append(icon("fa-solid fa-timeline"));
  const headCopy = document.createElement("div");
  headCopy.append(textNode("h4", "text-sm font-black text-slate-950", t("serviceHistory")), textNode("p", "mt-1 text-[10px] leading-5 text-slate-600", t("transition")));
  heading.append(mark, headCopy);
  const timeline = document.createElement("div");
  timeline.className = "mt-4 space-y-3";
  const terms = leadershipTerms(row);
  if (!terms.length) timeline.append(textNode("p", "rounded-xl border border-dashed border-indigo-200 bg-white/80 p-4 text-[10px] text-slate-500", t("historyMissing")));
  terms.forEach((term, index) => {
    const article = document.createElement("article");
    article.className = "relative rounded-xl border border-white bg-white/90 p-3.5 shadow-sm sm:p-4";
    const top = document.createElement("div");
    top.className = "flex flex-wrap items-center justify-between gap-2";
    top.append(textNode("h5", "text-xs font-black text-indigo-950", term.academicYear || term.year), textNode("span", "rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold text-indigo-800", term.electionDate ? `${t("elected")}: ${term.electionDate}` : t("previous")));
    const people = document.createElement("div");
    people.className = "mt-3 grid gap-2 sm:grid-cols-3";
    for (const role of ROLES) {
      const past = (Array.isArray(term.leaders) ? term.leaders : []).find(person => person.role === role);
      if (!past) continue;
      const person = document.createElement("div");
      person.className = "flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2";
      const pAvatar = document.createElement("span");
      pAvatar.className = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] font-black text-teal-900";
      pAvatar.textContent = initials(past.fullName);
      person.append(pAvatar, elText("span", "min-w-0", [textNode("span", "block text-[9px] font-black text-slate-800", past.fullName || "—"), textNode("span", "mt-0.5 block truncate text-[8px] text-slate-500", `${ROLE_TITLE[role]} · ${past.department || "—"}`)]));
      people.append(person);
    }
    if (!people.childElementCount) people.append(textNode("p", "text-[10px] text-slate-500", t("historyMissing")));
    article.append(top, people);
    timeline.append(article);
  });
  section.append(heading, timeline);
  return section;
}

function elText(tag, classes, children) {
  const node = document.createElement(tag);
  if (classes) node.className = classes;
  node.append(...children);
  return node;
}

function initials(name = "") {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toLocaleUpperCase()).join("") || "ACE";
}
function validTelegram(value) {
  const clean = String(value || "").trim().replace(/^@/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(clean) ? clean : "";
}
function safeImage(value) {
  try {
    const url = new URL(String(value || ""), document.baseURI);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
