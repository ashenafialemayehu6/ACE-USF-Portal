/**
 * js/fellowship_leaders.js
 * Fellowship Leaders & Campus Coordinators Section Controller
 * Features: Role filtering, campus search, contact actions, and spiritual oversight cards.
 */

const LEADERS_DATA = [
  {
    id: 1,
    name: "Alemayehu Tadesse",
    role: "Spiritual Father & National Advisor",
    campus: "National Headquarters - Addis Ababa",
    category: "spiritual",
    phone: "+251 91 123 4567",
    telegram: "@PastorAlemayehu_ACE",
    bio: "Providing pastoral care, doctrinal oversight, and spiritual guidance for national campus movements.",
    avatarBg: "bg-amber-500/10 text-amber-600 border-amber-200"
  },
  {
    id: 2,
    name: "Brook Demissie",
    role: "National Fellowship President",
    campus: "Addis Ababa University (Main / Sidist Kilo)",
    category: "national",
    phone: "+251 92 345 6789",
    telegram: "@Brook_Demissie",
    bio: "Coordinates inter-campus prayer chains, annual student summits, and national administrative strategies.",
    avatarBg: "bg-teal-500/10 text-teal-700 border-teal-200"
  },
  {
    id: 3,
    name: "Hanna Girma",
    role: "National Secretary & Academic Mentor",
    campus: "Hawassa University (Main Campus)",
    category: "national",
    phone: "+251 93 456 7890",
    telegram: "@Hanna_Girma_ACE",
    bio: "Oversees student welfare, peer tutoring networks, and literature distribution across southern regional campuses.",
    avatarBg: "bg-indigo-500/10 text-indigo-700 border-indigo-200"
  },
  {
    id: 4,
    name: "Ephrem Kebede",
    role: "Campus Chapter Coordinator",
    campus: "Jimma University (Main Campus)",
    category: "campus",
    phone: "+251 94 567 8901",
    telegram: "@Ephrem_Kebede",
    bio: "Leads weekly departmental Bible studies, prayer cells, and new student orientation programs.",
    avatarBg: "bg-slate-900 text-amber-400 border-slate-800"
  },
  {
    id: 5,
    name: "Bethelhem Assefa",
    role: "Campus Chapter Coordinator",
    campus: "Bahir Dar University (Poly Campus)",
    category: "campus",
    phone: "+251 95 678 9012",
    telegram: "@Bethel_Assefa",
    bio: "Coordinates regional fellowship gatherings, worship teams, and community outreach in Amhara region institutions.",
    avatarBg: "bg-teal-500/10 text-teal-700 border-teal-200"
  },
  {
    id: 6,
    name: "Dr. Samuel Tesfaye",
    role: "Elders' Wisdom Council Lead",
    campus: "Addis Ababa Science & Technology University (AASTU)",
    category: "spiritual",
    phone: "+251 96 789 0123",
    telegram: "@DrSamuel_Tesfaye",
    bio: "Mentoring engineering and medical students in balancing rigorous academic standards with spiritual dedication.",
    avatarBg: "bg-amber-500/10 text-amber-600 border-amber-200"
  }
];

export function renderFellowshipLeadersSection(containerId = "main-content") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <!-- Top Anchor for Smooth Scroll -->
    <div id="leaders-section-top" class="scroll-mt-8"></div>

    <!-- Hero Header -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl mb-8 border border-slate-800">
      <div class="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10 max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
          <i class="fa-solid fa-users text-amber-400"></i> Fellowship Directory
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
          Connect with Leadership & Coordinators
        </h1>

        <p class="text-slate-300 text-base md:text-lg leading-relaxed font-normal mb-6">
          Reach out to spiritual advisors, national executives, and campus chapter leaders for guidance, fellowship coordination, or prayer support across all Ethiopian higher education institutions.
        </p>

        <!-- Search & Filter Bar -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" id="leader-search-input" placeholder="Search by name, campus, or role..." 
              class="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 transition">
          </div>
          <select id="leader-category-select" class="px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:border-teal-500 transition">
            <option value="all">All Categories</option>
            <option value="spiritual">Spiritual Fathers & Elders</option>
            <option value="national">National Executives</option>
            <option value="campus">Campus Coordinators</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Leaders Grid Container -->
    <div id="leaders-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      ${renderLeaderCards(LEADERS_DATA)}
    </div>
  `;

  // Attach search and filter interactivity
  setupLeaderFilters();

  // Smooth scroll to top
  setTimeout(() => {
    const topAnchor = document.getElementById("leaders-section-top");
    if (topAnchor) topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

function renderLeaderCards(data) {
  if (data.length === 0) {
    return `
      <div class="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4 text-2xl">
          <i class="fa-solid fa-user-slash"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-1">No Leaders Found</h3>
        <p class="text-slate-500 text-xs">Try adjusting your search terms or category filter.</p>
      </div>
    `;
  }

  return data.map(leader => `
    <div class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl ${leader.avatarBg} border flex items-center justify-center text-lg font-bold">
            <i class="fa-solid fa-user-tie"></i>
          </div>
          <span class="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 uppercase">
            ${leader.category}
          </span>
        </div>

        <h3 class="text-lg font-bold text-slate-900 mb-1">${leader.name}</h3>
        <p class="text-xs font-semibold text-amber-600 mb-2">${leader.role}</p>
        <p class="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
          <i class="fa-solid fa-building-columns text-slate-400"></i> ${leader.campus}
        </p>

        <p class="text-slate-600 text-xs leading-relaxed mb-6 border-t border-slate-100 pt-3">
          ${leader.bio}
        </p>
      </div>

      <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
        <a href="tel:${leader.phone}" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-phone text-teal-600"></i> Call
        </a>
        <a href="https://t.me/${leader.telegram.replace('@', '')}" target="_blank" class="flex-1 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-teal-200">
          <i class="fa-brands fa-telegram text-teal-600"></i> Telegram
        </a>
      </div>
    </div>
  `).join('');
}

function setupLeaderFilters() {
  const searchInput = document.getElementById("leader-search-input");
  const categorySelect = document.getElementById("leader-category-select");
  const gridContainer = document.getElementById("leaders-grid");

  if (!searchInput || !categorySelect || !gridContainer) return;

  const filterLeaders = () => {
    const query = searchInput.value.toLowerCase().trim();
    const category = categorySelect.value;

    const filtered = LEADERS_DATA.filter(leader => {
      const matchesQuery = 
        leader.name.toLowerCase().includes(query) ||
        leader.role.toLowerCase().includes(query) ||
        leader.campus.toLowerCase().includes(query) ||
        leader.bio.toLowerCase().includes(query);

      const matchesCategory = (category === "all" || leader.category === category);

      return matchesQuery && matchesCategory;
    });

    gridContainer.innerHTML = renderLeaderCards(filtered);
  };

  searchInput.addEventListener("input", filterLeaders);
  categorySelect.addEventListener("change", filterLeaders);
}