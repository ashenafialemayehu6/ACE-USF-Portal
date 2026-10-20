import { auth, db } from "./firebase_config.js";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
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
    name: "College of Social Sciences Fellowship",
    location: "Diredawa  — Sabiyan",
    membersCount: 145,
    schoolId: "social-sciences",
    leader: "DR. Misael B.",
    meetingTime: "Fridays @ 6:00 PM",
    description: "A connected fellowship for students across business, economics, law, humanities, and the social sciences.",
    category: "Social Sciences",
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
    name: "College of Medicine & Health Sciences Fellowship",
    location: "Dil Chora Specialized Hospital",
    membersCount: 68,
    schoolId: "medicine-health-sciences",
    leader: "Dr. Misael B.",
    meetingTime: "Wednesdays @ 5:30 PM",
    description: "A dedicated sanctuary for medical, nursing, and public health students balancing clinical studies with a thriving faith community.",
    category: "Medicine & Health Sciences",
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
    name: "College of Engineering & Technology Fellowship",
    location: "AAU 5 Kilo — Faculty of Technology (BiT)",
    membersCount: 82,
    schoolId: "engineering-technology",
    leader: "Amanuel K.",
    meetingTime: "Thursdays @ 6:30 PM",
    description: "A dynamic community for engineering, computer science, and tech innovators focused on purposeful building, ethics, and leadership.",
    category: "Engineering & Technology",
    tags: ["Tech & Faith", "Innovation", "Discipleship"],
    bannerImage: "https://images.pexels.com/photos/5553048/pexels-photo-5553048.jpeg?auto=compress&cs=tinysrgb&w=2000",
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

// Keep saved images and schedules while enforcing the current three-school names.
let campusNetworkData = readStoredArray("ace_campus_network_data", DEFAULT_CAMPUSES).map(saved => {
  const current = DEFAULT_CAMPUSES.find(item => item.id === saved.id);
  return current ? { ...current, ...saved, name: current.name, category: current.category, schoolId: current.schoolId, description: current.description, ...(saved.id === "usf-engineering" ? { bannerImage: current.bannerImage } : {}) } : saved;
});
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
let campusCountUnsubscribe = null;
let campusSchoolCounts = {};
let pendingStudySchoolId = "";

function subscribeCampusSchoolCounts() {
  if (campusCountUnsubscribe) return;
  campusCountUnsubscribe = onSnapshot(
    query(collection(db, "siteContent", "campusSchoolCoordinators", "items"), where("published", "==", true)),
    snapshot => {
      campusSchoolCounts = {};
      snapshot.docs.forEach(item => {
        const data = item.data();
        if (data.schoolId) campusSchoolCounts[data.schoolId] = data.departmentCounts && typeof data.departmentCounts === "object" ? data.departmentCounts : {};
      });
      refreshCampusCountLabels();
    },
    error => console.warn("Live campus department counts are unavailable:", error)
  );
}

function refreshCampusCountLabels() {
  document.querySelectorAll("[data-live-school-total]").forEach(node => {
    node.textContent = formatSchoolCount(node.dataset.liveSchoolTotal);
  });
  document.querySelectorAll("[data-live-department-count]").forEach(node => {
    const [schoolId, departmentId] = node.dataset.liveDepartmentCount.split(":");
    const department = seniorDepartments.find(item => item.id === departmentId);
    const count = department && countForDepartment(schoolId, department);
    node.innerHTML = `<span class="h-1.5 w-1.5 rounded-full ${count === null || count === undefined ? "bg-slate-400" : "animate-pulse bg-emerald-500"}"></span>${count === null || count === undefined ? "Count pending" : `${count.toLocaleString()} students`}`;
    node.classList.toggle("bg-slate-100", count === null || count === undefined);
    node.classList.toggle("text-slate-500", count === null || count === undefined);
    node.classList.toggle("bg-emerald-50", count !== null && count !== undefined);
    node.classList.toggle("text-emerald-800", count !== null && count !== undefined);
  });
}

const COLLEGE_SCHOOLS = [
  {
    id: "medicine-health-sciences",
    title: "College of Medicine & Health Sciences",
    groups: ["Health Sciences"],
    accessGroups: ["healthSciences"],
    icon: "fa-heart-pulse",
    bannerLabel: "Care · science · service",
    bannerIcons: ["fa-user-doctor", "fa-stethoscope", "fa-heart-pulse"],
    studyBanner: "https://images.unsplash.com/photo-1676364423907-8d8ccd4e486f?auto=format&fit=crop&w=1400&q=85",
    description: "A shared Bible study and fellowship for students serving in medicine, nursing, pharmacy, and public health."
  },
  {
    id: "engineering-technology",
    title: "College of Engineering & Technology",
    groups: ["Engineering & Tech"],
    accessGroups: ["technology", "engineering", "engineeringTech"],
    icon: "fa-microchip",
    bannerLabel: "Design · build · innovate",
    bannerIcons: ["fa-microchip", "fa-gears", "fa-code"],
    studyBanner: "assets/engineering-fellowship-banner.svg",
    description: "One school community for engineering, computing, software, electrical, civil, and technology departments."
  },
  {
    id: "social-sciences",
    title: "College of Social Sciences",
    groups: ["Business & Economics", "Law & Humanities"],
    accessGroups: ["socialSciences", "business", "lawGovernance", "socialSciencesCollege"],
    icon: "fa-scale-balanced",
    bannerLabel: "People · justice · society",
    bannerIcons: ["fa-people-group", "fa-scale-balanced", "fa-book-open"],
    studyBanner: "https://images.pexels.com/photos/5520287/pexels-photo-5520287.jpeg?auto=compress&cs=tinysrgb&w=2000",
    description: "A connected school for social, business, economics, law, and humanities departments."
  }
];

function campusDepartmentRecord(department) {
  const value = String(department || "").trim().toLocaleLowerCase();
  return seniorDepartments.find(item => item.id.toLocaleLowerCase() === value || item.name.toLocaleLowerCase() === value) || null;
}

function sameCampusDepartment(first, second) {
  const firstRecord = campusDepartmentRecord(first);
  const secondRecord = campusDepartmentRecord(second);
  return firstRecord && secondRecord ? firstRecord.id === secondRecord.id : String(first || "").trim().toLocaleLowerCase() === String(second || "").trim().toLocaleLowerCase();
}

function collegeForDepartment(department) {
  const record = campusDepartmentRecord(department);
  return record ? COLLEGE_SCHOOLS.find(school => school.groups.includes(record.group)) || null : null;
}

