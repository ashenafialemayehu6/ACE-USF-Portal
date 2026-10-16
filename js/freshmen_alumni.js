// ACE-USF Freshmen & Alumni Journey Hub
// Orientation resources, a browser-saved starter checklist, and an alumni directory.

const CHECKLIST_KEY = "ace-usf-freshmen-checklist-v1";
const ALUMNI_PROFILES = [
  // Add verified alumni profiles here when you have permission to publish them.
  // Example: { name: "Full name", university: "University", field: "Field of study", year: "2024", focus: "Mentoring and career guidance", telegram: "https://t.me/username" }
];

const STARTER_STEPS = [
  { id: "campus", title: "Learn your campus", text: "Locate your department, library, student services, and the places you will visit most." },
  { id: "schedule", title: "Build a steady study rhythm", text: "Write down your class times, deadlines, study blocks, and time to rest." },
  { id: "community", title: "Find your fellowship community", text: "Meet students at your campus and ask about gatherings, prayer, and practical support." },
  { id: "support", title: "Know where to ask for help", text: "Save the contacts for academic advising, student services, and a trusted fellowship leader." },
  { id: "wellbeing", title: "Care for your whole self", text: "Plan meals, water, sleep, movement, and time to settle into a new routine." },
  { id: "goals", title: "Choose one first-month goal", text: "Pick one realistic academic, spiritual, or community goal and review it each week." }
];

const ORIENTATION_GUIDES = [
  { category: "Campus life", icon: "fa-solid fa-map-location-dot", title: "Find your way around", text: "Start with your faculty, library, student service office, health center, and the safest routes between them." },
  { category: "Study", icon: "fa-solid fa-book-open", title: "Create a study rhythm", text: "Use a weekly plan, begin assignments early, and ask instructors or classmates when a topic is unclear." },
  { category: "Community", icon: "fa-solid fa-people-group", title: "Build your support circle", text: "Introduce yourself to classmates, connect with your campus fellowship, and keep trusted contacts close." },
  { category: "Wellbeing", icon: "fa-solid fa-heart-pulse", title: "Settle in with care", text: "Give yourself time to adjust. Protect rest, drink water, eat regularly, and reach out when you need support." },
  { category: "Faith", icon: "fa-solid fa-cross", title: "Make room for faith", text: "Choose a simple rhythm for prayer, Scripture, worship, and fellowship that fits your study life." },
  { category: "Next steps", icon: "fa-solid fa-compass", title: "Take the next step", text: "You do not need every answer on day one. Ask one question, meet one person, and take one step at a time." }
];

let homeSnapshot = [];
let returnFocus = null;
let activeTab = "freshmen";
let guideQuery = "";
let alumniQuery = "";

export function setupFreshmenAlumniRoom() {
  const room = document.getElementById("freshmen-alumni-room-view");
  if (!room || room.dataset.journeyReady === "true") return;
  room.dataset.journeyReady = "true";

  document.addEventListener("click", handleJourneyClick, true);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isFreshmenAlumniRoomOpen()) closeFreshmenAlumniRoom();
  });
}

function handleJourneyClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (target.closest("#freshmen-alumni-room-close")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeFreshmenAlumniRoom();
    return;
  }

  const trigger = target.closest("a[data-open-freshmen-alumni], a[href='#students-section']");
  if (trigger) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openFreshmenAlumniRoom(trigger);
    return;
  }

  // Restore the portal before normal navigation continues to another section.
  if (isFreshmenAlumniRoomOpen() && target.closest("a")) closeFreshmenAlumniRoom();
}

