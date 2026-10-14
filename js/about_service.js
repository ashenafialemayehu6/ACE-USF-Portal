/**
 * js/about_service.js
 * Master About Section Controller for ACE-USF Portal
 */

const ABOUT_PILLARS = [
  {
    icon: "fa-cross",
    title: "Apostolic Truth & Oneness",
    badge: "Acts 2:38",
    description: "Firmly rooted in One God doctrine, holy living, and continuous spiritual growth across higher education campuses."
  },
  {
    icon: "fa-graduation-cap",
    title: "Academic Excellence",
    badge: "Mentorship",
    description: "Fostering disciplined academic habits, peer tutoring, and stream-specific guidance for all study years."
  },
  {
    icon: "fa-network-wired",
    title: "National Student Network",
    badge: "48+ Campuses",
    description: "Uniting thousands of Apostolic students across public and private universities through shared prayer and study."
  },
  {
    icon: "fa-hands-holding-child",
    title: "Pastoral & Senior Guidance",
    badge: "Elders' Council",
    description: "Connecting youth with Spiritual Fathers, Mothers, and senior alumni for spiritual and career counseling."
  }
];

const GOVERNANCE_LEVELS = [
  {
    role: "Spiritual Fathers & Mothers",
    focus: "Pastoral Oversight & Doctrinal Truth",
    icon: "fa-user-tie"
  },
  {
    role: "Elders' Wisdom Council",
    focus: "Advisory, Prayer Chains & Counseling",
    icon: "fa-shield-halved"
  },
  {
    role: "National Executive Board",
    focus: "Inter-Campus Strategy & Annual Summits",
    icon: "fa-sitemap"
  },
  {
    role: "Campus Chapter Leaders",
    focus: "Weekly Gatherings & Departmental Bible Studies",
    icon: "fa-building-columns"
  }
];

export function renderAboutSection(containerId = "main-content") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found!`);
    return;
  }

  container.innerHTML = `
    <!-- Top Anchor for Smooth Scroll -->
    <div id="about-section-top" class="scroll-mt-8"></div>

    <!-- Hero Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl mb-8 border border-slate-800">
      <div class="relative z-10 max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
          <i class="fa-solid fa-circle-info text-amber-400"></i> About ACE-USF Portal
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
          Standing Firm in Truth. Excelling in Purpose.
        </h1>

        <p class="text-slate-300 text-base md:text-lg leading-relaxed font-normal mb-6">
          The <strong>Apostolic Church of Ethiopia University Students Fellowship (ACE-USF)</strong> is a national movement dedicated to nurturing Apostolic youth throughout their higher education journey—connecting faith, academic mastery, and servant leadership.
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <button id="about-cta-network" class="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/30 transition flex items-center gap-2">
            <i class="fa-solid fa-network-wired text-amber-300"></i> Explore Chapters
          </button>
          <button id="about-cta-library" class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/15 backdrop-blur-md transition flex items-center gap-2">
            <i class="fa-solid fa-book-open text-teal-300"></i> Open Library
          </button>
        </div>
      </div>
    </div>

    <!-- Impact & Reach Statistics Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-center">
        <h3 class="text-3xl font-black text-slate-900 tracking-tight">48+</h3>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">University Chapters</p>
      </div>
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-center">
        <h3 class="text-3xl font-black text-amber-600 tracking-tight">12,500+</h3>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Active Students</p>
      </div>
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-center">
        <h3 class="text-3xl font-black text-teal-600 tracking-tight">500+</h3>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Library Resources</p>
      </div>
      <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-center">
        <h3 class="text-3xl font-black text-indigo-600 tracking-tight">100%</h3>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Apostolic Truth</p>
      </div>
    </div>

    <!-- Four Pillars Grid -->
    <div class="mb-10">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight mb-1">Our Core Pillars</h2>
        <p class="text-slate-500 text-sm">Principles guiding our national fellowship, pastoral care, and student resources.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${ABOUT_PILLARS.map(p => `
          <div class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center text-xl">
                  <i class="fa-solid ${p.icon}"></i>
                </div>
                <span class="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">${p.badge}</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 mb-2">${p.title}</h3>
              <p class="text-slate-600 text-xs leading-relaxed mb-4">${p.description}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Spiritual Governance & Mentorship -->
    <div class="bg-slate-900 text-white rounded-3xl p-8 md:p-10 mb-10 border border-slate-800">
      <div class="max-w-2xl mb-8">
        <span class="text-xs font-extrabold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Spiritual Structure</span>
        <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-3 mb-2">Guidance & Governance</h2>
        <p class="text-slate-400 text-sm leading-relaxed">Structured spiritual oversight ensuring order, wisdom, and pastoral care across all campuses in Ethiopia.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${GOVERNANCE_LEVELS.map(g => `
          <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-sm">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-3">
              <i class="fa-solid ${g.icon}"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-100 mb-1">${g.role}</h4>
            <p class="text-slate-400 text-xs leading-relaxed">${g.focus}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Internal Navigation Handlers
  const ctaNetwork = document.getElementById("about-cta-network");
  const ctaLibrary = document.getElementById("about-cta-library");

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
}