function campusCanOpenSchool(school) {
  return Boolean(auth.currentUser && campusProfile?.department && collegeForDepartment(campusProfile.department)?.id === school.id
    && campusMembership?.active === true
    && sameCampusDepartment(campusMembership.department, campusProfile.department)
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
  if (target && activeTab === "womens-ministry") renderWomensMinistryTab(target);
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
      .ace-campus-network-hero{min-width:0;isolation:isolate}
      .ace-campus-network-hero__image{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;object-position:center 44%;opacity:.78}
      .ace-campus-network-hero__shade{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(2,13,20,.78) 0%,rgba(3,28,37,.52) 55%,rgba(3,28,37,.18) 100%),linear-gradient(0deg,rgba(2,13,20,.22),transparent 72%);pointer-events:none}
      @media(max-width:640px){.ace-campus-network-hero{padding:1.35rem!important;border-radius:1.45rem 1.9rem 1.45rem 2.1rem!important}.ace-campus-network-hero__image{object-position:54% center;opacity:.64}.ace-campus-network-hero__shade{background:linear-gradient(90deg,rgba(2,13,20,.82),rgba(3,28,37,.56)),linear-gradient(0deg,rgba(2,13,20,.26),transparent 78%)}.ace-campus-network-hero__copy{min-width:0;width:100%}.ace-campus-network-hero__title{font-size:clamp(1.85rem,8.5vw,2.65rem)!important;line-height:1.08!important;overflow-wrap:anywhere}.ace-campus-network-hero__tag{max-width:100%;font-size:.62rem!important;line-height:1.45;letter-spacing:.12em!important;white-space:normal}.ace-campus-network-hero__actions{width:100%;flex-direction:column;align-items:stretch}.ace-campus-network-hero__actions button{width:100%;min-width:0;justify-content:center;white-space:normal;line-height:1.45;text-align:center}}
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
    <div class="ace-campus-network-hero relative isolate overflow-hidden rounded-[2rem_3rem_2rem_4rem] bg-gradient-to-br from-slate-950 via-teal-950 to-[#19384a] p-8 md:p-12 text-white shadow-2xl mb-8 border border-white/10">
      <img class="ace-campus-network-hero__image pointer-events-none" src="https://images.pexels.com/photos/7973041/pexels-photo-7973041.jpeg?auto=compress&amp;cs=tinysrgb&amp;w=2000" alt="" aria-hidden="true" fetchpriority="high">
      <div class="ace-campus-network-hero__shade" aria-hidden="true"></div>
      <div class="absolute z-[2] -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute z-[2] -left-20 -bottom-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div aria-hidden="true" class="pointer-events-none absolute z-[2] inset-y-0 right-0 hidden w-[38%] items-center justify-center md:flex">
        <div class="absolute h-64 w-64 rounded-full border border-teal-100/15 shadow-[0_0_90px_rgba(45,212,191,.12)]"></div><div class="absolute h-44 w-44 rounded-full border border-amber-200/20"></div>
        <div class="relative grid h-24 w-24 place-items-center rounded-[2rem] border border-white/20 bg-white/10 text-4xl text-amber-200 shadow-2xl backdrop-blur"><i class="fa-solid fa-building-columns"></i></div>
        <i class="fa-solid fa-user-graduate absolute left-[18%] top-[24%] text-3xl text-teal-100 drop-shadow-lg"></i><i class="fa-solid fa-book-bible absolute right-[18%] top-[30%] text-3xl text-amber-200 drop-shadow-lg"></i><i class="fa-solid fa-people-group absolute bottom-[18%] left-[28%] text-4xl text-white/90 drop-shadow-lg"></i>
        <span class="absolute bottom-5 right-6 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[.2em] text-teal-50 backdrop-blur">Connected in faith</span>
      </div>
      <div class="relative z-10 flex min-w-0 flex-col gap-6 md:flex-row md:items-center md:justify-between md:pr-[30%]">
        <div class="ace-campus-network-hero__copy max-w-2xl">
          <div class="ace-campus-network-hero__tag inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
            <i class="fa-solid fa-sparkles text-amber-400"></i> ACE-USF Campus Network Portal
          </div>
          <h1 class="ace-campus-network-hero__title text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            Campus Network & Ministries
          </h1>
          <p class="max-w-2xl break-words text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
            Connecting university fellowship chapters, specialized departmental Bible studies, women's ministry sanctuaries, and elders' spiritual wisdom across Ethiopia.
          </p>
        </div>

        <div class="ace-campus-network-hero__actions flex flex-wrap gap-3">
          <button type="button" data-open-campus-bible-study class="self-start md:self-auto px-5 py-3.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide rounded-2xl transition-all flex items-center gap-2 shrink-0"><i class="fa-solid fa-book-bible text-amber-300"></i> Bible Study Schools</button>
          <button id="btn-open-register-modal" class="self-start md:self-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/30 transition-all flex items-center gap-2 shrink-0"><i class="fa-solid fa-plus text-sm"></i> Register New Chapter</button>
        </div>
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
                <option value="Social Sciences">College of Social Sciences</option>
                <option value="Medicine & Health Sciences">College of Medicine & Health Sciences</option>
                <option value="Engineering & Technology">College of Engineering & Technology</option>
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
  subscribeCampusSchoolCounts();
  refreshCampusIdentity();
}

// Shared route used by Home and other portal sections to open Bible Study Schools directly.
export function openCampusBibleStudies(schoolId = "") {
  activeTab = "bible-studies";
  const targetSchoolId = COLLEGE_SCHOOLS.some(school => school.id === schoolId) ? schoolId : "";
  pendingStudySchoolId = targetSchoolId;
  renderCampusNetworkSection("app-dashboard");
  window.setTimeout(() => {
    const target = targetSchoolId ? document.querySelector(`[data-bible-study-school="${targetSchoolId}"]`) : document.getElementById("tab-nav-bible-studies");
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }, 120);
}