function openFreshmenAlumniRoom(trigger) {
  const room = document.getElementById("freshmen-alumni-room-view");
  const roomSlot = document.getElementById("freshmen-alumni-home-slot");
  const roomContent = document.getElementById("freshmen-alumni-room-content");
  const dashboard = document.getElementById("app-dashboard");
  if (!room || !roomSlot || !roomContent || !dashboard || isFreshmenAlumniRoomOpen()) return;

  returnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
  homeSnapshot = [...dashboard.childNodes];
  dashboard.replaceChildren(room);
  room.classList.remove("hidden");
  room.setAttribute("aria-hidden", "false");
  renderJourneyRoom();
  document.getElementById("freshmen-alumni-room-close")?.focus();
  room.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export function closeFreshmenAlumniRoom() {
  const room = document.getElementById("freshmen-alumni-room-view");
  const roomSlot = document.getElementById("freshmen-alumni-home-slot");
  const roomContent = document.getElementById("freshmen-alumni-room-content");
  const dashboard = document.getElementById("app-dashboard");
  if (!room || !roomSlot || !roomContent || !dashboard || !isFreshmenAlumniRoomOpen()) return;

  roomContent.replaceChildren();
  room.classList.add("hidden");
  room.setAttribute("aria-hidden", "true");
  dashboard.replaceChildren(...homeSnapshot);
  roomSlot.append(room);
  homeSnapshot = [];
  if (returnFocus instanceof HTMLElement) returnFocus.focus();
  returnFocus = null;
}

export function isFreshmenAlumniRoomOpen() {
  return document.getElementById("freshmen-alumni-room-view")?.classList.contains("hidden") === false;
}

function renderJourneyRoom() {
  const content = document.getElementById("freshmen-alumni-room-content");
  if (!content) return;
  content.replaceChildren();

  const page = el("div", "space-y-5 sm:space-y-6");
  page.append(buildWelcomeHero(), buildPathTabs());
  const panel = el("section", "min-w-0");
  panel.id = "journey-tab-panel";
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", `journey-tab-${activeTab}`);
  panel.setAttribute("aria-live", "polite");
  page.append(panel);
  content.append(page);
  renderActiveTab(panel);
}

function buildWelcomeHero() {
  const hero = el("section", "relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9");
  hero.setAttribute("aria-labelledby", "journey-welcome-heading");
  const glow = el("div", "pointer-events-none absolute -right-10 -top-12 -z-10 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl");
  const glowTwo = el("div", "pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl");
  const layout = el("div", "relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end");
  const copy = el("div", "max-w-3xl");
  const badge = el("p", "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-100");
  badge.append(icon("fa-solid fa-sparkles", "text-amber-300"), document.createTextNode("A place for every season of the journey"));
  copy.append(badge, text("h3", "mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl", "Start with confidence. Stay connected."), text("p", "mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base", "Practical guidance for your first steps at university, and meaningful ways for graduates to encourage the next generation."));
  const chips = el("div", "flex flex-wrap gap-2");
  [["fa-solid fa-compass", "Find your way"], ["fa-solid fa-book-open", "Grow with purpose"], ["fa-solid fa-hands-holding-circle", "Give back"]].forEach(([glyph, label]) => {
    const chip = el("span", "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold text-white/90");
    chip.append(icon(glyph, "text-amber-300"), document.createTextNode(label));
    chips.append(chip);
  });
  layout.append(copy, chips);
  hero.append(glow, glowTwo, layout);
  return hero;
}

function buildPathTabs() {
  const nav = el("div", "flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm");
  nav.setAttribute("role", "tablist");
  nav.setAttribute("aria-label", "Choose your journey");
  [
    { id: "freshmen", title: "New to university", icon: "fa-solid fa-seedling", hint: "Freshmen & new students" },
    { id: "alumni", title: "Life after graduation", icon: "fa-solid fa-user-graduate", hint: "Alumni & graduates" }
  ].forEach(item => {
    const button = el("button", "flex min-w-[min(100%,15rem)] flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500");
    button.type = "button";
    button.dataset.journeyTab = item.id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(activeTab === item.id));
    button.id = `journey-tab-${item.id}`;
    button.setAttribute("aria-controls", "journey-tab-panel");
    const badge = el("span", "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg");
    badge.append(icon(item.icon));
    const words = el("span", "min-w-0");
    words.append(text("span", "block text-xs font-extrabold", item.title), text("span", "mt-0.5 block text-[10px] text-slate-500", item.hint));
    button.append(badge, words);
    styleTab(button);
    button.addEventListener("click", () => {
      activeTab = item.id;
      renderJourneyRoom();
      document.getElementById(`journey-tab-${item.id}`)?.focus();
    });
    nav.append(button);
  });
  return nav;
}

