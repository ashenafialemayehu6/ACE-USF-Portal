/**
 * js/home_service.js
 * World-Class Standardized Home Controller for ACE-USF Portal
 * Features: Automatic Real-Time Date & Time Greetings, Smooth Auto-Scroll,
 * Doctrinal "One God" Scriptural Rotator, Dual Calendar, and International UI.
 */

// Daily Apostolic Doctrinal Verses (Focused Exclusively on ONE GOD)
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
    text: "One Lord, one faith, one baptism; one God and Father of all, who is above all, and through all, and in you all.",
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
    id: "svc-network",
    title: "Campus Network & Fellowships",
    badge: "National Chapters",
    icon: "fa-network-wired",
    description: "Explore 48+ university chapters, departmental Bible study groups, Women's Sanctuary, and Elders' Wisdom Council.",
    actionKey: "network"
  },
  {
    id: "svc-library",
    title: "Apostolic & Academic Library",
    badge: "Dual-Room Library",
    icon: "fa-book-bible",
    description: "Access spiritual literature, pastoral teachings, and academic study resources tailored by stream and department.",
    actionKey: "library"
  },
  {
    id: "svc-church",
    title: "Church & Assembly Locator",
    badge: "Regional Maps",
    icon: "fa-church",
    description: "Locate local Apostolic Church assemblies and student gathering hubs across higher education cities in Ethiopia.",
    actionKey: "church"
  }
];

let intercessionCount = 1420;

/**
 * Calculates current time of day greeting and formatted dates
 */
function getAutomatedTimeAndDate() {
  const now = new Date();
  const hours = now.getHours();

  // Automated Time Greeting
  let timeGreeting = "Good Day";
  if (hours >= 5 && hours < 12) {
    timeGreeting = "Good Morning";
  } else if (hours >= 12 && hours < 17) {
    timeGreeting = "Good Afternoon";
  } else {
    timeGreeting = "Good Evening";
  }

  // Automatic Gregorian Calendar Format
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const gregorianDate = now.toLocaleDateString('en-US', options);

  // Approximate Ethiopian Calendar Converter logic
  const ethMonths = ["መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"];
  const ethMonthName = ethMonths[(now.getMonth() + 1) % 12] || "ጥቅምት";
  const ethDay = (now.getDate() + 20) % 30 || 13;
  const ethYear = now.getFullYear() - 7;
  const ethiopianDate = `${ethMonthName} ${ethDay}, ${ethYear} ዓ.ም`;

  return { timeGreeting, gregorianDate, ethiopianDate };
}

/**
 * Gets the student's short first name
 */
function getFirstName(fullName) {
  if (!fullName) return "Apostolic Fellow";
  return fullName.trim().split(" ")[0];
}

/**
 * Main Home Render Function with Smooth Scrolling
 */