export function openCampusWomensSanctuary() {
  activeTab = "womens-ministry";
  renderCampusNetworkSection("app-dashboard");
  window.setTimeout(() => {
    document.getElementById("tab-nav-womens-ministry")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }, 120);
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
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'Social Sciences' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="Social Sciences">Social Sciences</button>
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'Medicine & Health Sciences' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="Medicine & Health Sciences">Health</button>
        <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentFilter === 'Engineering & Technology' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}" data-category="Engineering & Technology">Engineering & Tech</button>
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
    <article data-campus-search-record data-search="${safe([campus.name, campus.leader, campus.location, campus.description, campus.category, ...(campus.tags || []), ...seniorDepartments.filter(department => COLLEGE_SCHOOLS.find(school => school.id === campus.schoolId)?.groups.includes(department.group)).map(department => department.name)].join(" "))}" class="relative isolate min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_22px_70px_rgba(20,35,57,.12)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_90px_rgba(20,35,57,.2)] group">
      <div class="relative h-56 overflow-hidden bg-slate-950 md:h-64">
        <img src="${campus.bannerImage}" alt="${safe(campus.name)}" class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5"></div>
        <div class="absolute top-4 left-4">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/45 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.16em] text-white shadow-lg backdrop-blur-xl">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_#fcd34d]"></span>${safe(campus.category)}
          </span>
        </div>
      </div>

      <div class="p-5 md:p-6">
        <p class="text-[9px] font-extrabold uppercase tracking-[.18em] text-teal-800">ACE-USF <span class="mx-1 text-amber-500">·</span> College Fellowship</p>
        <h3 class="mt-2 min-h-[2.35em] text-[1.2rem] font-extrabold leading-[1.18] tracking-[-.025em] text-slate-950 md:text-[1.35rem]" style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden">${safe(campus.name)}</h3>
        <p class="mt-2 min-h-[3em] text-[13px] leading-[1.5] text-slate-600 md:text-sm" style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden">${safe(campus.description)}</p>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3.5"><span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800"><span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-600"></span></span><b data-live-school-total="${safe(campus.schoolId)}">${formatSchoolCount(campus.schoolId)}</b> rostered</span><span class="text-[11px] font-semibold text-slate-500"><i class="fa-regular fa-clock mr-1 text-teal-700"></i>${safe(campus.meetingTime)}</span></div>
        <div class="mt-3.5 flex items-center justify-between gap-2.5"><span class="min-w-0 truncate text-[11px] text-slate-600"><b class="text-slate-800">Coordinator</b> · ${safe(campus.leader)}</span><button data-hub-id="${safe(campus.id)}" class="btn-open-hub inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-[11px] font-extrabold text-white shadow-lg transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-700/20"><span>Explore school</span><i class="fa-solid fa-arrow-right text-[10px]"></i></button></div>
      </div>
    </article>
  `).join('');
  applySectionSearch(document.getElementById("tab-dynamic-content") || grid.parentElement);

  grid.querySelectorAll(".btn-open-hub").forEach((btn) => {
    btn.onclick = (e) => {
      const hubId = e.currentTarget.getAttribute("data-hub-id");
      renderChapterHubDetail(hubId);
    };
  });
}

function countForDepartment(schoolId, department) {
  const counts = campusSchoolCounts[schoolId] || {};
  const value = counts[department.id] ?? counts[department.name];
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null;
}

function formatSchoolCount(schoolId) {
  const school = COLLEGE_SCHOOLS.find(item => item.id === schoolId);
  if (!school) return "Roster updating";
  const departments = seniorDepartments.filter(item => school.groups.includes(item.group));
  const counts = departments.map(item => countForDepartment(schoolId, item));
  return counts.length && counts.every(value => value !== null) ? counts.reduce((total, value) => total + value, 0).toLocaleString() : "Roster updating";
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
    const bannerShade = school.id === "engineering-technology" || school.id === "social-sciences"
      ? "from-slate-950/55 via-slate-950/25 to-slate-950/10"
      : "from-slate-950/90 via-slate-950/65 to-slate-950/25";
    const bannerBottomShade = school.id === "engineering-technology" || school.id === "social-sciences" ? "from-slate-950/35" : "from-slate-950/70";
    const accessCopy = campusIdentityLoading
      ? "Checking your account eligibility…"
      : !isSignedIn
        ? "Sign in to verify your recorded department."
        : !campusProfile?.department
          ? "Your account has no recorded department. Ask an administrator to complete your profile."
          : !eligibleByDepartment
            ? `This college is reserved for its recorded departments. Your profile lists ${campusDepartmentRecord(campusProfile.department)?.name || campusProfile.department}.`
            : !campusMembership?.active || !sameCampusDepartment(campusMembership.department, campusProfile.department)
              ? `Your department (${campusDepartmentRecord(campusProfile.department)?.name || campusProfile.department}) matches this college. Submit a Meeting Hall request and wait for approval before opening the school room.`
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
    return `<article id="bible-study-school-${safe(school.id)}" data-bible-study-school="${safe(school.id)}" data-campus-search-record data-search="${safe(searchable)}" class="relative min-w-0 scroll-mt-24 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(19,34,57,.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_75px_rgba(19,34,57,.15)]">
      <header class="relative isolate flex min-h-[18rem] flex-col justify-between overflow-hidden bg-slate-950 p-6 text-white md:min-h-[20rem] md:p-8">
        <img src="${safe(school.studyBanner)}" alt="" aria-hidden="true" loading="lazy" class="absolute inset-0 z-0 h-full w-full object-cover transition duration-700 hover:scale-[1.03]">
        <div class="absolute inset-0 z-10 bg-gradient-to-r ${bannerShade}"></div><div class="absolute inset-0 z-10 bg-gradient-to-t ${bannerBottomShade} via-transparent to-slate-950/15"></div>
        <div aria-hidden="true" class="pointer-events-none absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 md:block"><div class="relative grid h-36 w-36 place-items-center rounded-[42%] border border-white/25 bg-white/10 shadow-[0_0_0_14px_rgba(255,255,255,.04),0_20px_55px_rgba(0,0,0,.24)] backdrop-blur-sm"><span class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/60 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.15em] text-amber-100">${safe(school.bannerLabel)}</span><div class="grid grid-cols-2 gap-3">${school.bannerIcons.map((glyph, index) => `<span class="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 ${index === 0 ? "bg-amber-300/20 text-amber-200" : index === 1 ? "bg-teal-300/20 text-teal-100" : "bg-white/15 text-white"} ${index === 2 ? "col-span-2 mx-auto" : ""}"><i class="fa-solid ${safe(glyph)} text-lg"></i></span>`).join("")}</div></div></div>
        <div class="relative z-20 flex items-start justify-between gap-4"><span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 text-xl text-amber-300 shadow-lg backdrop-blur-md"><i class="fa-solid ${school.icon}" aria-hidden="true"></i></span><span class="rounded-full border border-white/20 bg-slate-950/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${authorized ? "text-emerald-200" : "text-amber-200"}"><i class="fa-solid ${authorized ? "fa-circle-check" : "fa-lock"} mr-1" aria-hidden="true"></i>${statusLabel}</span></div>
        <div class="relative z-20 max-w-2xl md:max-w-[70%]"><p class="text-[9px] font-black uppercase tracking-[.2em] text-amber-200">ACE-USF · Bible Study School</p><h3 class="mt-2 text-2xl font-black leading-tight tracking-tight text-white md:text-3xl">${safe(school.title)}</h3><p class="mt-2 max-w-xl text-sm leading-6 text-slate-100">${safe(school.description)}</p></div>
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
  if (pendingStudySchoolId) {
    const target = container.querySelector(`[data-bible-study-school="${pendingStudySchoolId}"]`);
    if (target) {
      target.classList.add("ring-4", "ring-amber-300/70", "ring-offset-4", "ring-offset-slate-50");
      window.setTimeout(() => target.classList.remove("ring-4", "ring-amber-300/70", "ring-offset-4", "ring-offset-slate-50"), 1800);
    }
    pendingStudySchoolId = "";
  }
}