function styleTab(button) {
  const selected = button.getAttribute("aria-selected") === "true";
  button.classList.toggle("bg-emerald-950", selected);
  button.classList.toggle("text-white", selected);
  button.classList.toggle("bg-slate-50", !selected);
  button.classList.toggle("text-slate-800", !selected);
  const badge = button.querySelector("span");
  badge?.classList.toggle("bg-white/10", selected);
  badge?.classList.toggle("text-emerald-100", selected);
  badge?.classList.toggle("bg-emerald-100", !selected);
  badge?.classList.toggle("text-emerald-800", !selected);
}

function renderActiveTab(panel) {
  panel.replaceChildren(activeTab === "alumni" ? renderAlumniPanel() : renderFreshmenPanel());
  const tab = document.getElementById(`journey-tab-${activeTab}`);
  tab?.setAttribute("aria-selected", "true");
}

function renderFreshmenPanel() {
  const wrapper = el("div", "grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,.8fr)]");
  const main = el("div", "space-y-5");
  const side = el("aside", "space-y-4");
  const checklistCard = card("border-emerald-100");
  const heading = sectionHeading("Your first-month roadmap", "Small steps make a new place feel familiar.", "fa-solid fa-list-check", "emerald");
  checklistCard.append(heading);

  const progress = el("div", "mt-5 rounded-xl bg-emerald-50 p-4");
  const progressTop = el("div", "flex items-center justify-between gap-3");
  const progressLabel = text("p", "text-[11px] font-extrabold text-emerald-950", "Your progress");
  const progressValue = text("p", "text-xs font-black text-emerald-800", "0 of 6 complete");
  progressValue.id = "journey-progress-value";
  progressTop.append(progressLabel, progressValue);
  const track = el("div", "mt-2 h-2 overflow-hidden rounded-full bg-emerald-100");
  const fill = el("div", "h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-500");
  fill.id = "journey-progress-fill";
  fill.style.width = `${getChecklist().length / STARTER_STEPS.length * 100}%`;
  track.append(fill);
  progress.append(progressTop, track);
  checklistCard.append(progress);

  const list = el("div", "mt-4 space-y-2");
  const completed = new Set(getChecklist());
  STARTER_STEPS.forEach((step, index) => {
    const row = el("label", "group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50/50");
    const checkbox = el("input", "mt-1 h-4 w-4 shrink-0 accent-emerald-700 focus:ring-emerald-500");
    checkbox.type = "checkbox";
    checkbox.checked = completed.has(step.id);
    checkbox.dataset.checklistStep = step.id;
    checkbox.setAttribute("aria-label", `Mark ${step.title} complete`);
    const words = el("span", "min-w-0");
    const title = text("span", "block text-xs font-extrabold text-slate-800", step.title);
    const description = text("span", "mt-1 block text-[11px] leading-5 text-slate-500", step.text);
    const number = text("span", "ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500", String(index + 1));
    words.append(title, description);
    row.append(checkbox, words, number);
    checkbox.addEventListener("change", () => {
      const current = new Set(getChecklist());
      checkbox.checked ? current.add(step.id) : current.delete(step.id);
      saveChecklist([...current]);
      updateProgress();
    });
    list.append(row);
  });
  checklistCard.append(list);
  main.append(checklistCard, buildGuideLibrary());

  side.append(
    infoCard("You belong here", "University can feel new at first. You do not have to figure everything out alone; ask questions and connect with people you trust.", "fa-solid fa-heart", "from-rose-50 to-white", "text-rose-700"),
    actionCard("Meet your campus fellowship", "Find fellowship leaders and campus contacts who can help you get connected.", "fa-solid fa-people-group", "Find fellowship leaders", "#hubs-section", "emerald"),
    actionCard("Explore campus life", "Discover the campus network, library, and other ACE-USF resources.", "fa-solid fa-compass", "Back to portal", "#portal-home", "amber")
  );
  wrapper.append(main, side);
  return wrapper;
}

