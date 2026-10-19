import { auth, db } from "./firebase_config.js";
import { collection, doc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { seniorDepartments } from "./academic_data.js";

const safe = value => String(value ?? "").replace(/[&<>\"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
})[character]);

/**
 * js/campus_network.js
 * World-Class Standardized Campus Network & Ministries Module
 * Features: Smooth Auto-Scroll, Departmental Bible Studies, Apostolic Modesty Standards, 
 * Distinct Elders/Mothers Counsel Photos, and National Prayer & Fasting Bulletin.
 */

// Default Campus Data
const DEFAULT_CAMPUSES = [
  {
    id: "usf-main",
    name: "Diredawa USF Fellowship",
    location: "Diredawa  — Sabiyan",
    membersCount: 145,
    leader: "DR. Misael B.",
    meetingTime: "Fridays @ 6:00 PM",
    description: "Our primary campus fellowship holding weekly transformative Bible studies, vibrant worship nights, and close-knit mentorship circles.",
    category: "Main",
    tags: ["Weekly Gathering", "Worship Night", "Mentorship"],
    bannerImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    rsvpCount: 38,
    contactTelegram: "@Mise100",
    contactPhone: "+251916072727",
    announcements: [
      { date: "Today", author: "DR. Misael B.", text: "Fasting & Prayer Night this Friday at the main assembly hall!" },
      { date: "Oct 08", author: "Leader Team", text: "New discipleship clusters are officially forming. Check in with your cluster leader." }
    ]
  },
  {
    id: "usf-health",
    name: "USF Health & Medical Fellowship",
    location: "Dil Chora Specialized Hospital",
    membersCount: 68,
    leader: "Dr. Misael B.",
    meetingTime: "Wednesdays @ 5:30 PM",
    description: "A dedicated sanctuary for medical, nursing, and public health students balancing clinical studies with a thriving faith community.",
    category: "Medical",
    tags: ["Healthcare", "Bio-Ethics", "Peer Support"],
    bannerImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    rsvpCount: 22,
    contactTelegram: "@Mise100",
    contactPhone: "+251916072727",
    announcements: [
      { date: "Yesterday", author: "Dr. Misael B.", text: "Medical Ethics & Faith Panel discussion scheduled for next Wednesday evening." }
    ]
  },
  {
    id: "usf-engineering",
    name: "Engineering & Tech Ministry",
    location: "AAU 5 Kilo — Faculty of Technology (BiT)",
    membersCount: 82,
    leader: "Amanuel K.",
    meetingTime: "Thursdays @ 6:30 PM",
    description: "A dynamic community for engineering, computer science, and tech innovators focused on purposeful building, ethics, and leadership.",
    category: "STEM",
    tags: ["Tech & Faith", "Innovation", "Discipleship"],
    bannerImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    rsvpCount: 29,
    contactTelegram: "@Amanuel_Tech",
    contactPhone: "+251933456789",
    announcements: [
      { date: "2 days ago", author: "Amanuel K.", text: "Tech mentorship pairing meeting right after this Thursday's fellowship!" }
    ]
  }
];

// Departmental Bible Studies
const DEPARTMENT_BIBLE_STUDIES = [
  {
    id: "dept-health",
    title: "Health Sciences & Clinical Discipleship",
    department: "Medical, Nursing, Pharmacy & Public Health",
    icon: "fa-user-nurse",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80",
    motto: "Heal the sick and say to them: The Kingdom of God has come near to you.",
    mottoVerse: "Luke 10:9",
    weeklyTopic: "Healing as Divine Vocation & Sanctified Hands in Medicine",
    scripture: "Luke 10:33-35 & Colossians 3:23",
    schedule: "Every Wednesday @ 7:00 PM",
    description: "Integrating clinical diagnostic excellence with pastoral empathy, maintaining spiritual stamina during hospital ward rounds, and honoring Christ in patient care."
  },
  {
    id: "dept-tech",
    title: "Engineering, Tech & Applied Sciences",
    department: "Engineering, Computer Science, IT & Architecture",
    icon: "fa-laptop-code",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    motto: "He has filled him with the Spirit of God, with wisdom, with understanding, with knowledge and with all kinds of skills.",
    mottoVerse: "Exodus 35:31",
    weeklyTopic: "Kingdom Stewardship in Artificial Intelligence & Engineering",
    scripture: "Exodus 31:3-5 & Genesis 1:28",
    schedule: "Every Thursday @ 6:00 PM",
    description: "Building technology with integrity, applying Biblical principles to technical problem solving, and honoring God as the Master Architect."
  },
  {
    id: "dept-social",
    title: "Social Sciences, Law & Business",
    department: "Sociology, Psychology, Law, Economics & Humanities",
    icon: "fa-scale-balanced",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    motto: "Learn to do right; seek justice. Defend the oppressed. Take up the cause of the fatherless; plead the case of the widow.",
    mottoVerse: "Isaiah 1:17",
    weeklyTopic: "Kingdom Justice, Civil Integrity & Christian Leadership",
    scripture: "Micah 6:8 & Proverbs 31:8-9",
    schedule: "Every Tuesday @ 6:30 PM",
    description: "Living out unshakeable truth in public service, legal ethics, economic development, and servant leadership across society."
  },
  {
    id: "dept-freshman",
    title: "Freshman Discipleship & Campus Transition",
    department: "First-Year Students (All Streams)",
    icon: "fa-graduation-cap",
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=800&q=80",
    motto: "How can a young person stay on the path of purity? By living according to Your Word.",
    mottoVerse: "Psalm 119:9",
    weeklyTopic: "Rooted Convictions & Thriving in University Life",
    scripture: "Colossians 2:6-7 & Daniel 1:8",
    schedule: "Every Monday @ 5:30 PM",
    description: "Equipping new university students with deep spiritual roots, strong peer support networks, and wisdom to navigate campus independence."
  }
];