function renderCollegeStudyRoom(container, school) {
  if (!campusCanOpenSchool(school)) { renderBibleStudiesTab(container); return; }
  const departments = seniorDepartments.filter(department => school.groups.includes(department.group));
  const coordinator = campusCoordinators.find(item => item.schoolId === school.id) || null;
  const plans = DEPARTMENT_BIBLE_STUDIES.filter(plan => school.groups.some(group => departments.some(department => department.group === group))
    && (school.id === "social-sciences" ? plan.id === "dept-social" : school.id === "medicine-health-sciences" ? plan.id === "dept-health" : plan.id === "dept-tech"));
  container.innerHTML = `<section class="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-xl"><header class="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-6 text-white md:p-10"><button type="button" data-back-to-colleges class="mb-7 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15"><i class="fa-solid fa-arrow-left mr-2" aria-hidden="true"></i>Back to colleges</button><p class="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">Verified school room · ${safe(campusDepartmentRecord(campusProfile.department)?.name || campusProfile.department)}</p><h2 class="mt-2 text-3xl font-black tracking-tight md:text-4xl">${safe(school.title)}</h2><p class="mt-3 max-w-3xl text-sm leading-6 text-slate-200">${safe(school.description)}</p></header><div class="grid gap-6 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)] md:p-8"><section><h3 class="text-lg font-black text-slate-950">Department circles</h3><p class="mt-1 text-xs text-slate-600">Your recorded department determines your school. The administrator assigns coordinators and approves access.</p><div class="mt-4 grid gap-3 sm:grid-cols-2">${departments.map(department => `<article class="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p class="text-xs font-black text-slate-900">${safe(department.name)}</p><p class="mt-1 text-[10px] font-semibold text-teal-800">${safe(department.group)}</p></article>`).join("")}</div>${plans.map(plan => `<article class="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-5"><p class="text-[10px] font-black uppercase tracking-wider text-amber-800">${safe(plan.mottoVerse)} · weekly study</p><h4 class="mt-2 text-base font-black text-slate-900">${safe(plan.weeklyTopic)}</h4><p class="mt-2 text-xs leading-5 text-slate-700">${safe(plan.description)}</p><p class="mt-3 text-xs font-bold text-teal-900">${safe(plan.schedule)} · ${safe(plan.scripture)}</p></article>`).join("")}</section><aside class="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-5"><p class="text-[10px] font-black uppercase tracking-[.16em] text-teal-800">School coordinator</p><h3 class="mt-2 text-lg font-black text-slate-950">${safe(coordinator?.coordinatorName || "Coordinator to be announced")}</h3><p class="mt-1 text-xs text-slate-600">${safe([coordinator?.department, coordinator?.university].filter(Boolean).join(" · ") || "ACE-USF College Bible Study")}</p>${coordinator?.schedule ? `<p class="mt-4 rounded-xl bg-white p-3 text-xs font-semibold text-slate-700"><i class="fa-regular fa-calendar mr-2 text-teal-700"></i>${safe(coordinator.schedule)}</p>` : ""}${coordinator?.telegram ? `<a href="https://t.me/${safe(String(coordinator.telegram).replace(/^@/, ""))}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white">Message coordinator</a>` : ""}<p class="mt-5 border-t border-teal-100 pt-4 text-[11px] leading-5 text-slate-600">School access is private to approved members. Your profile department and active coordinator assignment were verified for this visit.</p></aside></div></section>`;
  container.querySelector("[data-back-to-colleges]")?.addEventListener("click", () => renderBibleStudiesTab(container));
}

/**
 * 3. WOMEN'S MINISTRY SANCTUARY TAB (Apostolic Modesty Standards)
 */