function buildGuideLibrary() {
  const panel = card("border-slate-200");
  const heading = sectionHeading("Quick-start guide", "Search practical reminders for campus life.", "fa-solid fa-book-open", "blue");
  const searchWrap = el("label", "relative mt-4 block");
  searchWrap.append(icon("fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400"));
  const search = el("input", "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100");
  search.type = "search";
  search.placeholder = "Search campus, study, faith, wellbeing…";
  search.setAttribute("aria-label", "Search orientation guides");
  search.value = guideQuery;
  searchWrap.append(search);
  const guides = el("div", "mt-3 grid gap-2 sm:grid-cols-2");
  const empty = text("p", "hidden rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 sm:col-span-2", "No guide matches that search. Try a different word.");
  panel.append(heading, searchWrap, guides, empty);
  const draw = () => {
    guides.replaceChildren();
    const matches = ORIENTATION_GUIDES.filter(item => `${item.category} ${item.title} ${item.text}`.toLowerCase().includes(guideQuery.toLowerCase().trim()));
    empty.classList.toggle("hidden", matches.length > 0);
    matches.forEach(item => {
      const tile = el("article", "rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-emerald-100 hover:bg-emerald-50/50");
      const titleRow = el("div", "flex items-center gap-2");
      const glyph = el("span", "flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm");
      glyph.append(icon(item.icon));
      titleRow.append(glyph, elText("div", "", [text("span", "block text-[9px] font-extrabold uppercase tracking-wider text-emerald-700", item.category), text("h4", "mt-0.5 text-xs font-extrabold text-slate-800", item.title)]));
      tile.append(titleRow, text("p", "mt-2 text-[11px] leading-5 text-slate-600", item.text));
      guides.append(tile);
    });
  };
  search.addEventListener("input", () => { guideQuery = search.value; draw(); });
  draw();
  return panel;
}

