/**
 * js/home_service.js
 * Home dashboard for ACE-USF.
 * Live totals come from published records in the admin-managed Firestore collections.
 */

import { db } from "./firebase_config.js";
import { fellowshipUniversityRecords } from "./fellowship_leaders_data.js";
import { spiritualCategories } from "./academic_data.js";
import {
  collection,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const ETHIOPIA_TIME_ZONE = "Africa/Addis_Ababa";

const ONE_GOD_DOCTRINAL_VERSES = [
  {
    verse: "Deuteronomy 6:4",
    text: "Hear, O Israel: The LORD our God, the LORD is one!",
    theme: "The Oneness of God"
  },
  {
    verse: "Isaiah 44:6",
    text: "I am the First and I am the Last; Besides Me there is no God.",
    theme: "Supreme Deity"
  },
  {
    verse: "Ephesians 4:5-6",
    text: "One Lord, one faith, one baptism; one God and Father of all.",
    theme: "Unity of Doctrine"
  },
  {
    verse: "1 Timothy 2:5",
    text: "For there is one God and one Mediator between God and men, the Man Christ Jesus.",
    theme: "The Incarnate God"
  },
  {
    verse: "Colossians 2:9",
    text: "For in Him dwells all the fullness of the Godhead bodily.",
    theme: "Fullness in Christ"
  }
];

const PORTAL_SERVICES = [
  {
    title: "Campus Network & Fellowships",
    badge: "National Chapters",
    icon: "fa-network-wired",
    description: "Meet fellowship communities, explore university chapters, and find ways to connect.",
    actionKey: "network"
  },
  {
    title: "Departmental Bible Study Schools",
    badge: "College-Based Discipleship",
    icon: "fa-book-bible",
    description: "Go directly to your college Bible study school and find your department community.",
    actionKey: "bible-study"
  },
  {
    title: "Apostolic & Academic Library",
    badge: "Two Library Rooms",
    icon: "fa-book-bible",
    description: "Discover spiritual literature, pastoral teachings, and academic study resources.",
    actionKey: "library"
  },
  {
    title: "Church & Assembly Locator",
    badge: "Find a Community",
    icon: "fa-church",
    description: "Locate Apostolic Church assemblies and student gathering hubs across Ethiopia.",
    actionKey: "church"
  }
];

let activeHomeUser = null;
let homeStats = { chapters: null, leaders: null, resources: null };
let homeStatsStarted = false;
let homeClockStarted = false;
let homeStatsSources = { network: false, library: false, error: false };

function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}

function getEthiopiaHour(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: ETHIOPIA_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    const hourPart = parts.find(function (part) { return part.type === "hour"; });
    return hourPart ? Number(hourPart.value) : date.getHours();
  } catch (error) {
    return date.getHours();
  }
}