function renderWomensMinistryTab(container) {
  const user = auth.currentUser;
  const sex = String(campusProfile?.sex || "").trim().toLowerCase();
  const memberSex = String(campusMembership?.sex || "").trim().toLowerCase();
  const isFemale = ["female", "woman", "women"].includes(sex);
  const isMale = ["male", "man", "men"].includes(sex);
  const adminHelp = isMale || (user && !isFemale) ? "Contact the administrator" : "Contact the fellowship team";
  const approved = campusMembership?.active === true && campusMembership?.womenMinistry === true && ["female", "woman", "women"].includes(memberSex);
  if (campusIdentityLoading || !user || !isFemale || !approved) {
    const title = campusIdentityLoading ? "Checking Sanctuary access" : !user ? "A space for sisters to grow together" : !isFemale ? (isMale ? "This room is for women only" : "Profile update needed") : "Your access is awaiting approval";
    const detail = campusIdentityLoading ? "We’re verifying your profile and approved fellowship membership." : !user ? "Sign in so we can check your profile and approved women’s fellowship access." : !campusProfile ? "Your profile could not be loaded. Please contact the ACE-USF team for help." : isMale ? "Unfortunately, your account is marked as male, so you are not eligible for this women-only room. If your profile information is incorrect, please contact the administrator for help." : !isFemale ? "Your profile does not show an eligible women’s fellowship category. Please contact the administrator if your profile needs correction." : "Your profile is recorded as female, but an administrator has not yet approved your women’s fellowship membership. Ask for access through the ACE-USF Assistant.";
    container.innerHTML = `<section class="relative isolate grid min-h-[55vh] content-center overflow-hidden rounded-[2rem_3rem_2rem_4rem] bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 px-6 py-12 text-center text-white shadow-2xl sm:px-12"><div aria-hidden="true" class="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-pink-100/15"></div><span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/10 text-2xl text-pink-200"><i class="fa-solid fa-hands-holding-child" aria-hidden="true"></i></span><p class="mt-6 text-[10px] font-black uppercase tracking-[.22em] text-pink-200">ACE-USF · sisters fellowship</p><h2 class="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">${title}</h2><p class="mx-auto mt-4 max-w-xl text-sm leading-7 text-pink-50/85">${detail}</p><div class="mt-7 flex flex-wrap justify-center gap-3">${campusIdentityLoading ? "" : !user ? `<button type="button" data-women-signin class="rounded-full bg-pink-200 px-6 py-3 text-xs font-black text-slate-950">Sign in to continue</button>` : `<a href="https://t.me/ACE_USF_AssistantBot" target="_blank" rel="noopener noreferrer" class="rounded-full bg-pink-200 px-6 py-3 text-xs font-black text-slate-950">${adminHelp} <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></a>`}<button type="button" data-women-back class="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs font-bold text-white">Back to Campus Network</button></div><p class="mx-auto mt-6 max-w-lg text-[10px] leading-5 text-white/55">Access is based on your saved profile and administrator-approved women’s fellowship membership.</p></section>`;
    container.querySelector("[data-women-signin]")?.addEventListener("click", () => document.getElementById("auth-btn")?.click());
    container.querySelector("[data-women-back]")?.addEventListener("click", () => switchTab("directory"));
    return;
  }
  container.innerHTML = `
    <div class="women-sanctuary min-w-0 space-y-9">
    <section class="relative isolate grid min-h-[350px] items-center overflow-hidden rounded-[2rem_3.5rem_2rem_4.2rem] bg-gradient-to-br from-[#35132e] via-[#672b55] to-[#1e2346] px-6 py-10 text-white shadow-[0_28px_90px_rgba(75,20,66,.2)] sm:px-10 lg:min-h-[400px] lg:grid-cols-[1.2fr_.8fr] lg:px-14">
      <div aria-hidden="true" class="pointer-events-none absolute -right-14 -top-24 h-80 w-80 rounded-full border border-pink-100/15 shadow-[0_0_0_28px_rgba(255,255,255,.025),0_0_0_58px_rgba(255,255,255,.02)]"></div>
      <div class="relative z-10 max-w-2xl"><span class="inline-flex items-center gap-2 rounded-full border border-pink-100/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-pink-100 backdrop-blur"><i class="fa-solid fa-shield-heart text-pink-300"></i> Approved sisters · one fellowship</span><p class="mt-6 text-[10px] font-bold uppercase tracking-[.2em] text-amber-200">Faith · friendship · purpose</p><h2 class="mt-3 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">A place for women to flourish.</h2><p class="mt-5 max-w-xl text-sm leading-7 text-pink-50/85 sm:text-base">Grow in Christ, encourage one another through university life, and build a caring sisterhood rooted in prayer, wisdom, dignity, and service.</p><a href="#women-areas" class="mt-7 inline-flex rounded-full bg-pink-100 px-5 py-3 text-xs font-black text-rose-950 transition hover:bg-white">Explore the Sanctuary <i class="fa-solid fa-arrow-down ml-1"></i></a></div>
      <div role="img" aria-label="Illustration of Christian sisters gathered in modest clothing, with natural uncovered hair and no jewelry or makeup" class="relative mx-auto mt-8 grid h-56 w-64 place-items-center lg:mt-0 lg:h-72 lg:w-80"><div class="absolute inset-5 rounded-[45%] border border-pink-100/20 shadow-[0_0_0_22px_rgba(255,255,255,.025),0_0_0_48px_rgba(255,255,255,.02)]"></div><svg class="relative z-10 h-full w-full drop-shadow-[0_18px_24px_rgba(0,0,0,.4)]" viewBox="0 0 340 250" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44 235c5-53 31-82 67-82s62 29 67 82H44Z" fill="#C59BB5"/><path d="M79 124c-8-34 5-61 29-65 27-5 48 16 47 53l-9 23-7-31-12-15-18 15-22 7-1 24-7-11Z" fill="#33252D"/><ellipse cx="111" cy="121" rx="30" ry="34" fill="#754B55"/><path d="M82 111c11-23 25-33 43-32 13 1 23 9 30 24-15-4-27-12-34-22-8 12-20 21-39 30Z" fill="#33252D"/><path d="M132 235c4-67 37-103 81-103s77 36 81 103H132Z" fill="#D9B681"/><path d="M176 105c-9-41 8-72 38-76 35-4 57 25 52 70l-10 35-9-43-17-19-25 19-26 8-1 29-8-23Z" fill="#302329"/><ellipse cx="213" cy="103" rx="34" ry="39" fill="#80595A"/><path d="M179 91c13-27 30-39 50-36 16 2 28 12 36 31-18-4-33-14-43-27-10 15-24 25-43 32Z" fill="#302329"/><path d="M0 235c4-44 25-67 55-67 16 0 30 7 40 21-13 16-20 32-23 46H0Z" fill="#82979A"/><path d="M28 145c-7-27 3-47 21-50 22-3 37 15 35 43l-7 24-6-28-11-12-15 12-15 5-1 17-5-11Z" fill="#35272C"/><ellipse cx="51" cy="143" rx="23" ry="27" fill="#68494E"/><path d="M29 133c8-18 19-27 33-26 11 1 19 8 25 21-12-3-22-10-28-18-7 10-16 17-30 23Z" fill="#35272C"/><path d="M285 235c3-43 23-66 52-66v66h-52Z" fill="#9B7997"/><path d="M304 145c-6-25 3-43 20-46 19-3 33 13 31 39l-6 21-6-25-10-11-14 11-13 5-1 15-4-9Z" fill="#34262C"/><ellipse cx="325" cy="143" rx="21" ry="26" fill="#725154"/><path d="M305 135c7-17 18-25 31-24 10 1 17 8 22 19-12-3-21-9-27-17-6 9-14 16-26 22Z" fill="#34262C"/><path d="M170 13v31m-15-16h30" stroke="#F6D58A" stroke-width="4" stroke-linecap="round"/></svg></div>
    </section>

    <nav aria-label="Women’s Sanctuary sections" class="flex gap-2 overflow-x-auto pb-2">${[["women-areas","fa-compass","Explore"],["women-faith","fa-book-bible","Faith & prayer"],["women-campus-life","fa-graduation-cap","Campus life"],["women-sisterhood","fa-people-group","Sisterhood"],["women-voices","fa-comments","Shared wisdom"]].map(([id,glyph,label]) => `<a href="#${id}" class="shrink-0 rounded-full border border-rose-100 bg-white/85 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"><i class="fa-solid ${glyph} mr-2 text-rose-700"></i>${label}</a>`).join("")}</nav>

    <section id="women-areas" class="scroll-mt-28"><div class="mb-5 max-w-2xl"><p class="text-[10px] font-black uppercase tracking-[.18em] text-rose-800">A sisterhood for the whole journey</p><h3 class="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Find encouragement for every part of campus life.</h3><p class="mt-2 text-sm leading-6 text-slate-600">Faith, friendship, learning, and service belong together. Explore the areas of the Sanctuary that matter to you.</p></div><div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <article id="women-faith" class="scroll-mt-28 relative isolate min-h-56 overflow-hidden rounded-[1.7rem_1.7rem_3rem_1.7rem] bg-gradient-to-br from-rose-900 to-purple-950 p-6 text-white shadow-lg"><span class="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-xl text-amber-200"><i class="fa-solid fa-book-open-reader"></i></span><h4 class="mt-5 text-lg font-black">Scripture & prayer</h4><p class="mt-2 text-xs leading-6 text-rose-50/80">Make space for reflection, prayer, and spiritual growth through busy weeks.</p></article>
      <article id="women-campus-life" class="scroll-mt-28 relative isolate min-h-56 overflow-hidden rounded-[1.7rem_1.7rem_3rem_1.7rem] bg-gradient-to-br from-[#153c3a] to-[#18294b] p-6 text-white shadow-lg"><span class="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-xl text-teal-200"><i class="fa-solid fa-graduation-cap"></i></span><h4 class="mt-5 text-lg font-black">Study & wellbeing</h4><p class="mt-2 text-xs leading-6 text-teal-50/80">Encourage healthy study rhythms, rest, resilience, and asking for support when needed.</p></article>
      <article class="relative isolate min-h-56 overflow-hidden rounded-[1.7rem_1.7rem_3rem_1.7rem] bg-gradient-to-br from-amber-800 to-rose-950 p-6 text-white shadow-lg"><span class="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-xl text-amber-200"><i class="fa-solid fa-user-group"></i></span><h4 class="mt-5 text-lg font-black">Mentoring & transition</h4><p class="mt-2 text-xs leading-6 text-amber-50/80">Help new sisters find their footing and learn from those further along the journey.</p></article>
      <article class="relative isolate min-h-56 overflow-hidden rounded-[1.7rem_1.7rem_3rem_1.7rem] bg-gradient-to-br from-violet-900 to-slate-950 p-6 text-white shadow-lg"><span class="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-xl text-pink-200"><i class="fa-solid fa-hands-holding-child"></i></span><h4 class="mt-5 text-lg font-black">Leadership & service</h4><p class="mt-2 text-xs leading-6 text-violet-50/80">Discover ways to contribute, organize, serve, and grow as a campus leader.</p></article>
    </div></section>

    <section class="relative isolate overflow-hidden rounded-[2rem_2.5rem_2rem_3.5rem] bg-gradient-to-r from-rose-50 via-white to-violet-50 p-6 shadow-[0_18px_60px_rgba(93,27,67,.07)] sm:p-9"><div class="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p class="text-[10px] font-black uppercase tracking-[.18em] text-rose-800">Whole-person encouragement</p><h3 class="mt-2 text-2xl font-black text-slate-950">Navigate campus with confidence.</h3><p class="mt-3 text-sm leading-6 text-slate-600">Practical peer support for university life, friendships, purpose, personal growth, and the questions students carry.</p><a href="https://t.me/ACE_USF_AssistantBot" target="_blank" rel="noopener noreferrer" class="mt-5 inline-flex items-center gap-2 text-xs font-black text-rose-800 hover:text-rose-950">Reach the sisters’ team <i class="fa-solid fa-arrow-up-right-from-square"></i></a></div><div class="grid gap-3 sm:grid-cols-2"><article class="rounded-2xl border border-rose-100/80 bg-white/80 p-5"><i class="fa-solid fa-book-open text-lg text-rose-700"></i><h4 class="mt-3 text-sm font-black text-slate-900">Academic encouragement</h4><p class="mt-1 text-xs leading-5 text-slate-600">Study routines, exams, collaboration, and learning with confidence.</p></article><article class="rounded-2xl border border-violet-100/80 bg-white/80 p-5"><i class="fa-solid fa-heart text-lg text-violet-700"></i><h4 class="mt-3 text-sm font-black text-slate-900">Emotional wellbeing</h4><p class="mt-1 text-xs leading-5 text-slate-600">Kind connection, personal boundaries, and seeking trusted support when needed.</p></article><article class="rounded-2xl border border-amber-100/80 bg-white/80 p-5"><i class="fa-solid fa-user-graduate text-lg text-amber-700"></i><h4 class="mt-3 text-sm font-black text-slate-900">Career & calling</h4><p class="mt-1 text-xs leading-5 text-slate-600">Share encouragement around skills, next steps, work, and service.</p></article><article class="rounded-2xl border border-teal-100/80 bg-white/80 p-5"><i class="fa-solid fa-people-roof text-lg text-teal-700"></i><h4 class="mt-3 text-sm font-black text-slate-900">Sisterhood across schools</h4><p class="mt-1 text-xs leading-5 text-slate-600">Welcome women students from different campuses into a caring community.</p></article></div></div></section>

    <section id="women-sisterhood" class="scroll-mt-28 relative isolate overflow-hidden rounded-[2rem_3rem_2rem_4rem] bg-gradient-to-br from-[#21162d] via-[#3c2547] to-[#193e3b] px-6 py-8 text-white shadow-xl sm:px-9"><div aria-hidden="true" class="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10"></div><p class="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">Belonging across campuses</p><h3 class="mt-2 text-2xl font-black">One sisterhood, many stories.</h3><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Build friendships, welcome sisters from different universities, and create a culture of kindness, respect, and encouragement.</p><div class="mt-6 grid gap-4 sm:grid-cols-3"><div class="border-l-2 border-pink-300/70 pl-4"><p class="text-sm font-black">Welcome</p><p class="mt-1 text-xs text-slate-300">Help each sister feel seen and included.</p></div><div class="border-l-2 border-amber-300/70 pl-4"><p class="text-sm font-black">Encourage</p><p class="mt-1 text-xs text-slate-300">Share hope and practical kindness.</p></div><div class="border-l-2 border-teal-300/70 pl-4"><p class="text-sm font-black">Serve</p><p class="mt-1 text-xs text-slate-300">Use gifts to strengthen campus fellowship.</p></div></div></section>

    <div class="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-3xl p-6 md:p-8 shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <span class="px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">Sisters Fellowship · Program Updates</span>
        <h3 class="text-2xl font-black mt-3 mb-2">Sisters Fellowship & Discipleship Gathering</h3>
        <p class="text-pink-100 text-sm max-w-xl">
          Connect with the fellowship team for upcoming prayer, discipleship, mentoring, and campus encouragement gatherings.
        </p>
      </div>
      <a href="https://t.me/ACE_USF_AssistantBot" target="_blank" rel="noopener noreferrer" class="px-6 py-3.5 bg-white text-rose-700 hover:bg-pink-50 font-black text-xs uppercase tracking-wider rounded-full shadow-md transition shrink-0">
        Ask about upcoming gatherings <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i>
      </a>
    </div>

    <div class="bg-white border border-pink-100 rounded-3xl p-6 md:p-8 shadow-sm">
      <h3 id="women-voices" class="scroll-mt-28 text-lg font-bold text-slate-900 mb-2">Experience Sharing & Advice Room</h3>
      <p class="mb-6 border-b border-pink-100 pb-4 text-xs leading-5 text-slate-600">This reflection wall is stored only in this browser. It is not sent to other members or administrators. Please do not post personal or sensitive details.</p>

      <div class="space-y-4 mb-8">
        ${womensMinistryPosts.map(post => `
          <div data-campus-search-record data-search="${safe([post.author, post.role, post.title, post.content].join(" "))}" class="p-5 rounded-2xl bg-pink-50/50 border border-pink-100">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-pink-800 bg-white px-2.5 py-1 rounded-lg border border-pink-200">${safe(post.author)} (${safe(post.role)})</span>
              <span class="text-xs text-slate-400">${safe(post.date)}</span>
            </div>
            <h4 class="text-sm font-bold text-slate-900 mb-1">${safe(post.title)}</h4>
            <p class="text-slate-700 text-xs leading-relaxed">${safe(post.content)}</p>
          </div>
        `).join('')}
      </div>

      <form id="womens-post-form" class="space-y-3 pt-6 border-t border-pink-100">
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Share an Encouragement or Question</label>
        <input type="text" id="w-author-name" required maxlength="60" placeholder="Name or preferred display name" class="w-full px-4 py-2.5 bg-slate-50 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/25">
        <input type="text" id="w-post-title" required maxlength="100" placeholder="Topic Title" class="w-full px-4 py-2.5 bg-slate-50 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/25">
        <textarea id="w-post-content" rows="3" required maxlength="1200" placeholder="Write an encouragement or faith reflection…" class="w-full px-4 py-2.5 bg-slate-50 border border-pink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/25 resize-y"></textarea>
        <button type="submit" class="px-6 py-3 bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition">
          Save on this device
        </button>
      </form>
    </div>
    </div>
  `;
  applySectionSearch(container);

  document.getElementById("womens-post-form").onsubmit = (e) => {
    e.preventDefault();
    const name = container.querySelector("#w-author-name")?.value.trim();
    const title = container.querySelector("#w-post-title")?.value.trim();
    const content = container.querySelector("#w-post-content")?.value.trim();

    if (name && title && content) {
      womensMinistryPosts.unshift({
        id: Date.now(),
        author: name,
        role: "Fellowship Sister · local post",
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
    <div class="relative isolate mb-8 overflow-hidden rounded-[2rem_3rem_2rem_4rem] border border-amber-100 bg-[radial-gradient(ellipse_at_82%_15%,rgba(251,191,36,.2),transparent_33%),linear-gradient(115deg,#261b17,#172a31_62%,#28443f)] px-6 py-9 text-white shadow-[0_26px_75px_rgba(30,24,18,.2)] sm:px-10 md:py-12">
      <div aria-hidden="true" class="pointer-events-none absolute -right-8 -top-16 hidden h-72 w-[42%] items-center justify-center md:flex"><div class="absolute h-52 w-52 rounded-full border border-amber-100/20 shadow-[0_0_0_24px_rgba(255,255,255,.03),0_0_0_52px_rgba(255,255,255,.025)]"></div><i class="fa-solid fa-people-roof text-7xl text-amber-100/80 drop-shadow-2xl"></i><i class="fa-solid fa-book-bible absolute bottom-12 right-20 text-3xl text-teal-100"></i><i class="fa-solid fa-heart absolute right-28 top-12 text-xl text-rose-200"></i></div>
      <div class="relative z-10 max-w-2xl md:pr-[30%]">
        <span class="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-100 backdrop-blur"><i class="fa-solid fa-hands-holding-child text-amber-300"></i> Wisdom across generations</span>
        <p class="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-teal-200">Listen · encourage · walk together</p>
        <h2 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Fathers & Mothers</h2>
        <p class="mt-4 max-w-xl text-sm leading-7 text-slate-200">A welcoming place to learn from trusted spiritual mentors, ask for guidance, and find prayerful encouragement through university life.</p>
        <div class="mt-6 flex flex-wrap gap-2 text-[10px] font-bold text-amber-50"><span class="rounded-full border border-white/15 bg-white/10 px-3 py-2">Pastoral wisdom</span><span class="rounded-full border border-white/15 bg-white/10 px-3 py-2">Student wellbeing</span><span class="rounded-full border border-white/15 bg-white/10 px-3 py-2">Prayer support</span></div>
      </div>
    </div>

    <section aria-label="How the Fathers and Mothers space supports students" class="mb-8 grid gap-4 sm:grid-cols-3">
      <article class="rounded-[1.5rem_2rem_1.5rem_2.5rem] bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm"><i class="fa-solid fa-ear-listen text-xl text-amber-800"></i><h3 class="mt-3 text-sm font-black text-slate-900">A listening ear</h3><p class="mt-2 text-xs leading-5 text-slate-600">Seek compassionate conversation and guidance without pressure or judgment.</p></article>
      <article class="rounded-[1.5rem_2rem_1.5rem_2.5rem] bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm"><i class="fa-solid fa-book-open text-xl text-teal-800"></i><h3 class="mt-3 text-sm font-black text-slate-900">Faith & learning</h3><p class="mt-2 text-xs leading-5 text-slate-600">Bring questions about spiritual growth, study, relationships, or life transitions.</p></article>
      <article class="rounded-[1.5rem_2rem_1.5rem_2.5rem] bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm"><i class="fa-solid fa-people-group text-xl text-rose-800"></i><h3 class="mt-3 text-sm font-black text-slate-900">Care with respect</h3><p class="mt-2 text-xs leading-5 text-slate-600">Share only what feels safe. For urgent or sensitive needs, contact a trusted person directly.</p></article>
    </section>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      ${eldersWisdomData.map(item => `
        <div data-campus-search-record data-search="${safe([item.speaker, item.category, item.title, item.summary].join(" "))}" class="bg-white border border-amber-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-4 mb-4 pb-4 border-b border-amber-50">
            <img src="${safe(item.image)}" alt="${safe(item.speaker)}" class="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shadow-sm">
            <div>
              <h4 class="text-base font-bold text-slate-900">${safe(item.speaker)}</h4>
              <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">${safe(item.category)}</span>
            </div>
          </div>
          <h3 class="text-lg font-extrabold text-slate-900 mb-2">${safe(item.title)}</h3>
          <p class="text-slate-600 text-xs leading-relaxed italic mb-4">"${safe(item.summary)}"</p>
        </div>
      `).join('')}
    </div>

    <div class="relative isolate overflow-hidden rounded-[1.8rem_2.4rem_1.8rem_3rem] bg-gradient-to-br from-amber-50 via-white to-teal-50 p-6 shadow-[0_18px_55px_rgba(15,23,42,.08)] md:p-8">
      <h3 class="text-base font-bold text-slate-900 mb-2">Ask for guidance or prayer</h3>
      <p class="text-slate-600 text-xs mb-4">This form is a local preview and does not send your message. For a real response, contact the ACE-USF team through the Assistant.</p>

      <form id="ask-elder-form" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" id="ask-name" required placeholder="Your Name or 'Anonymous Student'" class="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25">
          <input type="text" id="ask-campus" required placeholder="Your Campus / University" class="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25">
        </div>
        <textarea id="ask-message" rows="3" required placeholder="Type your spiritual, career, or personal question..." class="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 resize-none"></textarea>
        <button type="submit" class="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm">
          Prepare a message for counsel
        </button>
      </form>
    </div>
  `;
  applySectionSearch(container);

  document.getElementById("ask-elder-form").onsubmit = (e) => {
    e.preventDefault();
    alert("This form is not connected to message delivery yet. Please contact the ACE-USF Assistant to send your request to the team.");
    e.target.reset();
  };
}

/**
 * 5. NEW STANDARDIZED FEATURE: NATIONAL PRAYER & FASTING BULLETIN BOARD
 */
function renderPrayerBulletinTab(container) {
  container.innerHTML = `
    <div class="relative isolate mb-8 overflow-hidden rounded-[2rem_3rem_2rem_4rem] border border-teal-100 bg-[radial-gradient(ellipse_at_82%_15%,rgba(45,212,191,.2),transparent_34%),linear-gradient(115deg,#082c2c,#102536_58%,#243c36)] px-6 py-9 text-white shadow-[0_26px_75px_rgba(8,47,47,.2)] sm:px-10 md:py-12">
      <div aria-hidden="true" class="pointer-events-none absolute -right-8 -top-16 hidden h-72 w-[42%] items-center justify-center md:flex"><div class="absolute h-52 w-52 rounded-full border border-teal-100/20 shadow-[0_0_0_24px_rgba(255,255,255,.03),0_0_0_52px_rgba(255,255,255,.025)]"></div><i class="fa-solid fa-hands-praying text-7xl text-teal-100/85 drop-shadow-2xl"></i><i class="fa-solid fa-dove absolute right-20 top-12 text-3xl text-amber-200"></i><i class="fa-solid fa-book-bible absolute bottom-12 right-28 text-2xl text-white/80"></i></div>
      <div class="relative z-10 max-w-2xl md:pr-[30%]">
        <span class="inline-flex items-center gap-2 rounded-full border border-teal-100/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-teal-100 backdrop-blur"><i class="fa-solid fa-hands-praying text-teal-200"></i> Prayer across campuses</span>
        <p class="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-amber-200">Pause · pray · encourage</p>
        <h2 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Prayer & Fasting Wall</h2>
        <p class="mt-4 max-w-xl text-sm leading-7 text-slate-200">Set aside a moment for prayer, share encouragement, and remember students and campus communities across Ethiopia.</p>
        <div class="mt-6 flex flex-wrap gap-2 text-[10px] font-bold text-teal-50"><span class="rounded-full border border-white/15 bg-white/10 px-3 py-2">Campus prayer</span><span class="rounded-full border border-white/15 bg-white/10 px-3 py-2">Shared encouragement</span><span class="rounded-full border border-white/15 bg-white/10 px-3 py-2">Weekly reflection</span></div>
      </div>
    </div>

    <!-- Submit Prayer Request Card -->
    <div class="relative isolate mb-8 overflow-hidden rounded-[1.8rem_2.4rem_1.8rem_3rem] bg-gradient-to-br from-white via-teal-50/70 to-amber-50/70 p-6 shadow-[0_18px_55px_rgba(15,23,42,.08)] md:p-8">
      <h3 class="text-base font-bold text-slate-900 mb-2">Post Urgent Campus Prayer Request</h3>
      <p class="text-slate-600 text-xs mb-4">This wall is saved in this browser only; it is not yet shared with other visitors. Avoid posting identifying or sensitive details.</p>

      <form id="prayer-req-form" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" id="p-author" required placeholder="Your Name or Initials" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
          <input type="text" id="p-campus" required placeholder="University / Campus" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25">
        </div>
        <textarea id="p-request" rows="2" required placeholder="Describe your prayer burden..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 resize-none"></textarea>
        <button type="submit" class="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm">
          Save prayer request on this device
        </button>
      </form>
    </div>

    <!-- Prayer Feed -->
    <div class="space-y-4" id="prayer-feed-container">
      ${prayerBulletinData.map(item => `
        <div data-campus-search-record data-search="${safe([item.campus, item.author, item.request].join(" "))}" class="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">${safe(item.campus)}</span>
              <span class="text-xs text-slate-400">By ${safe(item.author)} • ${safe(item.date)}</span>
            </div>
            <p class="text-slate-900 text-sm font-semibold">${safe(item.request)}</p>
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

  const school = COLLEGE_SCHOOLS.find(item => item.id === campus.schoolId);
  if (school) {
    const departments = seniorDepartments.filter(item => school.groups.includes(item.group));
    const total = formatSchoolCount(school.id);
    container.innerHTML = `
      <main id="chapter-school-detail" data-school-id="${safe(school.id)}" style="grid-column:1 / -1;width:100%;min-width:0" class="min-w-0 overflow-hidden rounded-[2.5rem] bg-[#f7f8f6] text-slate-900 shadow-[0_32px_100px_rgba(15,23,42,.16)]">
        <section class="relative isolate flex min-h-[250px] items-start overflow-hidden bg-slate-950 px-5 py-5 sm:min-h-[340px] sm:px-8 sm:py-8 lg:min-h-[430px] lg:px-12 lg:py-10">
          <img src="${safe(campus.bannerImage)}" alt="${safe(campus.name)}" class="absolute inset-0 z-0 h-full w-full object-cover object-center">
          <div class="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/25 via-transparent to-slate-950/10"></div>
          <button id="btn-back-to-hub" class="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-xl transition hover:bg-white/15 sm:left-10 sm:top-9"><i class="fa-solid fa-arrow-left"></i> Campus Network</button>
          <span class="absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/30 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white shadow-lg backdrop-blur-xl sm:bottom-8 sm:right-8"><i class="fa-solid ${school.icon} text-amber-300"></i> College fellowship</span>
        </section>
        <section class="relative overflow-hidden px-5 py-8 sm:px-9 sm:py-11 lg:px-14"><div class="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-teal-100/70 blur-3xl"></div><div class="relative"><div class="flex flex-col justify-between gap-6 border-b border-slate-200/80 pb-7 sm:flex-row sm:items-end"><div class="max-w-3xl"><p class="text-[10px] font-black uppercase tracking-[.2em] text-teal-800">ACE-USF · One college, many disciplines</p><h1 class="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">${safe(school.title)} Fellowship</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">${safe(campus.description)} Find your department and connect with your college fellowship.</p><div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600"><span><i class="fa-solid fa-location-dot mr-1.5 text-teal-700"></i>${safe(campus.location)}</span><span><i class="fa-regular fa-clock mr-1.5 text-teal-700"></i>${safe(campus.meetingTime)}</span></div></div><div class="flex flex-wrap gap-2"><span class="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-900"><span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span><b data-live-school-total="${safe(school.id)}">${safe(total)}</b> students</span><span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-xs font-bold text-slate-700"><i class="fa-solid fa-layer-group text-teal-700"></i>${departments.length} departments</span></div></div>
          <div class="flex flex-col justify-between gap-3 pt-7 sm:flex-row sm:items-end"><div><p class="text-[10px] font-black uppercase tracking-[.18em] text-amber-700">Choose your field</p><h2 class="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Departments in this college</h2><p class="mt-1 text-xs leading-5 text-slate-600">Roster badges update live as the published department directory changes.</p></div><label class="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2.5 shadow-sm focus-within:border-teal-600 sm:max-w-xs"><i class="fa-solid fa-magnifying-glass text-xs text-slate-400"></i><input type="search" data-school-department-search class="min-w-0 flex-1 border-0 bg-transparent text-xs text-slate-800 outline-none focus:ring-0" placeholder="Search departments…" aria-label="Search departments"></label></div>
          <div class="mt-5 grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">${departments.map((department, index) => {
            const count = countForDepartment(school.id, department);
            return `<article data-school-department-row data-department-search="${safe(department.name.toLowerCase())}" class="group flex min-w-0 items-center gap-3 border-b border-slate-200/70 py-4 transition hover:translate-x-1"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-950 to-teal-900 text-sm text-amber-300 shadow-md"><i class="fa-solid ${school.icon}" aria-hidden="true"></i></span><div class="min-w-0 flex-1"><h3 class="text-sm font-extrabold leading-snug text-slate-900">${safe(department.name)}</h3><p class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Department ${String(index + 1).padStart(2, "0")}</p></div><span data-live-department-count="${safe(school.id)}:${safe(department.id)}" class="inline-flex shrink-0 items-center gap-1.5 rounded-full ${count === null ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-800"} px-3 py-1.5 text-[10px] font-black"><span class="h-1.5 w-1.5 rounded-full ${count === null ? "bg-slate-400" : "animate-pulse bg-emerald-500"}"></span>${count === null ? "Count pending" : `${count.toLocaleString()} students`}</span></article>`;
          }).join("")}</div>
          <p data-school-department-empty class="hidden py-7 text-center text-sm font-semibold text-slate-500">No department matches your search.</p>
          <div class="mt-8 flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:p-8"><div><p class="text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Departmental Bible study</p><h3 class="mt-2 text-xl font-black">Gather with your college community</h3><p class="mt-2 max-w-xl text-xs leading-5 text-slate-300">Study rooms are limited to members whose recorded department belongs to this college and whose access is approved by an administrator.</p></div><button type="button" data-campus-study-school="${safe(school.id)}" class="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-xs font-black text-slate-950 transition hover:bg-amber-200"><i class="fa-solid fa-book-open"></i> Open Bible Study</button></div>
          </div>
        </section>
      </main>`;
    container.querySelector("#btn-back-to-hub")?.addEventListener("click", () => renderCampusNetworkSection("app-dashboard"));
    const departmentSearch = container.querySelector("[data-school-department-search]");
    departmentSearch?.addEventListener("input", () => {
      const term = departmentSearch.value.trim().toLowerCase();
      const rows = [...container.querySelectorAll("[data-school-department-row]")];
      let visible = 0;
      rows.forEach(row => { const match = row.dataset.departmentSearch.includes(term); row.classList.toggle("hidden", !match); if (match) visible += 1; });
      container.querySelector("[data-school-department-empty]")?.classList.toggle("hidden", visible > 0);
    });
    container.querySelector("[data-campus-study-school]")?.addEventListener("click", () => {
      openCampusBibleStudies(school.id);
    });
    return;
  }

  container.innerHTML = `
    <div style="grid-column:1 / -1;width:100%;min-width:0" class="mb-6 flex items-center justify-between">
      <button id="btn-back-to-hub" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition">
        <i class="fa-solid fa-arrow-left"></i> Back to Campus Network
      </button>
    </div>

    <div style="grid-column:1 / -1;width:100%;min-width:0" class="relative rounded-3xl overflow-hidden shadow-2xl mb-8 bg-slate-900 text-white min-h-[300px] flex flex-col justify-end p-8 md:p-12">
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