function renderAlumniPanel() {
  const wrapper = el("div", "space-y-5");
  const intro = card("overflow-hidden border-amber-100 bg-gradient-to-br from-white via-amber-50/50 to-emerald-50/70");
  const introGrid = el("div", "grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center");
  const introCopy = el("div", "max-w-3xl");
  introCopy.append(
    pill("The next chapter", "fa-solid fa-star", "amber"),
    text("h3", "mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl", "Your experience can open a door for someone else."),
    text("p", "mt-2 max-w-2xl text-sm leading-6 text-slate-600", "Stay connected to the fellowship, encourage students who are just beginning, and share the wisdom you have gained along the way.")
  );
  const stat = el("div", "flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-4 shadow-sm");
  const statIcon = el("span", "flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-800");
  statIcon.append(icon("fa-solid fa-people-arrows-left-right"));
  const statText = el("div", "");
  statText.append(text("p", "text-xl font-black text-slate-950", String(ALUMNI_PROFILES.length)), text("p", "text-[10px] font-semibold text-slate-500", ALUMNI_PROFILES.length === 1 ? "verified profile" : "verified profiles"));
  stat.append(statIcon, statText);
  introGrid.append(introCopy, stat);
  intro.append(introGrid);

  const three = el("div", "grid gap-4 md:grid-cols-3");
  three.append(
    valueCard("Be a steady mentor", "Share perspective, study habits, and encouragement with someone navigating university for the first time.", "fa-solid fa-handshake-angle", "emerald"),
    valueCard("Keep the connection", "Stay close to your campus fellowship and celebrate the people and community that shaped your journey.", "fa-solid fa-link", "blue"),
    valueCard("Give in a way that fits", "Offer a conversation, a practical skill, a resource, or a little time when you are able.", "fa-solid fa-seedling", "amber")
  );

  const directory = card("border-slate-200");
  const directoryTop = el("div", "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between");
  directoryTop.append(sectionHeading("Alumni & mentor directory", "Search verified profiles shared with the ACE-USF community.", "fa-solid fa-address-book", "emerald"));
  const search = el("input", "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:max-w-xs");
  search.type = "search";
  search.placeholder = "Search name, campus, or field…";
  search.setAttribute("aria-label", "Search alumni profiles");
  search.value = alumniQuery;
  directoryTop.append(search);
  const results = el("div", "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3");
  const empty = el("div", "mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center");
  const emptyIcon = el("span", "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-emerald-700 shadow-sm");
  emptyIcon.append(icon("fa-solid fa-address-card"));
  empty.append(emptyIcon, text("h4", "mt-3 text-sm font-extrabold text-slate-800", "The directory is ready for verified alumni"), text("p", "mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500", "No profiles have been added yet. When alumni details are confirmed and shared with permission, they can be listed here for students to discover."));
  const action = actionLink("Find fellowship leaders", "#hubs-section", "fa-solid fa-people-group", "emerald");
  const actionWrap = el("div", "mt-4 flex justify-center");
  actionWrap.append(action);
  empty.append(actionWrap);
  directory.append(directoryTop, results, empty);

  const privacy = el("p", "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] leading-5 text-slate-500");
  privacy.append(icon("fa-solid fa-shield-halved mr-1.5 text-emerald-700"), document.createTextNode("Directory details should be published only with each person's permission. This page does not send profile information anywhere."));
  wrapper.append(intro, three, directory, privacy);

  const draw = () => {
    results.replaceChildren();
    const query = alumniQuery.toLowerCase().trim();
    const matches = ALUMNI_PROFILES.filter(person => `${person.name} ${person.university} ${person.field} ${person.year} ${person.focus}`.toLowerCase().includes(query));
    empty.classList.toggle("hidden", matches.length > 0);
    empty.querySelector("h4").textContent = query && !matches.length ? "No profiles match that search" : "The directory is ready for verified alumni";
    empty.querySelector("p").textContent = query && !matches.length
      ? "Try a different name, university, or field. Verified alumni profiles will appear here when added."
      : "No profiles have been added yet. When alumni details are confirmed and shared with permission, they can be listed here for students to discover.";
    matches.forEach(person => results.append(buildAlumniCard(person)));
  };
  search.addEventListener("input", () => { alumniQuery = search.value; draw(); });
  draw();
  return wrapper;
}

function buildAlumniCard(person) {
  const article = card("border-emerald-100");
  const row = el("div", "flex items-start gap-3");
  const avatar = el("span", "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-lg font-black text-emerald-900");
  avatar.textContent = initials(person.name);
  const info = el("div", "min-w-0");
  info.append(text("h4", "truncate text-xs font-extrabold text-slate-900", person.name), text("p", "mt-1 text-[10px] font-semibold text-emerald-800", person.university));
  row.append(avatar, info);
  article.append(row, text("p", "mt-3 text-[11px] text-slate-600", [person.field, person.year].filter(Boolean).join(" • ")));
  if (person.focus) article.append(text("p", "mt-2 text-[11px] leading-5 text-slate-600", person.focus));
  if (person.telegram && isSafeHttpUrl(person.telegram)) {
    const link = el("a", "mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-950 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500");
    link.href = person.telegram;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(icon("fa-brands fa-telegram"), document.createTextNode("Contact on Telegram"));
    article.append(link);
  }
  return article;
}

function updateProgress() {
  const count = getChecklist().length;
  const total = STARTER_STEPS.length;
  const value = document.getElementById("journey-progress-value");
  const fill = document.getElementById("journey-progress-fill");
  if (value) value.textContent = `${count} of ${total} complete`;
  if (fill) fill.style.width = `${Math.round(count / total * 100)}%`;
}

function getChecklist() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(id => STARTER_STEPS.some(step => step.id === id)) : [];
  } catch { return []; }
}