function getTimeGreeting(date = new Date()) {
  // Match the time shown on the visitor's own device.
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function getAutomatedTimeAndDate(date = new Date()) {
  let gregorianDate;
  let ethiopianDate;

  try {
    gregorianDate = new Intl.DateTimeFormat("en-ET", {
      timeZone: ETHIOPIA_TIME_ZONE,
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch (error) {
    gregorianDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  try {
    ethiopianDate = new Intl.DateTimeFormat("am-ET-u-ca-ethiopic-nu-latn", {
      timeZone: ETHIOPIA_TIME_ZONE,
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch (error) {
    ethiopianDate = "Ethiopian calendar date unavailable";
  }

  return {
    timeGreeting: getTimeGreeting(date),
    gregorianDate: gregorianDate,
    ethiopianDate: ethiopianDate
  };
}

function getFirstName(user) {
  if (!user) return "";

  const possibleName =
    user.displayName ||
    user.name ||
    user.fullName ||
    (user.profile && (user.profile.displayName || user.profile.name)) ||
    "";

  if (String(possibleName).trim()) {
    return String(possibleName).trim().split(/\s+/)[0];
  }

  const email = String(user.email || "").trim();
  if (email && email.indexOf("@") > 0) {
    return email.slice(0, email.indexOf("@")).replace(/[._-]+/g, " ");
  }

  return "ACE-USF member";
}

export function updateHomeGreeting(user = activeHomeUser) {
  activeHomeUser = user || null;

  const title = document.getElementById("home-greeting-title");
  const context = document.getElementById("home-greeting-context");
  const blessing = document.getElementById("home-blessing-message");

  if (title) {
    title.textContent = activeHomeUser
      ? getTimeGreeting() + ", " + getFirstName(activeHomeUser) + "!"
      : "Welcome to ACE-USF";
  }

  if (context) {
    const campus = activeHomeUser && (activeHomeUser.campus || activeHomeUser.universityName);
    context.textContent = campus
      ? "ONE GOD, ONE NAME: JESUS.  ·  " + campus
      : "ONE GOD, ONE NAME: JESUS.";
  }

  if (blessing) {
    blessing.textContent = activeHomeUser
      ? "God bless you, " + getFirstName(activeHomeUser) + ". Thank you for being part of ACE-USF. Stay with us as we grow in faith, learning, fellowship, and service."
      : "God bless you. Stay with ACE-USF as we grow in faith, learning, fellowship, and service.";
  }

  updateHomeDateLine();
}

function updateHomeDateLine() {
  const dateLine = document.getElementById("home-date-line");
  if (!dateLine) return;
  const dates = getAutomatedTimeAndDate();
  dateLine.textContent = dates.gregorianDate + "  ·  " + dates.ethiopianDate;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Number(value) || 0));
}

function applyHomeStats() {
  document.querySelectorAll("[data-home-stat]").forEach(function (element) {
    const key = element.getAttribute("data-home-stat");
    const value = homeStats[key];
    if (value == null) {
      element.textContent = "—";
      return;
    }

    const target = Math.max(0, Math.round(Number(value) || 0));
    const current = Number(element.dataset.homeCount || 0);
    if (current === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = formatCount(target);
      element.dataset.homeCount = String(target);
      return;
    }

    if (element._homeCountFrame) window.cancelAnimationFrame(element._homeCountFrame);
    const startedAt = performance.now();
    const duration = 560;
    const animate = function (now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(Math.round(current + (target - current) * eased));
      if (progress < 1) element._homeCountFrame = window.requestAnimationFrame(animate);
      else {
        element.dataset.homeCount = String(target);
        element._homeCountFrame = 0;
      }
    };
    element._homeCountFrame = window.requestAnimationFrame(animate);
  });
}

function normalizeCountKey(value) {
  return String(value || "").trim().toLocaleLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function sameUniversity(left, right) {
  const a = normalizeCountKey(left);
  const b = normalizeCountKey(right);
  return Boolean(
    a && b && (
      a === b || (
        Math.min(a.length, b.length) >= 10 &&
        (a.includes(b) || b.includes(a))
      )
    )
  );
}

function countUniversities(rows) {
  const names = [];
  rows.forEach(function (row) {
    const name = String(row.universityName || row.name || "").trim();
    if (!name || row.active === false) return;
    if (!names.some(function (known) { return sameUniversity(known, name); })) names.push(name);
  });
  return names.length;
}

function countNamedLeaders(rows) {
  const leaders = new Set();
  rows.forEach(function (row) {
    if (!row || row.active === false) return;
    const campusKey = normalizeCountKey(row.universityName || row.name || row.id);
    const addLeader = function (leader, branchName) {
      if (!leader) return;
      const name = String(leader.fullName || leader.name || leader).trim();
      const nameKey = normalizeCountKey(name);
      if (nameKey) leaders.add(campusKey + "|" + normalizeCountKey(branchName) + "|" + nameKey);
    };
    (Array.isArray(row.leaders) ? row.leaders : []).forEach(function (leader) { addLeader(leader, ""); });
    (Array.isArray(row.branches) ? row.branches : []).forEach(function (branch) {
      (Array.isArray(branch.leaders) ? branch.leaders : []).forEach(function (leader) { addLeader(leader, branch.name || ""); });
    });
    [row.astebabariName, row.genzebYazhName, row.tsehafiName].forEach(function (name) {
      if (String(name || "").trim()) addLeader(name, "");
    });
  });
  return leaders.size;
}

function seededLibraryTitles() {
  return spiritualCategories.flatMap(function (category) {
    return (category.pdfs || []).map(function (resource) { return resource.title || ""; });
  }).filter(Boolean);
}

function countLibraryResources(liveRows = []) {
  const titles = new Set(seededLibraryTitles().map(normalizeCountKey).filter(Boolean));
  liveRows.forEach(function (row) {
    if (!row || row.active === false) return;
    const title = normalizeCountKey(row.title || row.name || row.id);
    if (title) titles.add(title);
  });
  return titles.size;
}

function updateHomeStatsStatus() {
  const status = document.getElementById("home-stats-status");
  if (!status) return;
  if (homeStatsSources.error) {
    status.innerHTML = '<span class="mr-2 inline-block h-2 w-2 rounded-full bg-amber-300"></span>Using available records · live sync unavailable';
  } else if (homeStatsSources.network && homeStatsSources.library) {
    status.innerHTML = '<span class="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-300"></span>Live network updates';
  } else {
    status.innerHTML = '<span class="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300"></span>Connecting to live records';
  }
}

function startHomeStats() {
  if (homeStatsStarted) return;
  homeStatsStarted = true;

  homeStats.chapters = countUniversities(fellowshipUniversityRecords);
  homeStats.leaders = countNamedLeaders(fellowshipUniversityRecords);
  homeStats.resources = countLibraryResources();
  applyHomeStats();
  updateHomeStatsStatus();

  const publicLeaders = query(
    collection(db, "siteContent", "leaders", "items"),
    where("published", "==", true)
  );

  onSnapshot(publicLeaders, function (snapshot) {
    const records = snapshot.docs
      .map(function (document) {
        return Object.assign({ id: document.id }, document.data());
      })
      .filter(function (record) { return record.active !== false; });

    homeStats.chapters = countUniversities([...fellowshipUniversityRecords, ...records]);
    homeStats.leaders = countNamedLeaders([...fellowshipUniversityRecords, ...records]);
    homeStatsSources.network = true;
    applyHomeStats();
    updateHomeStatsStatus();
  }, function (error) {
    homeStatsSources.error = true;
    updateHomeStatsStatus();
    console.error("Could not load published fellowship totals:", error);
  });

  const publicResources = query(
    collection(db, "siteContent", "library", "items"),
    where("published", "==", true)
  );

  onSnapshot(publicResources, function (snapshot) {
    const records = snapshot.docs.map(function (document) {
      return Object.assign({ id: document.id }, document.data());
    });
    homeStats.resources = countLibraryResources(records);
    homeStatsSources.library = true;
    applyHomeStats();
    updateHomeStatsStatus();
  }, function (error) {
    homeStatsSources.error = true;
    updateHomeStatsStatus();
    console.error("Could not load published library totals:", error);
  });
}

function startHomeClock() {
  if (homeClockStarted) return;
  homeClockStarted = true;

  window.setInterval(function () {
    if (document.getElementById("home-greeting-title")) {
      updateHomeGreeting(activeHomeUser);
    }
  }, 60000);
}

function renderServiceCard(service) {
  return ''
    + '<article class="group flex min-w-0 flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">'
    + '  <div>'
    + '    <div class="mb-4 flex items-center justify-between gap-3">'
    + '      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl text-amber-400"><i class="fa-solid ' + escapeHTML(service.icon) + '"></i></div>'
    + '      <span class="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-center text-xs font-bold text-teal-800">' + escapeHTML(service.badge) + '</span>'
    + '    </div>'
    + '    <h3 class="mb-2 break-words text-xl font-bold text-slate-900 transition group-hover:text-teal-700">' + escapeHTML(service.title) + '</h3>'
    + '    <p class="mb-6 text-sm leading-relaxed text-slate-600">' + escapeHTML(service.description) + '</p>'
    + '  </div>'
    + '  <button type="button" data-action-key="' + escapeHTML(service.actionKey) + '" ' + (service.actionKey === "bible-study" ? 'data-open-campus-bible-study ' : '') + 'class="btn-hub-nav-trigger flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-teal-700">'
    + '    <span>Open Hub</span><i class="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>'
    + '  </button>'
    + '</article>';
}

export function renderHomeSection(containerId = "app-dashboard", user = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  activeHomeUser = user || null;

  const verseIndex = getEthiopiaHour() % ONE_GOD_DOCTRINAL_VERSES.length;
  const verse = ONE_GOD_DOCTRINAL_VERSES[verseIndex];
  const dates = getAutomatedTimeAndDate();
  const statCards = [
    { key: "chapters", label: "Fellowship chapters", icon: "fa-building-columns", colorClass: "bg-teal-50 text-teal-700" },
    { key: "leaders", label: "Current leaders", icon: "fa-user-group", colorClass: "bg-indigo-50 text-indigo-700" },
    { key: "resources", label: "Library resources", icon: "fa-book-open", colorClass: "bg-emerald-50 text-emerald-700" }
  ];

  container.innerHTML = ''
    + '<div class="col-span-1 w-full min-w-0 space-y-7 lg:col-span-12">'
    + '  <div id="home-section-top" class="scroll-mt-8"></div>'
    + '  <div class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 px-5 py-4 text-teal-100 shadow-md sm:flex-row sm:items-center sm:justify-between">'
    + '    <div class="flex min-w-0 items-center gap-2.5">'
    + '      <span class="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-400"></span>'
    + '      <span class="truncate text-[11px] font-bold uppercase tracking-wider text-white">ACE-USF Fellowship Portal</span>'
    + '    </div>'
    + '    <div id="home-date-line" class="min-w-0 break-words text-xs text-slate-300">' + escapeHTML(dates.gregorianDate + "  ·  " + dates.ethiopianDate) + '</div>'
    + '  </div>'
    + '  <section class="home-hero-section relative isolate min-h-[30rem] overflow-hidden rounded-[2rem_3rem_2rem_4rem] border border-white/10 bg-gradient-to-br from-[#102b2b] via-teal-950 to-slate-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-12">'
    + '    <div aria-hidden="true" class="home-hero-copy-shade pointer-events-none absolute inset-0 z-0"></div>'
    + '    <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 -left-16 z-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"></div>'
    + '    <img class="home-hero-art pointer-events-none absolute inset-0 z-0 h-full w-full object-cover" src="https://images.pexels.com/photos/5676678/pexels-photo-5676678.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=2000" alt="" aria-hidden="true" fetchpriority="high">'
    + '    <div class="relative z-10 mx-auto w-full max-w-5xl text-center">'
    + '      <p id="home-greeting-context" class="mx-auto mb-5 inline-flex max-w-full flex-wrap items-center justify-center rounded-full border border-teal-200/30 bg-slate-950/35 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-teal-100 shadow-[0_8px_30px_rgba(0,0,0,.42)] backdrop-blur-sm sm:text-xs"></p>'
    + '      <h1 id="home-greeting-title" class="mx-auto mb-5 max-w-5xl break-words text-balance text-4xl font-black leading-[1.02] tracking-[-.045em] text-white drop-shadow-[0_6px_26px_rgba(0,0,0,.9)] sm:text-5xl md:text-6xl lg:text-7xl"></h1>'
    + '      <p class="mx-auto mb-8 max-w-4xl text-balance text-base font-medium leading-7 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,.88)] sm:text-lg sm:leading-8">Welcome home. Grow in faith, study Scripture, and build lasting friendships with Apostolic students across Ethiopia.</p>'
    + '      <div class="flex flex-wrap items-center justify-center gap-3">'
    + '        <button id="hero-cta-network" type="button" class="flex max-w-full items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-500"><i class="fa-solid fa-network-wired shrink-0 text-amber-300"></i><span>Explore Campus Network</span></button>'
    + '        <button id="hero-cta-library" type="button" class="flex max-w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white/20"><i class="fa-solid fa-book-open shrink-0 text-teal-200"></i><span>Open Library</span></button>'
    + '      </div>'
    + '    </div>'
    + '  </section>'
    + '  <section class="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-teal-50 p-6 shadow-sm sm:p-8" aria-label="Daily scripture">'
    + '    <div class="mb-3 flex flex-wrap items-center gap-2">'
    + '      <span class="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900"><i class="fa-solid fa-scroll mr-1 text-amber-700"></i> Daily Oneness Doctrine Focus</span>'
    + '      <span class="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">' + escapeHTML(verse.theme) + '</span>'
    + '    </div>'
    + '    <h2 class="mb-2 break-words text-xl font-black text-slate-900 sm:text-2xl">' + escapeHTML(verse.verse) + '</h2>'
    + '    <p class="max-w-3xl text-sm italic leading-relaxed text-slate-700 sm:text-base">“' + escapeHTML(verse.text) + '”</p>'
    + '  </section>'
    + '  <section aria-labelledby="home-fellowship-overview-title">'
    + '    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">'
    + '      <div><p class="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-700">ACE-USF at a glance</p><h2 id="home-fellowship-overview-title" class="mt-1 text-2xl font-black tracking-tight text-slate-900">Fellowship Overview</h2></div>'
    + '      <p id="home-stats-status" role="status" aria-live="polite" class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm"><span class="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-sky-300"></span>Connecting to live records</p>'
    + '    </div>'
    + '    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Live university, leader, and library totals">'
    +       statCards.map(function (card) {
              return ''
                + '<article class="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">'
                + '  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ' + card.colorClass + '"><i class="fa-solid ' + card.icon + '"></i></div>'
                + '  <div class="min-w-0"><p data-home-stat="' + card.key + '" class="text-2xl font-extrabold tracking-tight text-slate-900">—</p><p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">' + card.label + '</p></div>'
                + '</article>';
            }).join("")
    + '    </div>'
    + '  </section>'
    + '  <section>'
    + '    <div class="mb-5">'
    + '      <h2 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Explore Portal Hubs</h2>'
    + '      <p class="text-sm text-slate-500">Connect with fellowship communities, study resources, and local churches.</p>'
    + '    </div>'
    + '    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">' + PORTAL_SERVICES.map(renderServiceCard).join("") + '</div>'
    + '  </section>'
    + '  <footer class="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-amber-50 px-6 py-5 text-center shadow-sm sm:px-8">'
    + '    <p id="home-blessing-message" class="mx-auto max-w-3xl break-words text-sm font-semibold leading-7 text-slate-700 sm:text-base"></p>'
    + '  </footer>'
    + '</div>';

  updateHomeGreeting(activeHomeUser);
  applyHomeStats();
  startHomeStats();
  startHomeClock();

  window.setTimeout(function () {
    const anchor = document.getElementById("home-section-top");
    if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);

  const networkButton = document.getElementById("hero-cta-network");
  if (networkButton) {
    networkButton.onclick = function () {
      const navButton = document.getElementById("nav-campus-network");
      if (navButton) navButton.click();
    };
  }

  const libraryButton = document.getElementById("hero-cta-library");
  if (libraryButton) {
    libraryButton.onclick = function () {
      const libraryButtons = document.querySelectorAll(".lang-text-library");
      if (libraryButtons.length) libraryButtons[0].click();
    };
  }

  container.querySelectorAll(".btn-hub-nav-trigger").forEach(function (button) {
    button.onclick = function () {
      const actionKey = button.getAttribute("data-action-key");
      if (actionKey === "network") {
        const navButton = document.getElementById("nav-campus-network");
        if (navButton) navButton.click();
      } else if (actionKey === "library") {
        const libraryButtons = document.querySelectorAll(".lang-text-library");
        if (libraryButtons.length) libraryButtons[0].click();
      } else if (actionKey === "church") {
        const churchCard = document.getElementById("church-locator-card");
        if (churchCard) churchCard.click();
      }
    };
  });
}

