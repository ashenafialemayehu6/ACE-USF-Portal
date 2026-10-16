/**
 * js/home_service.js
 * Home dashboard for ACE-USF.
 * Live totals come from published records in the admin-managed Firestore collections.
 */

import { db } from "./firebase_config.js";
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
let homeStats = { chapters: null, students: null, leaders: null, resources: null };
let homeStatsStarted = false;
let homeClockStarted = false;

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
  const hour = getEthiopiaHour(date);
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
    element.textContent = value == null ? "—" : formatCount(value);
  });
}

function countNamedLeaders(rows) {
  return rows.reduce(function (total, row) {
    if (row.active === false) return total;

    if (Array.isArray(row.leaders)) {
      return total + row.leaders.filter(function (leader) {
        return leader && String(leader.fullName || leader.name || "").trim().length > 0;
      }).length;
    }

    const namedFields = [
      row.astebabariName,
      row.genzebYazhName,
      row.tsehafiName
    ];
    return total + namedFields.filter(function (name) {
      return String(name || "").trim().length > 0;
    }).length;
  }, 0);
}

function startHomeStats() {
  if (homeStatsStarted) return;
  homeStatsStarted = true;

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

    homeStats.chapters = records.length;
    homeStats.students = records.reduce(function (total, record) {
      const members = Number(record.activeMembers);
      return total + (Number.isFinite(members) && members > 0 ? members : 0);
    }, 0);
    homeStats.leaders = countNamedLeaders(records);
    applyHomeStats();
  }, function (error) {
    console.error("Could not load published fellowship totals:", error);
  });

  const publicResources = query(
    collection(db, "siteContent", "library", "items"),
    where("published", "==", true)
  );

  onSnapshot(publicResources, function (snapshot) {
    homeStats.resources = snapshot.docs.filter(function (document) {
      return document.data().active !== false;
    }).length;
    applyHomeStats();
  }, function (error) {
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
    + '  <button type="button" data-action-key="' + escapeHTML(service.actionKey) + '" class="btn-hub-nav-trigger flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-teal-700">'
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
    { key: "students", label: "Active members", icon: "fa-users", colorClass: "bg-amber-50 text-amber-700" },
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
    + '  <section class="relative isolate overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 px-6 py-9 text-white shadow-2xl sm:px-10 sm:py-12">'
    + '    <div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"></div>'
    + '    <div aria-hidden="true" class="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"></div>'
    + '    <div class="relative z-10 max-w-3xl">'
    + '      <p id="home-greeting-context" class="mb-4 inline-flex max-w-full flex-wrap items-center rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-teal-200 sm:text-xs"></p>'
    + '      <h1 id="home-greeting-title" class="mb-4 max-w-full break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl"></h1>'
    + '      <p class="mb-8 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Uniting and empowering Apostolic students across public and private universities and colleges in Ethiopia through pastoral teaching, spiritual literature, worship networks, and academic mentorship.</p>'
    + '      <div class="flex flex-wrap items-center gap-3">'
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
    + '  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Live fellowship totals">'
    +       statCards.map(function (card) {
              return ''
                + '<article class="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">'
                + '  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ' + card.colorClass + '"><i class="fa-solid ' + card.icon + '"></i></div>'
                + '  <div class="min-w-0"><p data-home-stat="' + card.key + '" class="text-2xl font-extrabold tracking-tight text-slate-900">—</p><p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">' + card.label + '</p></div>'
                + '</article>';
            }).join("")
    + '  </section>'
    + '  <section>'
    + '    <div class="mb-5">'
    + '      <h2 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">Explore Portal Hubs</h2>'
    + '      <p class="text-sm text-slate-500">Connect with fellowship communities, study resources, and local churches.</p>'
    + '    </div>'
    + '    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">' + PORTAL_SERVICES.map(renderServiceCard).join("") + '</div>'
    + '  </section>'
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