export function renderHomeSection(containerId = "main-content", user = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const firstName = user?.displayName ? getFirstName(user.displayName) : "Fellow";
  const userCampusText = user?.campus ? ` • ${user.campus}` : "";

  const { timeGreeting, gregorianDate, ethiopianDate } = getAutomatedTimeAndDate();

  // Select Daily Doctrinal Verse based on day of month
  const todayDoctrinalVerse = ONE_GOD_DOCTRINAL_VERSES[new Date().getDate() % ONE_GOD_DOCTRINAL_VERSES.length];

  container.innerHTML = `
    <!-- Anchor Header for Smooth Scroll -->
    <div id="home-section-top" class="scroll-mt-8"></div>

    <!-- International Glassmorphic Top Header Bar (Automated Date & Timezone) -->
    <div class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-teal-200 text-xs font-medium px-5 py-3.5 rounded-2xl mb-8 shadow-md border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-bold text-white tracking-wider uppercase text-[11px]">ACE-USF Global Portal Active</span>
      </div>

      <div class="flex items-center gap-4 text-slate-300 text-xs">
        <span class="flex items-center gap-1.5"><i class="fa-regular fa-calendar text-amber-400"></i> ${gregorianDate}</span>
        <span class="text-slate-600">|</span>
        <span class="text-amber-300 font-semibold"><i class="fa-solid fa-globe text-teal-400"></i> ${ethiopianDate}</span>
      </div>
    </div>

    <!-- Hero Banner with Personalized Time-Based Greeting -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl mb-8 border border-slate-800">
      <div class="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
          <i class="fa-solid fa-sparkles text-amber-400"></i> ${timeGreeting}, ${firstName}! ${userCampusText}
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
          ${timeGreeting}, ${firstName}!
        </h1>

        <p class="text-slate-300 text-base md:text-lg leading-relaxed font-normal mb-8">
          Uniting and empowering Apostolic students across public and private universities and colleges in Ethiopia through pastoral teachings, spiritual literature, worship networks, and academic mentorship.
        </p>

        <!-- Quick Action Hero CTA Buttons -->
        <div class="flex flex-wrap items-center gap-3">
          <button id="hero-cta-network" class="px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2">
            <i class="fa-solid fa-network-wired text-amber-300"></i>
            Explore Campus Network
          </button>

          <button id="hero-cta-library" class="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/15 backdrop-blur-md transition-all flex items-center gap-2">
            <i class="fa-solid fa-book-open text-teal-300"></i>
            Open Library
          </button>
        </div>
      </div>
    </div>

    <!-- Daily "One God" Doctrinal Scripture Banner -->
    <div class="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
              <i class="fa-solid fa-scroll text-amber-600"></i> Daily Oneness Doctrine Focus
            </span>
            <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">${todayDoctrinalVerse.theme}</span>
          </div>

          <h3 class="text-xl md:text-2xl font-black text-slate-900 mb-2">"${todayDoctrinalVerse.verse}"</h3>
          <p class="text-slate-800 text-base md:text-lg italic font-medium leading-relaxed max-w-3xl">
            "${todayDoctrinalVerse.text}"
          </p>
        </div>
        <div class="hidden sm:flex w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 items-center justify-center text-xl shrink-0 shadow-md">
          <i class="fa-solid fa-quote-right"></i>
        </div>
      </div>
    </div>

    <!-- Impact Statistics & Live Prayer Counter -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-building-columns"></i>
        </div>
        <div>
          <h4 class="text-2xl font-extrabold text-slate-900 tracking-tight">48+</h4>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chapters</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-users"></i>
        </div>
        <div>
          <h4 class="text-2xl font-extrabold text-slate-900 tracking-tight">12,500+</h4>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-book-open text-indigo-600"></i>
        </div>
        <div>
          <h4 class="text-2xl font-extrabold text-slate-900 tracking-tight">500+</h4>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resources</p>
        </div>
      </div>

      <div class="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h4 id="intercession-counter-display" class="text-2xl font-black text-amber-400 tracking-tight">${intercessionCount}</h4>
          <p class="text-[11px] font-semibold text-teal-200 uppercase tracking-wider">Intercessions This Week</p>
        </div>
        <button id="btn-add-intercession" class="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1 shrink-0">
          <i class="fa-solid fa-hands-praying"></i> Pray
        </button>
      </div>
    </div>

    <!-- Portal Services Hub Cards Grid -->
    <div class="mb-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight mb-1">Explore Portal Hubs</h2>
        <p class="text-slate-500 text-sm">Direct shortcuts to community networks, study literature, and local churches.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${PORTAL_SERVICES.map(svc => `
          <div class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center text-xl">
                  <i class="fa-solid ${svc.icon}"></i>
                </div>
                <span class="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">${svc.badge}</span>
              </div>

              <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition">${svc.title}</h3>
              <p class="text-slate-600 text-sm leading-relaxed mb-6">${svc.description}</p>
            </div>

            <button data-action-key="${svc.actionKey}" class="btn-hub-nav-trigger w-full py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2">
              <span>Open Hub</span>
              <i class="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1"></i>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Standard smooth auto-scroll execution to section top
  setTimeout(() => {
    const topAnchor = document.getElementById("home-section-top");
    if (topAnchor) {
      topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 50);

  // Attach Button Handlers
  const prayBtn = document.getElementById("btn-add-intercession");
  if (prayBtn) {
    prayBtn.onclick = () => {
      intercessionCount += 1;
      const counterEl = document.getElementById("intercession-counter-display");
      if (counterEl) counterEl.textContent = intercessionCount;
    };
  }

  const ctaNetwork = document.getElementById("hero-cta-network");
  const ctaLibrary = document.getElementById("hero-cta-library");

  if (ctaNetwork) {
    ctaNetwork.onclick = () => {
      const navBtn = document.getElementById("nav-campus-network");
      if (navBtn) navBtn.click();
    };
  }

  if (ctaLibrary) {
    ctaLibrary.onclick = () => {
      const libBtns = document.querySelectorAll(".lang-text-library");
      if (libBtns.length > 0) libBtns[0].click();
    };
  }

  container.querySelectorAll(".btn-hub-nav-trigger").forEach(btn => {
    btn.onclick = (e) => {
      const actionKey = e.currentTarget.getAttribute("data-action-key");
      if (actionKey === "network") {
        const navBtn = document.getElementById("nav-campus-network");
        if (navBtn) navBtn.click();
      } else if (actionKey === "library") {
        const libBtns = document.querySelectorAll(".lang-text-library");
        if (libBtns.length > 0) libBtns[0].click();
      } else if (actionKey === "church") {
        const churchCard = document.getElementById("church-locator-card");
        if (churchCard) churchCard.click();
      }
    };
  });
}