// Elders, Spiritual Fathers & Mothers Guidance Counsel Data (With Distinct Photos & Apostolic Standards)
function readStoredArray(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

let eldersWisdomData = readStoredArray("ace_elders_wisdom", [
  {
    id: 1,
    title: "Preserving Holy Identity and Prayer Altar in University",
    speaker: "Elder Father  Tadesse G.",
    category: "Spiritual Father Counsel",
    date: "Apostolic Advisory",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    summary: "Dear children, do not let academic pressure extinguish your private prayer closet. Study diligently, but never omit 30 minutes of intimate fellowship with the Holy Spirit before sunrise."
  },
  {
    id: 2,
    title: "Walking in Modesty, Virtue, and Holiness on Campus",
    speaker: "Mother in Israel Sister-Elder Almaz M.",
    category: "Spiritual Mother Counsel",
    date: "Matriarchal Wisdom",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
    summary: "True Christian beauty is clothed in modesty, quiet spirit, and good works. Reject worldly fashions, trousers, and ornaments; let your garment reflect the purity of the Apostolic faith."
  }
]);

// Women's Ministry Experience Sharing Posts (Aligned with Apostolic Standards)
let womensMinistryPosts = readStoredArray("ace_womens_ministry_posts", [
  {
    id: 1,
    author: "Sister Rahel M.",
    role: "Senior Medical Student",
    date: "3 days ago",
    title: "Maintaining Purity and Modesty in Modern Campus Culture",
    content: "As sisters in the Apostolic faith, our outward appearance and inward character should set us apart as holy vessels. Standing firm in modest apparel brings immense peace."
  }
]);

// National Prayer & Fasting Bulletin Board Data
let prayerBulletinData = readStoredArray("ace_prayer_bulletin", [
  {
    id: 1,
    campus: "Addis Ababa University (AAU)",
    author: "Brother Daniel K.",
    request: "Pray for our upcoming campus evangelism week and spiritual awakening among freshman students.",
    prayerCount: 42,
    date: "2 hours ago"
  },
  {
    id: 2,
    campus: "Diredawa University",
    author: "Sister RUHAMA.",
    request: "Fasting prayer for engineering and medical students facing midterm examinations this week.",
    prayerCount: 31,
    date: "Yesterday"
  }
]);

let campusNetworkData = readStoredArray("ace_campus_network_data", DEFAULT_CAMPUSES);
let currentFilter = "All";
let searchQuery = "";
let sectionSearchQuery = "";
let activeTab = "directory"; // "directory", "bible-studies", "womens-ministry", "elders-council", "prayer-bulletin"
let campusProfile = null;
let campusMembership = null;
let campusCoordinators = [];
let campusIdentityUid = "";
let campusIdentityLoading = false;
let campusIdentityRevision = 0;

const COLLEGE_SCHOOLS = [
  {
    id: "medicine-health-sciences",
    title: "College of Medicine & Health Sciences",
    groups: ["Health Sciences"],
    accessGroups: ["healthSciences"],
    icon: "fa-heart-pulse",
    description: "A shared Bible study and fellowship for students serving in medicine, nursing, pharmacy, and public health."
  },
  {
    id: "engineering-technology",
    title: "College of Engineering & Technology",
    groups: ["Engineering & Tech"],
    accessGroups: ["technology", "engineering", "engineeringTech"],
    icon: "fa-microchip",
    description: "One school community for engineering, computing, software, electrical, civil, and technology departments."
  },
  {
    id: "social-sciences",
    title: "College of Social Sciences",
    groups: ["Business & Economics", "Law & Humanities"],
    accessGroups: ["socialSciences", "business", "lawGovernance", "socialSciencesCollege"],
    icon: "fa-scale-balanced",
    description: "A connected school for social, business, economics, law, and humanities departments."
  }
];

function collegeForDepartment(department) {
  const record = seniorDepartments.find(item => item.name === department);
  return record ? COLLEGE_SCHOOLS.find(school => school.groups.includes(record.group)) || null : null;
}

function campusCanOpenSchool(school) {
  return Boolean(auth.currentUser && campusProfile?.department && collegeForDepartment(campusProfile.department)?.id === school.id
    && campusMembership?.active === true
    && campusMembership.department === campusProfile.department
    && school.accessGroups.includes(campusMembership.departmentGroup));
}

async function refreshCampusIdentity() {
  const revision = ++campusIdentityRevision;
  const user = auth.currentUser;
  campusIdentityUid = user?.uid || "";
  campusProfile = null;
  campusMembership = null;
  campusIdentityLoading = Boolean(user);
  if (user) {
    try {
      const [profileSnapshot, memberSnapshot, coordinatorsSnapshot] = await Promise.all([
        getDoc(doc(db, "userProfiles", user.uid)),
        getDoc(doc(db, "meetingRoomMembers", user.uid)),
        getDocs(query(collection(db, "siteContent", "campusSchoolCoordinators", "items"), where("published", "==", true)))
      ]);
      if (revision !== campusIdentityRevision) return;
      campusProfile = profileSnapshot.exists() ? profileSnapshot.data() : null;
      campusMembership = memberSnapshot.exists() ? memberSnapshot.data() : null;
      campusCoordinators = coordinatorsSnapshot.docs.map(item => item.data());
    } catch (error) {
      console.warn("Campus Network eligibility could not be refreshed:", error);
    }
  }
  if (revision !== campusIdentityRevision) return;
  campusIdentityLoading = false;
  if (!user) {
    try {
      const coordinatorsSnapshot = await getDocs(query(collection(db, "siteContent", "campusSchoolCoordinators", "items"), where("published", "==", true)));
      if (revision === campusIdentityRevision) campusCoordinators = coordinatorsSnapshot.docs.map(item => item.data());
    } catch (error) { console.warn("Public campus coordinator directory is unavailable:", error); }
  }
  const target = document.getElementById("tab-dynamic-content");
  if (target && activeTab === "bible-studies") renderBibleStudiesTab(target);
}

function applySectionSearch(container) {
  if (!container) return;
  const queryText = sectionSearchQuery.trim().toLocaleLowerCase();
  const records = [...container.querySelectorAll("[data-campus-search-record]")];
  let visible = 0;
  records.forEach(record => {
    const match = !queryText || String(record.dataset.search || record.textContent).toLocaleLowerCase().includes(queryText);
    record.classList.toggle("hidden", !match);
    if (match) visible += 1;
  });
  let empty = container.querySelector("[data-campus-search-empty]");
  if (!empty) {
    empty = document.createElement("div");
    empty.dataset.campusSearchEmpty = "";
    empty.className = "hidden mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600";
    empty.textContent = "No results match your search in this section.";
    container.append(empty);
  }
  empty.classList.toggle("hidden", !queryText || visible > 0);
}

onAuthStateChanged(auth, () => {
  if (document.getElementById("campus-network-section-top")) refreshCampusIdentity();
});

function saveToLocalStorage() {
  localStorage.setItem("ace_campus_network_data", JSON.stringify(campusNetworkData));
  localStorage.setItem("ace_womens_ministry_posts", JSON.stringify(womensMinistryPosts));
  localStorage.setItem("ace_elders_wisdom", JSON.stringify(eldersWisdomData));
  localStorage.setItem("ace_prayer_bulletin", JSON.stringify(prayerBulletinData));
}

/**
 * Main Render Function with Smooth Auto-Scroll
 */
export function renderCampusNetworkSection(containerId = "app-dashboard") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <style>
      .ace-campus-network-shell{min-width:0;color-scheme:light;color:#17243a;isolation:isolate}
      .ace-campus-network-shell *{box-sizing:border-box}
      .ace-campus-network-shell .bg-white,.ace-campus-network-shell .bg-white\/80,.ace-campus-network-shell .bg-slate-50{color:#18263d}
      .ace-campus-network-shell input,.ace-campus-network-shell select,.ace-campus-network-shell textarea{color:#18263d!important;background-color:#fff}
      .ace-campus-network-shell input::placeholder,.ace-campus-network-shell textarea::placeholder{color:#64748b;opacity:1}
      .ace-campus-network-shell img{background:#14243a}
      .ace-campus-network-shell [data-campus-scroll]{min-width:0;max-width:100%;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#9cb2ad #edf2f1}
      .ace-campus-network-shell #tab-dynamic-content{min-width:0;overflow:visible}
      @media(prefers-reduced-motion:reduce){.ace-campus-network-shell *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}
    </style>
    <div class="ace-campus-network-shell min-w-0 w-full">
    <!-- Anchor Header for Smooth Scroll -->
    <div id="campus-network-section-top" class="scroll-mt-8"></div>

    <!-- Hero Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl mb-8 border border-slate-800">
      <div class="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
            <i class="fa-solid fa-sparkles text-amber-400"></i> ACE-USF Campus Network Portal
          </div>
          <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            Campus Network & Ministries
          </h1>
          <p class="text-slate-300 text-base leading-relaxed font-normal">
            Connecting university fellowship chapters, specialized departmental Bible studies, women's ministry sanctuaries, and elders' spiritual wisdom across Ethiopia.
          </p>
        </div>

        <button id="btn-open-register-modal" class="self-start md:self-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2 shrink-0">
          <i class="fa-solid fa-plus text-sm"></i>
          Register New Chapter
        </button>
      </div>
    </div>

    <!-- Navigation Sub-Tabs Bar -->
    <div class="flex items-center gap-3 overflow-x-auto pb-2 mb-8 border-b border-slate-200/80">
      <button id="tab-nav-directory" class="sub-nav-btn px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${activeTab === 'directory' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
        <i class="fa-solid fa-network-wired text-amber-400"></i>
        <span>Chapters</span>
      </button>

      <button id="tab-nav-bible-studies" class="sub-nav-btn px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${activeTab === 'bible-studies' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
        <i class="fa-solid fa-book-bible text-teal-400"></i>
        <span>Bible Studies</span>
      </button>

      <button id="tab-nav-womens-ministry" class="sub-nav-btn px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${activeTab === 'womens-ministry' ? 'bg-pink-900 text-pink-100 shadow-md border border-pink-700' : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'}">
        <i class="fa-solid fa-person-dress text-pink-400"></i>
        <span>Women's Sanctuary</span>
      </button>

      <button id="tab-nav-elders-council" class="sub-nav-btn px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${activeTab === 'elders-council' ? 'bg-amber-950 text-amber-100 shadow-md border border-amber-800' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'}">
        <i class="fa-solid fa-hands-holding-child text-amber-500"></i>
        <span>Fathers & Mothers</span>
      </button>

      <button id="tab-nav-prayer-bulletin" class="sub-nav-btn px-4 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 ${activeTab === 'prayer-bulletin' ? 'bg-teal-900 text-teal-100 shadow-md border border-teal-700' : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'}">
        <i class="fa-solid fa-pray text-teal-400"></i>
        <span>Prayer & Fasting Wall</span>
      </button>
    </div>

    <label class="mb-6 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-600/10">
      <i class="fa-solid fa-magnifying-glass text-teal-700" aria-hidden="true"></i>
      <input id="campus-section-search" type="search" value="${safe(sectionSearchQuery)}" placeholder="Search this section: college, department, campus, leader…" class="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none" autocomplete="off" aria-label="Search the current Campus Network section">
      <span class="hidden shrink-0 text-[10px] font-bold text-slate-400 sm:block">LIVE SEARCH</span>
    </label>

    <!-- Tab Dynamic Container -->
    <div id="tab-dynamic-content"></div>

    <!-- Chapter Registration Modal -->
    <div id="register-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm hidden p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button id="btn-close-modal" class="absolute top-6 right-6 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <h3 class="text-xl font-bold text-slate-900 mb-2">Register New Chapter</h3>
        <p class="text-slate-500 text-xs mb-6">Publish your university fellowship hub to the national network.</p>

        <form id="register-chapter-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Chapter Name</label>
            <input type="text" id="reg-name" required placeholder="e.g. Dire Dawa University Fellowship" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category</label>
              <select id="reg-category" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
                <option value="Main">Main</option>
                <option value="Medical">Medical</option>
                <option value="STEM">STEM</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Location / Campus</label>
              <input type="text" id="reg-location" required placeholder="e.g. Main Hall" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Coordinator</label>
              <input type="text" id="reg-leader" required placeholder="e.g. Hanna B." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Meeting Schedule</label>
              <input type="text" id="reg-time" required placeholder="e.g. Tuesdays @ 7:00 PM" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Telegram Handle</label>
              <input type="text" id="reg-telegram" placeholder="e.g. @Hanna_B" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone / WhatsApp</label>
              <input type="text" id="reg-phone" placeholder="e.g. +2519..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
            <textarea id="reg-desc" rows="3" required placeholder="Briefly describe the chapter mission..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 resize-none"></textarea>
          </div>

          <button type="submit" class="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2">
            <i class="fa-solid fa-check"></i> Publish Chapter Hub
          </button>
        </form>
      </div>
    </div>
    </div>
  `;

  // The Campus Network takes the full dashboard row and clips no content.
  const campusShell = container.querySelector(".ace-campus-network-shell");
  if (campusShell) { campusShell.style.gridColumn = "1 / -1"; campusShell.style.minWidth = "0"; }
  // Standard smooth scroll execution when rendered
  setTimeout(() => {
    const topAnchor = document.getElementById("campus-network-section-top");
    if (topAnchor) {
      topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 50);

  // Attach Sub-Tab Click Handlers
  document.getElementById("tab-nav-directory").onclick = () => switchTab("directory");
  document.getElementById("tab-nav-bible-studies").onclick = () => switchTab("bible-studies");
  document.getElementById("tab-nav-womens-ministry").onclick = () => switchTab("womens-ministry");
  document.getElementById("tab-nav-elders-council").onclick = () => switchTab("elders-council");
  document.getElementById("tab-nav-prayer-bulletin").onclick = () => switchTab("prayer-bulletin");

  const sectionSearch = document.getElementById("campus-section-search");
  if (sectionSearch) sectionSearch.oninput = event => { sectionSearchQuery = event.target.value; applySectionSearch(document.getElementById("tab-dynamic-content")); };

  renderActiveTabContent();
  attachModalEvents();
  refreshCampusIdentity();
}

function switchTab(tab) {
  activeTab = tab;
  renderCampusNetworkSection("app-dashboard");
}

function renderActiveTabContent() {
  const dynamicContainer = document.getElementById("tab-dynamic-content");
  if (!dynamicContainer) return;

  if (activeTab === "directory") {
    renderDirectoryTab(dynamicContainer);
  } else if (activeTab === "bible-studies") {
    renderBibleStudiesTab(dynamicContainer);
  } else if (activeTab === "womens-ministry") {
    renderWomensMinistryTab(dynamicContainer);
  } else if (activeTab === "elders-council") {
    renderEldersCouncilTab(dynamicContainer);
  } else if (activeTab === "prayer-bulletin") {
    renderPrayerBulletinTab(dynamicContainer);
  }
}

/**
 * 1. DIRECTORY TAB
 */
function renderDirectoryTab(container) {
  container.innerHTML = `
    <div class="bg-white/80 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
      <div class="relative w-full md:w-96">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input 
          type="text" 
          id="campus-search-input" 
          value="${searchQuery}"
          placeholder="Search by name, leader, or location..." 
          class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 transition"
        />
      </div>

      <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'All' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="All">All Chapters</button>
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'Main' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="Main">Main</button>
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'Medical' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="Medical">Medical</button>
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'STEM' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="STEM">STEM</button>
      </div>
    </div>

    <div id="campus-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
  `;

  const searchInput = document.getElementById("campus-search-input");
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value.trim();
      renderCampusCards();
    };
  }

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
      currentFilter = btn.getAttribute("data-category");
      renderDirectoryTab(container);
    };
  });

  renderCampusCards();
}

function renderCampusCards() {
  const grid = document.getElementById("campus-cards-grid");
  if (!grid) return;

  const filtered = campusNetworkData.filter((item) => {
    const matchesCategory = currentFilter === "All" || item.category === currentFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <i class="fa-solid fa-search text-3xl text-slate-300 mb-3"></i>
        <h3 class="text-slate-800 font-bold text-base mb-1">No chapters found</h3>
        <p class="text-slate-500 text-sm">Try adjusting your search query or category filter.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((campus) => `
    <div data-campus-search-record data-search="${safe([campus.name, campus.leader, campus.location, campus.description, campus.category, ...(campus.tags || [])].join(" "))}" class="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      <div class="relative h-48 bg-slate-900 overflow-hidden">
        <img src="${campus.bannerImage}" alt="${campus.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
        <div class="absolute top-4 left-4">
          <span class="px-3 py-1 text-xs font-bold text-white bg-slate-900/60 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
            ${campus.category}
          </span>
        </div>
      </div>

      <div class="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition">${campus.name}</h3>
          <p class="text-sm text-slate-600 line-clamp-2 mb-6 leading-relaxed">${campus.description}</p>
        </div>

        <div>
          <div class="border-t border-slate-100 pt-4 mb-5 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span><strong class="text-slate-700">Lead:</strong> ${campus.leader}</span>
            <span class="text-teal-700"><i class="fa-regular fa-clock"></i> ${campus.meetingTime}</span>
          </div>

          <button data-hub-id="${campus.id}" class="btn-open-hub w-full py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2">
            <span>Explore Chapter Hub</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
  applySectionSearch(document.getElementById("tab-dynamic-content") || grid.parentElement);

  grid.querySelectorAll(".btn-open-hub").forEach((btn) => {
    btn.onclick = (e) => {
      const hubId = e.currentTarget.getAttribute("data-hub-id");
      renderChapterHubDetail(hubId);
    };
  });
}

/**
 * 2. DEPARTMENTAL BIBLE STUDIES TAB
 */
function renderBibleStudiesTab(container) {
  const isSignedIn = Boolean(auth.currentUser);
  const currentCollege = campusProfile?.department ? collegeForDepartment(campusProfile.department) : null;
  const cards = COLLEGE_SCHOOLS.map(school => {
    const departments = seniorDepartments.filter(department => school.groups.includes(department.group));
    const eligibleByDepartment = Boolean(currentCollege && currentCollege.id === school.id);
    const authorized = campusCanOpenSchool(school);
    const coordinator = campusCoordinators.find(item => item.schoolId === school.id) || null;
    const accessCopy = campusIdentityLoading
      ? "Checking your account eligibility…"
      : !isSignedIn
        ? "Sign in to verify your recorded department."
        : !campusProfile?.department
          ? "Your account has no recorded department. Ask an administrator to complete your profile."
          : !eligibleByDepartment
            ? `This college is reserved for its recorded departments. Your profile lists ${campusProfile.department}.`
            : !campusMembership?.active || campusMembership.department !== campusProfile.department
              ? "Your department matches this college. Submit a Meeting Hall request and wait for approval before opening the school room."
              : !school.accessGroups.includes(campusMembership.departmentGroup)
                ? "Your coordinator has not assigned this account to the college study group yet."
                : "Your department and approved school membership are verified.";
    const statusLabel = authorized ? "Verified member access" : eligibleByDepartment ? "Request approval" : "Premium · department restricted";
    const coordinatorMarkup = coordinator
      ? `<div class="mt-4 rounded-2xl border border-teal-100 bg-teal-50/80 p-4 text-sm text-slate-800"><p class="text-[10px] font-black uppercase tracking-[.16em] text-teal-800">School coordinator</p><p class="mt-1 font-bold">${safe(coordinator.coordinatorName || "Coordinator to be announced")}</p><p class="text-xs text-slate-600">${safe([coordinator.department, coordinator.university].filter(Boolean).join(" · "))}</p>${coordinator.schedule ? `<p class="mt-2 text-xs text-slate-600">${safe(coordinator.schedule)}</p>` : ""}${coordinator.telegram ? `<a class="mt-2 inline-flex text-xs font-bold text-teal-800 underline" href="https://t.me/${safe(String(coordinator.telegram).replace(/^@/, ""))}" target="_blank" rel="noopener noreferrer">Contact coordinator on Telegram</a>` : ""}</div>`
      : `<div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600"><i class="fa-regular fa-clock mr-1 text-amber-600" aria-hidden="true"></i> Coordinator assignment will appear here when published by an administrator.</div>`;
    const door = authorized
      ? `<button type="button" data-open-school="${school.id}" class="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20"><i class="fa-solid fa-door-open mr-2 text-amber-300" aria-hidden="true"></i>Enter ${safe(school.title)}</button>`
      : !isSignedIn
        ? `<button type="button" data-campus-signin class="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-teal-800"><i class="fa-solid fa-arrow-right-to-bracket mr-2 text-amber-300" aria-hidden="true"></i>Sign in to verify eligibility</button>`
        : eligibleByDepartment
          ? `<button type="button" data-open-meeting-room class="mt-5 w-full rounded-2xl bg-teal-800 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-teal-700"><i class="fa-solid fa-shield-halved mr-2 text-amber-300" aria-hidden="true"></i>Request approval in Meeting Hall</button>`
          : `<div class="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3.5 text-xs font-bold text-slate-600"><i class="fa-solid fa-lock text-amber-600" aria-hidden="true"></i> School room unavailable for this account</div>`;
    const searchable = [school.title, school.description, ...departments.map(item => item.name), coordinator?.coordinatorName, coordinator?.department, coordinator?.university].filter(Boolean).join(" ");
    return `<article data-campus-search-record data-search="${safe(searchable)}" class="relative min-w-0 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(19,34,57,.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_75px_rgba(19,34,57,.15)]">
      <header class="relative min-h-56 overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-white md:p-8">
        <div class="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-amber-400/10 blur-2xl" aria-hidden="true"></div>
        <div class="relative z-10 flex items-start justify-between gap-4"><span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-xl text-amber-300"><i class="fa-solid ${school.icon}" aria-hidden="true"></i></span><span class="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${authorized ? "text-emerald-200" : "text-amber-200"}"><i class="fa-solid ${authorized ? "fa-circle-check" : "fa-lock"} mr-1" aria-hidden="true"></i>${statusLabel}</span></div>
        <h3 class="relative z-10 mt-6 max-w-xl text-2xl font-black tracking-tight md:text-3xl">${safe(school.title)}</h3><p class="relative z-10 mt-2 max-w-2xl text-sm leading-6 text-slate-200">${safe(school.description)}</p>
      </header>
      <div class="p-5 md:p-7"><p class="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Departments in this college</p><div class="mt-3 flex flex-wrap gap-2">${departments.map(department => `<span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">${safe(department.name)}</span>`).join("")}</div><p class="mt-4 rounded-xl ${eligibleByDepartment ? "bg-teal-50 text-teal-900" : "bg-slate-50 text-slate-700"} px-3.5 py-3 text-xs leading-5"><i class="fa-solid ${authorized ? "fa-circle-check" : "fa-shield-halved"} mr-1.5" aria-hidden="true"></i>${safe(accessCopy)}</p>${coordinatorMarkup}${door}</div>
    </article>`;
  }).join("");

  container.innerHTML = `<section class="mb-6 rounded-[1.7rem] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-teal-50 p-5 shadow-sm md:p-7"><p class="text-[10px] font-black uppercase tracking-[.18em] text-teal-800">ACE-USF · college-based discipleship</p><h2 class="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Departmental Bible Study Schools</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Departments are grouped into three colleges for shared Bible study. A member can open only the school matching their recorded department after the administrator approves their college group.</p><div class="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-700"><span class="rounded-full bg-white px-3 py-2 shadow-sm"><i class="fa-solid fa-heart-pulse mr-1.5 text-rose-600"></i>Medicine & Health Sciences</span><span class="rounded-full bg-white px-3 py-2 shadow-sm"><i class="fa-solid fa-microchip mr-1.5 text-teal-700"></i>Engineering & Technology</span><span class="rounded-full bg-white px-3 py-2 shadow-sm"><i class="fa-solid fa-scale-balanced mr-1.5 text-amber-700"></i>Social Sciences</span></div></section><div class="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">${cards}</div><div data-campus-search-empty class="hidden mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No college, department, or coordinator matches this search.</div>`;
  applySectionSearch(container);
  container.querySelectorAll("[data-campus-signin]").forEach(button => button.addEventListener("click", () => document.getElementById("auth-btn")?.click()));
  container.querySelectorAll("[data-open-school]").forEach(button => button.addEventListener("click", () => {
    const school = COLLEGE_SCHOOLS.find(item => item.id === button.dataset.openSchool);
    if (school && campusCanOpenSchool(school)) renderCollegeStudyRoom(container, school);
  }));
}

function renderCollegeStudyRoom(container, school) {
  if (!campusCanOpenSchool(school)) { renderBibleStudiesTab(container); return; }
  const departments = seniorDepartments.filter(department => school.groups.includes(department.group));
  const coordinator = campusCoordinators.find(item => item.schoolId === school.id) || null;
  const plans = DEPARTMENT_BIBLE_STUDIES.filter(plan => school.groups.some(group => departments.some(department => department.group === group))
    && (school.id === "social-sciences" ? plan.id === "dept-social" : school.id === "medicine-health-sciences" ? plan.id === "dept-health" : plan.id === "dept-tech"));
  container.innerHTML = `<section class="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-xl"><header class="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-white md:p-10"><button type="button" data-back-to-colleges class="mb-7 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"><i class="fa-solid fa-arrow-left mr-2" aria-hidden="true"></i>Back to colleges</button><p class="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">Verified school room · ${safe(campusProfile.department)}</p><h2 class="mt-2 text-3xl font-black tracking-tight md:text-4xl">${safe(school.title)}</h2><p class="mt-3 max-w-3xl text-sm leading-6 text-slate-200">${safe(school.description)}</p></header><div class="grid gap-6 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)] md:p-8"><section><h3 class="text-lg font-black text-slate-950">Department circles</h3><p class="mt-1 text-xs text-slate-600">Your recorded department determines your school. The administrator assigns coordinators and approves access.</p><div class="mt-4 grid gap-3 sm:grid-cols-2">${departments.map(department => `<article class="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p class="text-xs font-black text-slate-900">${safe(department.name)}</p><p class="mt-1 text-[10px] font-semibold text-teal-800">${safe(department.group)}</p></article>`).join("")}</div>${plans.map(plan => `<article class="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-5"><p class="text-[10px] font-black uppercase tracking-wider text-amber-800">${safe(plan.mottoVerse)} · weekly study</p><h4 class="mt-2 text-base font-black text-slate-900">${safe(plan.weeklyTopic)}</h4><p class="mt-2 text-xs leading-5 text-slate-700">${safe(plan.description)}</p><p class="mt-3 text-xs font-bold text-teal-900">${safe(plan.schedule)} · ${safe(plan.scripture)}</p></article>`).join("")}</section><aside class="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-5"><p class="text-[10px] font-black uppercase tracking-[.16em] text-teal-800">School coordinator</p><h3 class="mt-2 text-lg font-black text-slate-950">${safe(coordinator?.coordinatorName || "Coordinator to be announced")}</h3><p class="mt-1 text-xs text-slate-600">${safe([coordinator?.department, coordinator?.university].filter(Boolean).join(" · ") || "ACE-USF College Bible Study")}</p>${coordinator?.schedule ? `<p class="mt-4 rounded-xl bg-white p-3 text-xs font-semibold text-slate-700"><i class="fa-regular fa-calendar mr-2 text-teal-700"></i>${safe(coordinator.schedule)}</p>` : ""}${coordinator?.telegram ? `<a href="https://t.me/${safe(String(coordinator.telegram).replace(/^@/, ""))}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white">Message coordinator</a>` : ""}<p class="mt-5 border-t border-teal-100 pt-4 text-[11px] leading-5 text-slate-600">School access is private to approved members. Your profile department and active coordinator assignment were verified for this visit.</p></aside></div></section>`;
  container.querySelector("[data-back-to-colleges]")?.addEventListener("click", () => renderBibleStudiesTab(container));
}

/**
 * 3. WOMEN'S MINISTRY SANCTUARY TAB (Apostolic Modesty Standards)
 */
function renderWomensMinistryTab(container) {
  container.innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-950 via-purple-950 to-slate-950 p-8 md:p-10 text-white shadow-xl mb-8 border border-pink-900/50">
      <div class="relative z-10 max-w-2xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider mb-3">
          <i class="fa-solid fa-heart text-pink-400"></i> Sisters Fellowship & Modesty Sanctuary
        </span>
        <h2 class="text-3xl font-extrabold tracking-tight mb-3">Women's Youth Ministry Sanctuary</h2>
        <p class="text-pink-100/80 text-sm leading-relaxed">
          A dedicated sanctuary upholding Apostolic standards of holiness, modest apparel, and virtue for young women in university campuses.
        </p>
      </div>
    </div>

    <div class="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-3xl p-6 md:p-8 shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <span class="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">Once-A-Month Special Gathering</span>
        <h3 class="text-2xl font-black mt-3 mb-2">Monthly Sisters Fellowship & Discipleship Summit</h3>
        <p class="text-pink-100 text-sm max-w-xl">
          Join women leaders for an interactive monthly session covering Apostolic doctrine, modesty, prayer, and academic perseverance.
        </p>
      </div>
      <button onclick="alert('RSVP Confirmed for the Monthly Women\'s Summit!')" class="px-6 py-3.5 bg-white text-rose-700 hover:bg-pink-50 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition shrink-0">
        RSVP For Next Program
      </button>
    </div>

    <div class="bg-white border border-pink-100 rounded-3xl p-6 md:p-8 shadow-sm">
      <h3 class="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-pink-100">Experience Sharing & Advice Room</h3>

      <div class="space-y-4 mb-8">
        ${womensMinistryPosts.map(post => `
          <div data-campus-search-record data-search="${safe([post.author, post.role, post.title, post.content].join(" "))}" class="p-5 rounded-2xl bg-pink-50/50 border border-pink-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-pink-800 bg-white px-2.5 py-1 rounded-lg border border-pink-200">${post.author} (${post.role})</span>
              <span class="text-xs text-slate-400">${post.date}</span>
            </div>
            <h4 class="text-sm font-bold text-slate-900 mb-1">${post.title}</h4>
            <p class="text-slate-700 text-xs leading-relaxed">${post.content}</p>
          </div>
        `).join('')}
      </div>

      <form id="womens-post-form" class="space-y-3 pt-6 border-t border-pink-100">
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Share an Encouragement or Question</label>
        <input type="text" id="w-author-name" required placeholder="Your Name & Year" class="w-full px-4 py-2.5 bg-slate-50 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/25">
        <input type="text" id="w-post-title" required placeholder="Topic Title" class="w-full px-4 py-2.5 bg-slate-50 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/25">
        <textarea id="w-post-content" rows="3" required placeholder="Write your thoughts..." class="w-full px-4 py-2.5 bg-slate-50 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/25 resize-none"></textarea>
        <button type="submit" class="px-6 py-3 bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition">
          Post to Sanctuary Wall
        </button>
      </form>
    </div>
  `;
  applySectionSearch(container);

  document.getElementById("womens-post-form").onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("w-author-name").value.trim();
    const title = document.getElementById("w-post-title").value.trim();
    const content = document.getElementById("w-post-content").value.trim();

    if (name && title && content) {
      womensMinistryPosts.unshift({
        id: Date.now(),
        author: name,
        role: "Fellowship Sister",
        date: "Just now",
        title: title,
        content: content
      });
      saveToLocalStorage();
      renderWomensMinistryTab(container);
    }
  };
}

/**
 * 4. ELDERS, SPIRITUAL FATHERS & MOTHERS COUNCIL TAB (Distinct Photos & Standards)
 */
function renderEldersCouncilTab(container) {
  container.innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 p-8 md:p-10 text-white shadow-xl mb-8 border border-amber-800/40">
      <div class="relative z-10 max-w-2xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <i class="fa-solid fa-hands-holding-child text-amber-400"></i> Apostolic Elders & Pastoral Wisdom Chamber
        </span>
        <h2 class="text-3xl font-extrabold tracking-tight mb-3">Spiritual Fathers & Mothers Guidance</h2>
        <p class="text-amber-100/80 text-sm leading-relaxed">
          Timeless pastoral advisories and doctrine from senior spiritual parents to guide university youth in holiness, prayer, and academic excellence.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      ${eldersWisdomData.map(item => `
        <div data-campus-search-record data-search="${safe([item.speaker, item.category, item.title, item.summary].join(" "))}" class="bg-white border border-amber-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-4 mb-4 pb-4 border-b border-amber-50">
            <img src="${item.image}" alt="${item.speaker}" class="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shadow-sm">
            <div>
              <h4 class="text-base font-bold text-slate-900">${item.speaker}</h4>
              <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">${item.category}</span>
            </div>
          </div>
          <h3 class="text-lg font-extrabold text-slate-900 mb-2">${item.title}</h3>
          <p class="text-slate-600 text-xs leading-relaxed italic mb-4">"${item.summary}"</p>
        </div>
      `).join('')}
    </div>

    <div class="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 md:p-8">
      <h3 class="text-base font-bold text-slate-900 mb-2">Seek Pastoral Advice or Prayer Support</h3>
      <p class="text-slate-500 text-xs mb-4">Submit a private note or question to our team of spiritual mothers and fathers.</p>

      <form id="ask-elder-form" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" id="ask-name" required placeholder="Your Name or 'Anonymous Student'" class="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25">
          <input type="text" id="ask-campus" required placeholder="Your Campus / University" class="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25">
        </div>
        <textarea id="ask-message" rows="3" required placeholder="Type your spiritual, career, or personal question..." class="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 resize-none"></textarea>
        <button type="submit" class="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm">
          Submit Privately to Counsel
        </button>
      </form>
    </div>
  `;
  applySectionSearch(container);

  document.getElementById("ask-elder-form").onsubmit = (e) => {
    e.preventDefault();
    alert("🙏 Your question/prayer request has been securely submitted to the Spiritual Counsel. An elder or leader will respond through the fellowship network!");
    e.target.reset();
  };
}

/**
 * 5. NEW STANDARDIZED FEATURE: NATIONAL PRAYER & FASTING BULLETIN BOARD
 */
function renderPrayerBulletinTab(container) {
  container.innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-950 to-teal-950 p-8 md:p-10 text-white shadow-xl mb-8 border border-teal-800/40">
      <div class="relative z-10 max-w-2xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
          <i class="fa-solid fa-pray text-teal-400"></i> National Prayer & Intercession Network
        </span>
        <h2 class="text-3xl font-extrabold tracking-tight mb-3">University Fasting & Prayer Bulletin</h2>
        <p class="text-teal-100/80 text-sm leading-relaxed">
          United in spirit across all Ethiopian campuses. Post prayer burdens, join national student fasts, and intercede for fellow believers.
        </p>
      </div>
    </div>

    <!-- Submit Prayer Request Card -->
    <div class="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
      <h3 class="text-base font-bold text-slate-900 mb-2">Post Urgent Campus Prayer Request</h3>
      <p class="text-slate-500 text-xs mb-4">Share your prayer request so student fellowships across the country can intercede for you.</p>

      <form id="prayer-req-form" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" id="p-author" required placeholder="Your Name or Initials" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
          <input type="text" id="p-campus" required placeholder="University / Campus" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
        </div>
        <textarea id="p-request" rows="2" required placeholder="Describe your prayer burden..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 resize-none"></textarea>
        <button type="submit" class="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm">
          Publish to National Prayer Wall
        </button>
      </form>
    </div>

    <!-- Prayer Feed -->
    <div class="space-y-4" id="prayer-feed-container">
      ${prayerBulletinData.map(item => `
        <div data-campus-search-record data-search="${safe([item.campus, item.author, item.request].join(" "))}" class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">${item.campus}</span>
              <span class="text-xs text-slate-400">By ${item.author} •${item.date}</span>
            </div>
            <p class="text-slate-900 text-sm font-semibold">${item.request}</p>
          </div>
          <button data-prayer-id="${item.id}" class="btn-pray-intercede px-5 py-2.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition shrink-0 flex items-center justify-center gap-2 shadow-sm">
            <i class="fa-solid fa-hands-praying text-amber-300"></i> Praying (${item.prayerCount})
          </button>
        </div>
      `).join('')}
    </div>
  `;
  applySectionSearch(container);

  document.getElementById("prayer-req-form").onsubmit = (e) => {
    e.preventDefault();
    const author = document.getElementById("p-author").value.trim();
    const campus = document.getElementById("p-campus").value.trim();
    const request = document.getElementById("p-request").value.trim();

    if (author && campus && request) {
      prayerBulletinData.unshift({
        id: Date.now(),
        campus: campus,
        author: author,
        request: request,
        prayerCount: 1,
        date: "Just now"
      });
      saveToLocalStorage();
      renderPrayerBulletinTab(container);
    }
  };

  container.querySelectorAll(".btn-pray-intercede").forEach(btn => {
    btn.onclick = (e) => {
      const pId = Number(e.currentTarget.getAttribute("data-prayer-id"));
      const target = prayerBulletinData.find(p => p.id === pId);
      if (target) {
        target.prayerCount += 1;
        saveToLocalStorage();
        renderPrayerBulletinTab(container);
      }
    };
  });
}

/**
 * Chapter Detail Hub View
 */
function renderChapterHubDetail(campusId) {
  const container = document.getElementById("app-dashboard");
  const campus = campusNetworkData.find((c) => c.id === campusId) || campusNetworkData[0];
  if (!container) return;

  window.scrollTo({ top: 0, behavior: "smooth" });

  container.innerHTML = `
    <div class="mb-6 flex items-center justify-between">
      <button id="btn-back-to-hub" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition">
        <i class="fa-solid fa-arrow-left"></i> Back to Campus Network
      </button>
    </div>

    <div class="relative rounded-3xl overflow-hidden shadow-2xl mb-8 bg-slate-900 text-white min-h-[300px] flex flex-col justify-end p-8 md:p-12">
      <img src="${campus.bannerImage}" alt="${campus.name}" class="absolute inset-0 w-full h-full object-cover opacity-40">
      <div class="relative z-10 max-w-3xl">
        <span class="px-3.5 py-1 text-xs font-bold text-teal-300 bg-teal-950/80 rounded-full border border-teal-500/30">${campus.category} Chapter</span>
        <h1 class="text-3xl md:text-5xl font-black tracking-tight mt-3 mb-2">${campus.name}</h1>
        <p class="text-slate-300 text-sm leading-relaxed">${campus.description}</p>
      </div>
    </div>
  `;

  document.getElementById("btn-back-to-hub").onclick = () => renderCampusNetworkSection("app-dashboard");
}

function attachModalEvents() {
  const openBtn = document.getElementById("btn-open-register-modal");
  const closeBtn = document.getElementById("btn-close-modal");
  const modal = document.getElementById("register-modal");

  if (openBtn && modal) openBtn.onclick = () => modal.classList.remove("hidden");
  if (closeBtn && modal) closeBtn.onclick = () => modal.classList.add("hidden");
}