function saveChecklist(values) {
  try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(values)); } catch { /* Keep the checklist usable if browser storage is unavailable. */ }
}

function card(extra = "") { return el("section", `rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${extra}`); }

function sectionHeading(title, subtitle, glyph, color = "emerald") {
  const row = el("div", "flex items-center gap-3");
  const palette = { emerald: "bg-emerald-100 text-emerald-800", blue: "bg-blue-100 text-blue-800", amber: "bg-amber-100 text-amber-800", purple: "bg-purple-100 text-purple-800" }[color] || "bg-emerald-100 text-emerald-800";
  const tile = el("span", `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${palette}`);
  tile.append(icon(glyph));
  const copy = el("div", "min-w-0");
  copy.append(text("h3", "text-sm font-black text-slate-900", title), text("p", "mt-0.5 text-[11px] leading-5 text-slate-500", subtitle));
  row.append(tile, copy);
  return row;
}

function infoCard(title, description, glyph, gradient, color) {
  const section = card(`bg-gradient-to-br ${gradient}`);
  const top = el("div", "flex items-center gap-2");
  top.append(icon(`${glyph} ${color}`), text("h3", "text-xs font-extrabold text-slate-900", title));
  section.append(top, text("p", "mt-2 text-[11px] leading-5 text-slate-600", description));
  return section;
}

function actionCard(title, description, glyph, label, href, color) {
  const section = card("border-slate-200");
  const top = el("div", "flex items-center gap-2");
  top.append(icon("fa-solid fa-circle-check text-emerald-600"), text("h3", "text-xs font-extrabold text-slate-900", title));
  section.append(top, text("p", "mt-2 text-[11px] leading-5 text-slate-600", description), actionLink(label, href, glyph, color));
  section.querySelector("a")?.classList.add("mt-3");
  return section;
}

function valueCard(title, description, glyph, color) {
  const styles = { emerald: "bg-emerald-100 text-emerald-800", blue: "bg-blue-100 text-blue-800", amber: "bg-amber-100 text-amber-800" }[color];
  const section = card("border-slate-200 transition hover:-translate-y-0.5 hover:shadow-md");
  const tile = el("span", `flex h-10 w-10 items-center justify-center rounded-xl ${styles}`);
  tile.append(icon(glyph));
  section.append(tile, text("h3", "mt-3 text-xs font-extrabold text-slate-900", title), text("p", "mt-1.5 text-[11px] leading-5 text-slate-600", description));
  return section;
}

function actionLink(label, href, glyph, color) {
  const styles = { emerald: "bg-emerald-950 hover:bg-emerald-800 focus-visible:ring-emerald-500", amber: "bg-amber-500 text-slate-950 hover:bg-amber-400 focus-visible:ring-amber-500" }[color] || "bg-emerald-950 hover:bg-emerald-800 focus-visible:ring-emerald-500";
  const link = el("a", `inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[10px] font-extrabold text-white transition focus-visible:outline-none focus-visible:ring-2 ${styles}`);
  link.href = href;
  link.append(icon(glyph), document.createTextNode(label));
  return link;
}

function pill(label, glyph, color) {
  const styles = { amber: "border-amber-200 bg-amber-100 text-amber-900", emerald: "border-emerald-200 bg-emerald-100 text-emerald-900" }[color];
  const node = el("span", `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] ${styles}`);
  node.append(icon(glyph), document.createTextNode(label));
  return node;
}

function text(tag, classes, value) {
  const node = el(tag, classes);
  node.textContent = value;
  return node;
}

function elText(tag, classes, children) {
  const node = el(tag, classes);
  node.append(...children);
  return node;
}

function el(tag, classes = "") {
  const node = document.createElement(tag);
  if (classes) node.className = classes;
  return node;
}

function icon(classes, extra = "") {
  const node = el("i", `${classes} ${extra}`.trim());
  node.setAttribute("aria-hidden", "true");
  return node;
}

function initials(name = "") {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "A";
}

function isSafeHttpUrl(value) {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}

