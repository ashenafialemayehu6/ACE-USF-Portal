// ACE-USF owner/admin content workspace.
// Firestore Rules enforce who can make changes.

import { db, storage } from "./firebase_config.js";
import { isCurrentUserAdmin } from "./firebase_auth_service.js";
import { ethiopianInstitutions } from "./institutions.js";
import { seniorDepartments } from "./academic_data.js";
import {
  collection,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-storage.js";

const SECTIONS = {
  userProfiles: {
    label: "Member account eligibility profiles",
    fields: [
      ["uid", "Firebase Authentication UID", "readOnly"],
      ["displayName", "Member name"],
      ["email", "Account email", "readOnly"],
      ["campus", "University / college", "campus"],
      ["department", "Recorded department · administrator correction", "department"],
      ["sex", "Recorded sex · administrator correction", "meetingSex"]
    ]
  },
  leaders: {
    label: "Fellowship Leaders Network · universities and campus teams",
    fields: [
      ["universityName", "University / college (choose an existing university to add its contacts)", "campus"],
      ["city", "City", "city"],
      ["latitude", "Latitude", "number"],
      ["longitude", "Longitude", "number"],
      ["fellowshipName", "Fellowship or shared congregation name"],
      ["description", "Campus fellowship description", "textarea"],
      ["branchesText", "Campus branches and fellowship contacts", "branches"],
      ["churchPriestName", "Church priest / chaplain name"],
      ["churchPriestPhone", "Church priest / chaplain phone", "tel"],
      ["churchPriestPhonePublic", "Show priest phone publicly (with consent)", "checkbox"]
    ]
  },

  library: {
    label: "Library resources",
    fields: [
      ["title", "Book or resource title"],
      ["author", "Author / speaker"],
      ["room", "Room: Spiritual or Academic"],
      ["category", "Topic / category"],
      ["description", "Description", "textarea"],
      ["resourceUrl", "PDF, audio, or external resource link"],
      ["format", "Format: PDF, audio, website"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  audioLibrary: {
    label: "Audio Room resources",
    fields: [
      ["type", "Room / resource type", "audioType"],
      ["title", "Title"],
      ["creator", "Preacher / singer / author"],
      ["category", "Topic / category"],
      ["description", "Short description", "textarea"],
      ["text", "Poem text (for text poems)", "textarea"],
      ["mediaFile", "Audio file (MP3, M4A, WAV, OGG; up to 1 GB)", "audioFile"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  studentAdvice: {
    label: "Student Advice Room",
    fields: [
      ["sourceType", "Advice room", "adviceSource"],
      ["title", "Advice title"],
      ["author", "Contributor name"],
      ["language", "Language (type the language name)"],
      ["university", "University / college (students and alumni)", "campus"],
      ["department", "Department (students and alumni)", "department"],
      ["churchPosition", "Church position (church servants)", "churchPosition"],
      ["category", "Topic / category"],
      ["advice", "Advice message", "textarea"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  meetingPrograms: {
    label: "Meeting Room programs",
    fields: [
      ["programType", "Program type", "meetingProgramType"],
      ["title", "Program title"],
      ["description", "Program details", "textarea"],
      ["eventDate", "Date", "date"],
      ["startTime", "Start time (Ethiopia time, EAT)", "time"],
      ["endTime", "End time (Ethiopia time, EAT)", "time"],
      ["format", "Meeting format", "meetingFormat"],
      ["university", "University / college", "campus"],
      ["department", "Department", "department"],
      ["departmentGroup", "Approved study group", "meetingDepartmentGroup"],
      ["location", "Location / meeting place"],
      ["scripture", "Study Scripture", "textarea"],
      ["meetingUrl", "Private meeting link (HTTPS; only eligible participants can retrieve it)"],
      ["accessNotes", "Private access instructions", "textarea"],
      ["liveAudioRoom", "Enable the ACE-USF live audio room", "checkboxOff"],
      ["hostUid", "Live audio leader Firebase UID (private)", "text"],
      ["audience", "Who may enter", "meetingAudience"],
      ["category", "Topic / theme"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  meetingRoomMembers: {
    label: "Meeting Room membership access",
    fields: [
      ["uid", "Firebase Authentication UID (exact UID)"],
      ["name", "Member / leader name"],
      ["university", "University / college", "campus"],
      ["department", "Department", "department"],
      ["sex", "Recorded sex · admin verified", "meetingSex"],
      ["departmentGroup", "Approved study group", "meetingDepartmentGroup"],
      ["active", "Approve this department membership", "checkboxOff"],
      ["leadersOnly", "Also allow leaders-only programs", "checkboxOff"],
      ["womenMinistry", "Approve for Women’s Ministry room", "checkboxOff"]
    ]
  },

  meetingAccessRequests: {
    label: "Meeting Hall access requests",
    fields: [
      ["requesterName", "Requester", "readOnly"],
      ["requesterEmail", "Account email", "readOnly"],
      ["universityName", "University / college", "readOnly"],
      ["fellowshipRole", "Fellowship role (self-reported)", "readOnly"],
      ["profileSex", "Account sex · read-only", "readOnly"],
      ["uid", "Firebase UID", "readOnly"],
      ["programTitle", "Requested gathering", "readOnly"],
      ["programId", "Program ID", "readOnly"],
      ["audience", "Requested room type", "readOnly"],
      ["requestedDepartment", "Requested department", "readOnly"],
      ["departmentGroup", "Requested study group", "readOnly"],
      ["eligibilityConfirmed", "Applicant confirmed eligibility", "readOnly"],
      ["status", "Decision", "meetingRequestStatus"],
      ["adminNote", "Message for applicant", "textarea"]
    ]
  },

  campusSchoolCoordinators: {
    label: "College Bible Study coordinators",
    fields: [
      ["schoolId", "College", "campusSchoolId"],
      ["schoolName", "College / school name"],
      ["coordinatorName", "Approved school coordinator name"],
      ["department", "Coordinator department", "department"],
      ["university", "University / college", "campus"],
      ["telegram", "Coordinator Telegram username"],
      ["schedule", "Bible study schedule"],
      ["departmentCounts", "Live department roster counts · JSON", "campusDepartmentCounts"],
      ["published", "Publish this coordinator", "checkbox"]
    ]
  },

  campuses: {
    label: "Campus network",
    fields: [
      ["universityName", "University / college", "campus"],
      ["region", "Region"],
      ["city", "City", "city"],
      ["activeMembers", "Active members", "number"],
      ["meetingTime", "Meeting schedule"],
      ["description", "Campus information", "textarea"],
      ["latitude", "Latitude", "number"],
      ["longitude", "Longitude", "number"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  announcements: {
    label: "Announcements & events",
    fields: [
      ["title", "Title"],
      ["category", "Category"],
      ["body", "Announcement", "textarea"],
      ["eventDate", "Date"],
      ["location", "Location"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  freshmenAlumni: {
    label: "Freshmen & alumni",
    fields: [
      ["title", "Title"],
      ["audience", "Audience"],
      ["description", "Information", "textarea"],
      ["actionLabel", "Button label"],
      ["actionUrl", "Link"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  },

  weatherGuides: {
    label: "Seasonal weather guides",
    fields: [
      ["campus", "University / college", "campus"],
      ["city", "City / region", "city"],
      ["belg", "Belg season guide", "textarea"],
      ["kiremt", "Kiremt season guide", "textarea"],
      ["bega", "Bega season guide", "textarea"],
      ["published", "Visible to visitors", "checkbox"]
    ]
  }
};

const COMMON_DEPARTMENTS = [
  "Accounting and Finance",
  "Agriculture",
  "Animal Science",
  "Architecture",
  "Biology",
  "Business Management",
  "Chemistry",
  "Civil Engineering",
  "Computer Science",
  "Economics",
  "Education",
  "Electrical and Computer Engineering",
  "English Language and Literature",
  "Environmental Science",
  "Geography",
  "Information Science",
  "Information Systems",
  "Information Technology",
  "Law",
  "Marketing Management",
  "Mathematics",
  "Mechanical Engineering",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Physics",
  "Public Health",
  "Psychology",
  "Software Engineering",
  "Sociology",
  "Statistics",
  "Veterinary Medicine"
];

const safe = value =>
  String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

const campusNames = Array.isArray(ethiopianInstitutions)
  ? ethiopianInstitutions
      .map(institution => String(institution.name || "").trim())
      .filter(Boolean)
  : [];

// Commonly used city and town names for campus directory entry. Admins can
// still type and save any locality that is not in this convenience list.
const ETHIOPIAN_CITIES = [
  "Addis Ababa", "Adama (Nazret)", "Adigrat", "Agaro", "Aksum", "Alamata", "Aleta Wendo", "Ambo", "Arba Minch", "Arsi Negele", "Assela", "Assosa", "Aysaita", "Bahir Dar", "Bale Robe", "Batu (Ziway)", "Bedelle", "Bedele", "Bishoftu (Debre Zeit)", "Boditi", "Bonga", "Bule Hora", "Burayu", "Butajira", "Chiro", "Dabat", "Dabat town", "Dallol", "Debark", "Debre Berhan", "Debre Markos", "Debre Tabor", "Dembi Dolo", "Dessie", "Dilla", "Dire Dawa", "Dolo Odo", "Durame", "Fiche", "Finote Selam", "Gambella", "Gimbi", "Ginir", "Goba", "Gode", "Gondar", "Hawassa", "Haramaya", "Harar", "Hosaena (Hossana)", "Humera", "Hurso", "Injibara", "Jijiga", "Jimma", "Jinka", "Kebri Dehar", "Kombolcha", "Konso", "Kulubi", "Mekelle", "Mettu", "Mizan Teferi", "Moyale", "Mojo", "Negele Borana", "Nekemte", "Robe", "Shashamane", "Shire (Inda Selassie)", "Sodo (Wolaita Sodo)", "Wolaita Sodo", "Woldia", "Werabe", "Wolkite", "Yabelo", "Yirgalem", "Abomsa", "Agarfa", "Alem Ketema", "Alem Tena", "Aleta Chuko", "Areka", "Asaita", "Assayita", "Bule", "Chelenko", "Chagni", "Dabat", "Debre Sina", "Dejen", "Dodola", "Fedis", "Goba", "Gore", "Hagere Maryam", "Hirna", "Kibre Mengist", "Lalibela", "Logia", "Mekdela", "Mendi", "Metu", "Mieso", "Motta", "Nedjo", "Sekota", "Sendafa", "Shambu", "Shashemene", "Tepi", "Tulu Bolo", "Welenchiti", "Wenji", "Yabello"
];

let pickerOptions = {
  campus: [...new Set(campusNames)].sort((a, b) => a.localeCompare(b)),
  city: [...new Set([...ETHIOPIAN_CITIES, ...(Array.isArray(ethiopianInstitutions) ? ethiopianInstitutions.map(institution => String(institution.city || "").trim()) : [])].filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  department: [...COMMON_DEPARTMENTS].sort((a, b) => a.localeCompare(b))
};

let unsubscribe = null;
let activeUploadTask = null;
let adminToastTimer = null;

export function setupAdminDashboard() {
  if (document.getElementById("ace-admin-open")) return;

  const menu = document.getElementById("user-dropdown-menu");
  const logout = document.getElementById("header-logout-btn")?.parentElement;

  if (!menu || !logout) return;

  const adminButton = document.createElement("button");
  adminButton.id = "ace-admin-open";
  adminButton.type = "button";
  adminButton.className =
    "hidden w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-teal-900 hover:bg-teal-50";
  adminButton.innerHTML =
    '<i class="fa-solid fa-screwdriver-wrench mr-2"></i>Site content manager';

  logout.before(adminButton);
  ensurePanel();

  adminButton.addEventListener("click", async () => {
    menu.classList.add("hidden");
    await openPanel();
  });

  window.addEventListener("aceusf-auth-changed", refreshAccess);
  refreshAccess();
}

async function refreshAccess() {
  const adminButton = document.getElementById("ace-admin-open");
  let admin = false;

  try {
    admin = await isCurrentUserAdmin();
  } catch {
    // Keep the admin tool hidden until Firebase access is available.
  }

  adminButton?.classList.toggle("hidden", !admin);
}

function ensurePanel() {
  if (document.getElementById("ace-admin-panel")) return;

  const panel = document.createElement("div");
  panel.id = "ace-admin-panel";
  panel.className =
    "fixed inset-0 z-[100] hidden items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6";

  panel.innerHTML = `
    <style>
      #ace-admin-panel { --ace-ink:#102b25; --ace-green:#126653; --ace-gold:#d9b76d; }
      #ace-admin-panel [data-admin-section] { transition:background .18s ease,border-color .18s ease,transform .18s ease; }
      #ace-admin-panel [data-admin-section]:hover { transform:translateY(-1px); }
      #ace-admin-panel #ace-admin-status { border:1px solid #dce8e2; border-radius:14px; padding:11px 13px; background:#f7faf8; color:#39534b; }
      #ace-admin-panel #ace-admin-status[data-state="success"] { border-color:#a6d9c6; background:#eaf8f1; color:#146246; }
      #ace-admin-panel #ace-admin-status[data-state="error"] { border-color:#f2b9b9; background:#fff1f1; color:#9a2929; }
      #ace-admin-panel #ace-admin-status[data-state="progress"] { border-color:#e8d39c; background:#fff9e9; color:#765311; }
      #ace-admin-panel #ace-admin-toast { position:fixed; z-index:140; top:22px; right:22px; display:flex; max-width:min(440px,calc(100vw - 32px)); align-items:center; gap:12px; border:1px solid #dce8e2; border-radius:18px; padding:14px 18px; background:#fff; box-shadow:0 18px 55px rgba(8,31,26,.22); opacity:0; pointer-events:none; transform:translateY(-10px) scale(.98); transition:opacity .22s ease,transform .22s ease; }
      #ace-admin-panel #ace-admin-toast[data-state="success"] { border-color:#a6d9c6; }
      #ace-admin-panel #ace-admin-toast[data-state="error"] { border-color:#f2b9b9; }
      #ace-admin-panel #ace-admin-toast.ace-toast-visible { opacity:1; transform:translateY(0) scale(1); }
      #ace-admin-panel .ace-confirm-card { animation:aceConfirmEnter .2s ease-out both; }
      #ace-admin-panel #ace-admin-list { max-height:min(58vh,690px); overflow-y:auto; overscroll-behavior:contain; padding-right:4px; scrollbar-color:#8bb7a7 #edf3ef; scrollbar-width:thin; }
      #ace-admin-panel #ace-admin-list > [data-admin-record] { transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease; }
      #ace-admin-panel #ace-admin-list > [data-admin-record]:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(16,43,37,.08); }
      #ace-admin-panel [data-admin-record][data-pending="true"] { border-color:#e9c77a; background:linear-gradient(110deg,#fffaf0,#fff); }
      @keyframes aceConfirmEnter { from { opacity:0; transform:translateY(8px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }
      #ace-admin-panel .ace-upload-track { height:8px; overflow:hidden; border-radius:99px; background:#e8eee9; }
      #ace-admin-panel .ace-upload-track > span { display:block; width:0; height:100%; border-radius:inherit; background:linear-gradient(90deg,#18745d,#d9b76d); transition:width .2s ease; }
      @media (prefers-reduced-motion: reduce) { #ace-admin-panel [data-admin-section], #ace-admin-panel .ace-upload-track > span, #ace-admin-panel #ace-admin-toast { transition:none; } #ace-admin-panel .ace-confirm-card { animation:none; } }
    </style>
    <div id="ace-admin-toast" role="status" aria-live="polite"><span id="ace-admin-toast-icon" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700"><i class="fa-solid fa-check"></i></span><span id="ace-admin-toast-message" class="text-sm font-extrabold text-slate-900"></span></div>
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="ace-admin-title"
      class="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
    >
      <header class="flex items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 px-5 py-4 text-white sm:px-7">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">
            ACE-USF · ADMIN WORKSPACE
          </p>
          <h2 id="ace-admin-title" class="mt-1 text-xl font-black">
            Manage website content
          </h2>
        </div>
        <button
          id="ace-admin-close"
          type="button"
          class="rounded-xl border border-white/20 px-3 py-2 text-sm"
          aria-label="Close admin workspace"
        >
          Close
        </button>
      </header>

      <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:p-6">
        <section class="space-y-4">
          <label class="block text-xs font-bold text-slate-600">Find a content area
            <input id="ace-admin-section-search" type="search" placeholder="Type campus, library, event…" autocomplete="off" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
          </label>
          <label class="block text-xs font-bold text-slate-600">
            Content areas · <span id="ace-admin-section-count"></span>
            <select
              id="ace-admin-section"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            ></select>
          </label>
          <label class="block text-xs font-bold text-slate-600">Search records
            <input id="ace-admin-list-search" type="search" placeholder="Search by name, department, title…" autocomplete="off" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10">
          </label>
          <div id="ace-admin-request-tools" class="hidden space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
            <div class="flex items-center justify-between gap-2"><strong class="text-xs font-black text-amber-950">Priority review queue</strong><span id="ace-admin-pending-count" class="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black text-amber-950">0 pending</span></div>
            <select id="ace-admin-request-filter" aria-label="Filter requests by status" class="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm"><option value="pending">Pending requests first</option><option value="all">All requests</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
          </div>
          <div id="ace-admin-list" class="space-y-2"></div>
        </section>

        <form
          id="ace-admin-form"
          class="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-black text-slate-900">Add or edit an item</h3>
            <button
              id="ace-admin-new"
              type="button"
              class="text-xs font-bold text-teal-800 underline"
            >
              New item
            </button>
          </div>

          <p id="ace-admin-status" data-state="info" aria-live="polite" role="status" class="text-xs">
            Choose a section to begin.
          </p>

          <div id="ace-admin-fields" class="grid gap-3 sm:grid-cols-2"></div>

          <div id="ace-admin-upload-controls" class="hidden space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
            <div class="flex items-center justify-between text-[11px] font-bold text-emerald-900"><span id="ace-admin-upload-label">Upload progress</span><span id="ace-admin-upload-percent">0%</span></div>
            <div class="ace-upload-track" role="progressbar" aria-label="Audio upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
            <div class="flex flex-wrap gap-2">
              <button id="ace-admin-upload-pause" type="button" class="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-900">Pause</button>
              <button id="ace-admin-upload-resume" type="button" class="hidden rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-900">Resume</button>
              <button id="ace-admin-upload-cancel" type="button" class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold text-red-700">Cancel upload</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              class="rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-extrabold text-white"
            >
              Save item
            </button>
            <button
              id="ace-admin-delete"
              type="button"
              class="hidden rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </section>
  `;

  document.body.append(panel);

  const sectionSelect = panel.querySelector("#ace-admin-section");
  sectionSelect.innerHTML = Object.entries(SECTIONS)
    .map(([id, section]) =>
      `<option value="${safe(id)}">${safe(section.label)}</option>`
    )
    .join("");

  const sectionSearch = panel.querySelector("#ace-admin-section-search");
  const allSectionOptions = [...sectionSelect.options].map(option => ({ value: option.value, text: option.textContent }));
  const sectionCount = panel.querySelector("#ace-admin-section-count");
  const filterSections = () => {
    const query = sectionSearch.value.trim().toLocaleLowerCase();
    const selected = sectionSelect.value;
    const matches = allSectionOptions.filter(option => !query || option.text.toLocaleLowerCase().includes(query));
    sectionSelect.innerHTML = matches.map(option => `<option value="${safe(option.value)}">${safe(option.text)}</option>`).join("");
    if (matches.some(option => option.value === selected)) sectionSelect.value = selected;
    else if (matches.length) { sectionSelect.value = matches[0].value; loadItems(); }
    sectionCount.textContent = `${matches.length} of ${allSectionOptions.length}`;
  };
  sectionSearch.addEventListener("input", filterSections);
  filterSections();

  sectionSelect.addEventListener("change", () => {
    panel.querySelector("#ace-admin-new").classList.toggle("hidden", sectionSelect.value === "meetingAccessRequests");
    loadItems();
  });
  panel.querySelector("#ace-admin-close").onclick = closePanel;
  panel.querySelector("#ace-admin-new").onclick = () => renderForm({});
  panel.querySelector("#ace-admin-form").onsubmit = saveItem;
  panel.querySelector("#ace-admin-delete").onclick = removeItem;
  panel.querySelector("#ace-admin-upload-cancel").onclick = () => { activeUploadTask?.cancel(); };

  panel.addEventListener("click", event => {
    if (event.target === panel) {
      closePanel();
      return;
    }

    if (!event.target.closest("[data-picker-wrap]")) {
      closeAllPickers(panel);
    }
  });
}

async function openPanel() {
  document.getElementById("ace-admin-panel")?.classList.replace("hidden", "flex");
  await loadPickerOptions();
  loadItems();
}

function closePanel() {
  document.getElementById("ace-admin-panel")?.classList.replace("flex", "hidden");
  unsubscribe?.();
  unsubscribe = null;
}

function activeSection() {
  return document.getElementById("ace-admin-section")?.value || "leaders";
}

function sectionCollection(section = activeSection()) {
  if (section === "meetingRoomMembers") return collection(db, "meetingRoomMembers");
  if (section === "meetingAccessRequests") return collection(db, "meetingAccessRequests");
  if (section === "userProfiles") return collection(db, "userProfiles");
  return collection(db, "siteContent", section, "items");
}

async function loadPickerOptions() {
  const campuses = new Set(campusNames);
  const cities = new Set([...ETHIOPIAN_CITIES, ...(Array.isArray(ethiopianInstitutions) ? ethiopianInstitutions.map(institution => String(institution.city || "").trim()) : [])].filter(Boolean));
  const departments = new Set(COMMON_DEPARTMENTS);

  try {
    const [leadersSnapshot, campusesSnapshot] = await Promise.all([
      getDocs(collection(db, "siteContent", "leaders", "items")),
      getDocs(collection(db, "siteContent", "campuses", "items"))
    ]);

    [...leadersSnapshot.docs, ...campusesSnapshot.docs].forEach(item => {
      const record = item.data();

      addIfValue(campuses, record.universityName);
      addIfValue(campuses, record.campus);
      addIfValue(cities, record.city);
      addIfValue(cities, record.region);
      addIfValue(departments, record.coordinatorDepartment);
      addIfValue(departments, record.treasurerDepartment);
      addIfValue(departments, record.secretaryDepartment);

      if (Array.isArray(record.leaders)) {
        record.leaders.forEach(leader => {
          addIfValue(departments, leader?.department);
        });
      }
    });
  } catch (error) {
    console.warn("Could not load saved campus suggestions:", error);
  }

  pickerOptions = {
    campus: [...campuses].sort((a, b) => a.localeCompare(b)),
    city: [...cities].sort((a, b) => a.localeCompare(b)),
    department: [...departments].sort((a, b) => a.localeCompare(b))
  };
}

function addIfValue(set, value) {
  const cleanValue = String(value ?? "").trim();
  if (cleanValue) set.add(cleanValue);
}

function loadItems() {
  unsubscribe?.();
  document.getElementById("ace-admin-new")?.classList.toggle("hidden", ["meetingAccessRequests", "userProfiles"].includes(activeSection()));
  document.getElementById("ace-admin-request-tools")?.classList.toggle("hidden", activeSection() !== "meetingAccessRequests");

  unsubscribe = onSnapshot(
    sectionCollection(),
    snapshot => {
      const list = document.getElementById("ace-admin-list");
      if (!list) return;
      const pendingCount = snapshot.docs.filter(item => item.data().status === "pending").length;
      const pendingBadge = document.getElementById("ace-admin-pending-count");
      if (pendingBadge) pendingBadge.textContent = `${pendingCount} pending`;

      if (snapshot.empty) {
        list.innerHTML = `
          <p class="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            No records yet. Add the first one using the form.
          </p>
        `;
        renderForm({});
        return;
      }

      const orderedDocs = [...snapshot.docs].sort((a, b) => {
        const pendingOrder = Number(b.data().status === "pending") - Number(a.data().status === "pending");
        if (pendingOrder) return pendingOrder;
        const label = item => item.data().universityName || item.data().requesterName || item.data().displayName || item.data().title || item.data().name || item.id;
        return String(label(a)).localeCompare(String(label(b)), undefined, { sensitivity: "base", numeric: true });
      });
      list.innerHTML = orderedDocs.map(item => {
        const data = item.data();
        const title = data.requesterName ? `${data.requesterName} · ${data.programTitle || "Access request"}` : data.displayName || data.universityName || data.title || data.name || data.campus || item.id;
        const visibility = data.status ? `· ${data.status}` : data.published === false ? "Draft" : "Published";
        const rosterSearch = [
          ...(Array.isArray(data.branches) ? data.branches.flatMap(branch => [branch.name, ...(Array.isArray(branch.leaders) ? branch.leaders : []).map(person => person.fullName)]) : []),
          ...(Array.isArray(data.leaders) ? data.leaders.map(person => person.fullName) : [])
        ];
        const searchable = [data.requesterName, data.requesterEmail, data.displayName, data.universityName, data.fellowshipRole, data.programTitle, data.requestedDepartment, data.department, data.profileSex, data.sex, data.departmentGroup, data.status, ...rosterSearch].join(" ").toLocaleLowerCase();

        return `
          <div data-admin-record data-status="${safe(data.status || "")}" data-search="${safe(searchable)}" data-pending="${data.status === "pending"}" class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              data-edit="${safe(item.id)}"
              class="min-w-0 flex-1 truncate text-left text-xs font-bold text-slate-800"
            >
              ${safe(title)}
              <span class="ml-1 text-[10px] font-normal text-slate-400">${visibility}</span>
            </button>
            ${activeSection() === "userProfiles" ? "" : `<button type="button" data-remove="${safe(item.id)}" aria-label="Delete ${safe(title)}" title="Delete this item" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-700 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>`}
          </div>
        `;
      }).join("");

      const applyFilters = () => {
        const q = String(document.getElementById("ace-admin-list-search")?.value || "").trim().toLocaleLowerCase();
        const state = document.getElementById("ace-admin-request-filter")?.value || "pending";
        list.querySelectorAll("[data-admin-record]").forEach(record => {
          const statusMatch = activeSection() !== "meetingAccessRequests" || state === "all" || record.dataset.status === state || (state === "pending" && !["approved", "rejected"].includes(record.dataset.status));
          record.classList.toggle("hidden", !statusMatch || !record.dataset.search.includes(q));
        });
      };
      const recordSearch = document.getElementById("ace-admin-list-search");
      const requestFilter = document.getElementById("ace-admin-request-filter");
      if (recordSearch) recordSearch.oninput = applyFilters;
      if (requestFilter) requestFilter.onchange = applyFilters;
      applyFilters();

      list.querySelectorAll("[data-edit]").forEach(button => {
        button.onclick = async () => {
          const chosen = snapshot.docs.find(
            item => item.id === button.dataset.edit
          );

          if (chosen) {
            let privateMeeting = {};
            if (activeSection() === "meetingPrograms") {
              try {
                const secret = await getDoc(doc(db, "meetingProgramSecrets", chosen.id));
                if (secret.exists()) privateMeeting = secret.data();
              } catch (error) {
                setAdminStatus("Could not load the private meeting details. Check administrator access and try again.", "error");
                return;
              }
            }
            renderForm({ id: chosen.id, ...chosen.data(), ...privateMeeting });
          }
        };
      });
      list.querySelectorAll("[data-remove]").forEach(button => {
        button.onclick = async () => {
          const chosen = snapshot.docs.find(item => item.id === button.dataset.remove);
          if (!chosen) return;
          renderForm({ id: chosen.id, ...chosen.data() });
          await removeItem();
        };
      });
    },
    error => {
      setAdminStatus(error.message, "error");
    }
  );

  renderForm({});
}

function renderForm(record) {
  const container = document.getElementById("ace-admin-fields");
  if (!container) return;

  const section = SECTIONS[activeSection()];
  record = {
    ...record,
    churchPriestName: record.churchPriestName ?? record.churchPriest?.name ?? "",
    churchPriestPhone: record.churchPriestPhone ?? record.churchPriest?.phone ?? "",
    churchPriestPhonePublic: record.churchPriestPhonePublic ?? record.churchPriest?.phonePublic ?? false
  };
  const branchesText = Array.isArray(record.branches)
    ? record.branches.flatMap(branch => (Array.isArray(branch.leaders) ? branch.leaders : []).map(leader => [branch.name, leader.fullName, leader.phone, leader.phonePublic ? "yes" : ""].join(" | ").replace(/\s*\|\s*$/, ""))).join("\n")
    : "";

  container.innerHTML = section.fields.map(([key, label, type]) => {
    if (type === "readOnly") {
      const value = record[key] === true ? "Confirmed" : record[key] === false ? "No" : record[key] || "—";
      return `<div class="text-xs font-semibold text-slate-600"><span>${safe(label)}</span><div class="mt-1 min-h-10 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-normal text-slate-700">${safe(value)}</div><input type="hidden" name="${safe(key)}" value="${safe(record[key] ?? "")}"></div>`;
    }

    if (type === "meetingRequestStatus") {
      const selected = record[key] || "pending";
      return `<label class="text-xs font-semibold text-slate-600">${safe(label)}<select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">${[["pending", "Pending review"], ["approved", "Approve request"], ["rejected", "Reject request"]].map(([value, text]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
    }

    if (type === "meetingSex") {
      const selected = record[key] || "";
      return `<label class="text-xs font-semibold text-slate-600">${safe(label)}<select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="">Not recorded</option><option value="female" ${selected === "female" ? "selected" : ""}>Female</option><option value="male" ${selected === "male" ? "selected" : ""}>Male</option></select><span class="mt-1 block text-[10px] text-slate-500">This roster value is administrator-controlled and checked before Women’s Ministry access.</span></label>`;
    }

    if (type === "campusSchoolId") {
      const selected = record[key] || "";
      return `<label class="text-xs font-semibold text-slate-600">${safe(label)}<select name="${safe(key)}" required class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="">Choose the college</option><option value="medicine-health-sciences" ${selected === "medicine-health-sciences" ? "selected" : ""}>College of Medicine & Health Sciences</option><option value="engineering-technology" ${selected === "engineering-technology" ? "selected" : ""}>College of Engineering & Technology</option><option value="social-sciences" ${selected === "social-sciences" ? "selected" : ""}>College of Social Sciences</option></select><span class="mt-1 block text-[10px] text-slate-500">Publish one approved coordinator record for each college.</span></label>`;
    }

    if (type === "campusDepartmentCounts") {
      const value = record[key] && typeof record[key] === "object" ? JSON.stringify(record[key], null, 2) : String(record[key] || "");
      return `<label class="text-xs font-semibold text-slate-600 sm:col-span-2">${safe(label)}<textarea name="${safe(key)}" rows="5" placeholder='{"department-id": 24}' class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800">${safe(value)}</textarea><span class="mt-1 block text-[10px] font-normal leading-4 text-slate-500">Use department IDs as keys. Example: ${safe(JSON.stringify(Object.fromEntries(seniorDepartments.slice(0, 2).map(item => [item.id, 12]))))}. These published counts update live on the Campus Network.</span></label>`;
    }

    if (type === "checkbox" || type === "checkboxOff") {
      const checked = type === "checkboxOff" ? record[key] === true : record[key] !== false;
      return `
        <label class="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700">
          <input name="${safe(key)}" type="checkbox" ${checked ? "checked" : ""}>
          ${safe(label)}
        </label>
      `;
    }

    if (type === "textarea") {
      return `
        <label class="text-xs font-semibold text-slate-600 sm:col-span-2">
          ${safe(label)}
          <textarea
            name="${safe(key)}"
            rows="3"
            class="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
          >${safe(record[key] || "")}</textarea>
        </label>
      `;
    }

    if (type === "branches") {
      return `
        <label class="text-xs font-semibold text-slate-600 sm:col-span-2 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-amber-50/60 p-4">
          ${safe(label)}
          <textarea name="${safe(key)}" rows="7" placeholder="One person per line: Branch or campus | Full name | Phone | public? yes&#10;Main campus | BROTHER NAME | 09... | yes&#10;Science campus | SISTER NAME | 09... | yes" class="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10">${safe(branchesText)}</textarea>
          <span class="mt-2 block text-[10px] font-normal leading-5 text-slate-500">Choose an existing university above to add these contacts to its current directory listing, or type a new university name. Add any number of leaders; no fixed officer titles are required. Put one person on each line and repeat the campus name for its other leaders. Format: <strong>Campus | Full name | phone | yes</strong>. Enter “yes” only when that person has approved public phone display.</span>
        </label>
      `;
    }

    if (type === "audioType") {
      const selected = record[key] || "preaching";
      return `
        <label class="text-xs font-semibold text-slate-600">
          ${safe(label)}
          <select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <option value="preaching" ${selected === "preaching" ? "selected" : ""}>Preaching</option>
            <option value="solo-song" ${selected === "solo-song" ? "selected" : ""}>Solo song</option>
            <option value="apostolic-song" ${selected === "apostolic-song" ? "selected" : ""}>Apostolic song</option>
            <option value="poem" ${selected === "poem" ? "selected" : ""}>Text poem / spoken word</option>
          </select>
        </label>
      `;
    }

    if (type === "adviceSource") {
      const selected = record[key] || "currentStudent";
      return `
        <label class="text-xs font-semibold text-slate-600">
          ${safe(label)}
          <select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <option value="currentStudent" ${selected === "currentStudent" ? "selected" : ""}>Current student</option>
            <option value="alumnus" ${selected === "alumnus" ? "selected" : ""}>Alumnus / graduate</option>
            <option value="studentFamily" ${selected === "studentFamily" ? "selected" : ""}>Students’ family</option>
            <option value="churchServant" ${selected === "churchServant" ? "selected" : ""}>Church servant</option>
          </select>
        </label>
      `;
    }

    if (type === "churchPosition") {
      const selected = record[key] || "";
      return `
        <label class="text-xs font-semibold text-slate-600">
          ${safe(label)}
          <select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <option value="" ${!selected ? "selected" : ""}>Choose a position or use Other</option>
            <option value="Bishop" ${selected === "Bishop" ? "selected" : ""}>Bishop</option>
            <option value="Priest" ${selected === "Priest" ? "selected" : ""}>Priest</option>
            <option value="Church servant" ${selected === "Church servant" ? "selected" : ""}>Church servant</option>
            <option value="Other church servant" ${selected === "Other church servant" ? "selected" : ""}>Other church servant</option>
          </select>
        </label>
      `;
    }

    if (type === "meetingDepartmentGroup") {
      const options = [["healthSciences", "Medicine & Health Sciences"], ["technology", "Technology & Computing"], ["engineering", "Engineering & Built Environment"], ["naturalSciences", "Natural Sciences"], ["socialSciences", "Social Sciences & Education"], ["business", "Business & Economics"], ["lawGovernance", "Law & Governance"], ["agriculture", "Agriculture & Life Sciences"], ["other", "Other approved group"]];
      const selected = record[key] || "";
      return `<label class="text-xs font-semibold text-slate-600 sm:col-span-1">${safe(label)}<select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="">Choose a study group</option>${options.map(([value, text]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
    }

    if (type === "meetingProgramType" || type === "meetingAudience" || type === "meetingFormat") {
      const options = type === "meetingProgramType"
        ? [["bibleStudy", "Departmental Bible study"], ["conference", "Conference"], ["specialProgram", "Special program"]]
        : type === "meetingAudience"
          ? [["all", "All signed-in members · Main Hall"], ["department", "Exact department members"], ["departmentGroup", "Approved study group"], ["leaders", "Approved leaders only"], ["women", "Approved Women’s Ministry members"]]
          : [["inPerson", "In person"], ["online", "Online"], ["hybrid", "Hybrid"]];
      const selected = record[key] || options[0][0];
      return `
        <label class="text-xs font-semibold text-slate-600 sm:col-span-1">
          ${safe(label)}
          <select name="${safe(key)}" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
            ${options.map(([value, optionLabel]) => `<option value="${safe(value)}" ${selected === value ? "selected" : ""}>${safe(optionLabel)}</option>`).join("")}
          </select>
        </label>
      `;
    }

    if (type === "audioFile") {
      const currentFile = record.src
        ? `<span class="mt-2 block text-[11px] text-teal-800">Current audio: <a class="underline" href="${safe(record.src)}" target="_blank" rel="noopener noreferrer">Open current file</a>. Choose a new file only to replace it.</span>`
        : `<span class="mt-2 block text-[11px] text-slate-500">Select a real audio file. Poems can use the text field without an audio file.</span>`;
      return `
        <label class="text-xs font-semibold text-slate-600 sm:col-span-2">
          ${safe(label)}
          <input name="${safe(key)}" type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.webm" class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
          ${currentFile}
        </label>
      `;
    }

    if (type === "campus" || type === "city" || type === "department") {
      return searchableField(key, label, type, record[key] ?? "");
    }

    return `
      <label class="text-xs font-semibold text-slate-600">
        ${safe(label)}
        <input
          name="${safe(key)}"
          type="${safe(type || "text")}"
          value="${safe(record[key] ?? "")}"
          class="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
        >
      </label>
    `;
  }).join("");

  container.dataset.id = record.id || "";
  container.dataset.label = record.universityName || record.title || record.name || record.campus || record.id || "this item";
  container.dataset.storagePath = record.storagePath || "";
  container.dataset.src = record.src || "";

  setAdminStatus(record.id ? "Editing this record · save to publish your changes." : "New item · add accurate, approved information before publishing.", "info");

  document.getElementById("ace-admin-delete")
    ?.classList.toggle("hidden", !record.id || activeSection() === "userProfiles");

  setupSearchableFields(container);
}

function searchableField(key, label, type, value) {
  const listId = `ace-picker-${safe(key)}`;

  return `
    <label class="text-xs font-semibold text-slate-600">
      ${safe(label)}
      <span class="relative mt-1 block" data-picker-wrap data-picker-type="${safe(type)}">
        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </span>
        <input
          name="${safe(key)}"
          type="text"
          value="${safe(value)}"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls="${listId}"
          placeholder="Search or enter a new value"
          class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        >
        <div
          id="${listId}"
          role="listbox"
          class="absolute left-0 right-0 top-full z-50 mt-1 hidden max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        ></div>
        <span class="mt-1 block text-[10px] font-normal text-slate-400">
          Type to filter suggestions, or enter your own value.
        </span>
      </span>
    </label>
  `;
}

function setupSearchableFields(container) {
  container.querySelectorAll('[role="combobox"]').forEach(input => {
    const wrapper = input.closest("[data-picker-wrap]");
    const list = wrapper?.querySelector('[role="listbox"]');
    if (!wrapper || !list) return;

    input.addEventListener("focus", () => renderPickerOptions(input, list));
    input.addEventListener("input", () => renderPickerOptions(input, list));

    input.addEventListener("keydown", event => {
      const options = [...list.querySelectorAll("[data-picker-value]")];

      if (event.key === "Escape") {
        closePicker(input, list);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (!options.length) return;
        event.preventDefault();

        let index = Number(input.dataset.activeOption ?? -1);
        index += event.key === "ArrowDown" ? 1 : -1;

        if (index >= options.length) index = 0;
        if (index < 0) index = options.length - 1;

        input.dataset.activeOption = String(index);
        options.forEach((option, optionIndex) => {
          const active = optionIndex === index;
          option.setAttribute("aria-selected", String(active));
          option.classList.toggle("bg-teal-50", active);
        });
        return;
      }

      if (event.key === "Enter" && !list.classList.contains("hidden")) {
        const index = Number(input.dataset.activeOption ?? -1);
        const option = options[index];

        if (option) {
          event.preventDefault();
          choosePickerOption(input, list, option.dataset.pickerValue);
        }
      }
    });

    list.addEventListener("mousedown", event => {
      if (event.target.closest("[data-picker-value]")) {
        event.preventDefault();
      }
    });

    list.addEventListener("click", event => {
      const option = event.target.closest("[data-picker-value]");
      if (option) {
        choosePickerOption(input, list, option.dataset.pickerValue);
      }
    });
  });
}

function renderPickerOptions(input, list) {
  const type = input.closest("[data-picker-wrap]")?.dataset.pickerType;
  const source = pickerOptions[type] || [];
  const query = input.value.trim().toLocaleLowerCase();

  const matches = source
    .filter(value => !query || value.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (!query) return a.localeCompare(b);
      const aStarts = a.toLocaleLowerCase().startsWith(query);
      const bStarts = b.toLocaleLowerCase().startsWith(query);
      return Number(bStarts) - Number(aStarts) || a.localeCompare(b);
    });

  const exactMatch = source.some(
    value => value.toLocaleLowerCase() === query
  );

  const suggestionButtons = matches.map(value => `
    <button
      type="button"
      role="option"
      aria-selected="false"
      data-picker-value="${safe(value)}"
      class="block w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900"
    >
      ${safe(value)}
    </button>
  `).join("");

  const customButton = query && !exactMatch
    ? `
      <button
        type="button"
        role="option"
        aria-selected="false"
        data-picker-value="${safe(input.value.trim())}"
        class="block w-full rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-xs font-semibold text-teal-800 hover:bg-teal-50"
      >
        Use “${safe(input.value.trim())}”
      </button>
    `
    : "";

  list.innerHTML = suggestionButtons || customButton
    ? `${suggestionButtons}${customButton}`
    : `
      <p class="px-3 py-3 text-xs font-normal text-slate-500">
        No matching suggestions. Keep typing to enter a new value.
      </p>
    `;

  input.dataset.activeOption = "-1";
  input.setAttribute("aria-expanded", "true");
  list.classList.remove("hidden");
}

function choosePickerOption(input, list, value) {
  input.value = value;
  closePicker(input, list);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function closePicker(input, list) {
  input.setAttribute("aria-expanded", "false");
  input.dataset.activeOption = "-1";
  list.classList.add("hidden");
}

function closeAllPickers(panel) {
  panel.querySelectorAll('[role="combobox"]').forEach(input => {
    const list = input.closest("[data-picker-wrap]")?.querySelector('[role="listbox"]');
    if (list) closePicker(input, list);
  });
}

async function saveItem(event) {
  event.preventDefault();

  if (!(await isCurrentUserAdmin())) {
    setAdminStatus("Administrator permission is required to save changes.", "error");
    return;
  }

  setAdminStatus("Saving your changes securely…", "progress");

  const section = activeSection();
  const fields = event.currentTarget.querySelectorAll("[name]");
  const data = { published: true };

  fields.forEach(field => {
    if (field.type === "file") return;
    data[field.name] =
      field.type === "checkbox"
        ? field.checked
        : field.type === "number"
          ? (field.value === "" ? null : Number(field.value))
          : field.value.trim();
  });

  if (section === "leaders") {
    data.branches = parseBranchLeaders(data.branchesText || "");
    delete data.branchesText;
    data.churchPriest = {
      name: data.churchPriestName || "",
      phone: data.churchPriestPhone || "",
      phonePublic: Boolean(data.churchPriestPhonePublic)
    };
    delete data.churchPriestName;
    delete data.churchPriestPhone;
    delete data.churchPriestPhonePublic;
  }

  if (!["meetingRoomMembers", "userProfiles"].includes(section)) data.active = true;
  data.updatedAt = serverTimestamp();

  const fieldsContainer = document.getElementById("ace-admin-fields");
  const id = fieldsContainer.dataset.id || (["meetingRoomMembers", "userProfiles"].includes(section) ? String(data.uid || "").trim() : `${Date.now()}`);
  let newStoragePath = "";

  if (section === "meetingRoomMembers") {
    if (!data.uid || data.uid.includes("/") || data.uid.trim() !== data.uid) {
      setAdminStatus("Enter the member’s exact Firebase Authentication UID; it cannot contain a slash.", "error");
      return;
    }
    if (!data.name?.trim()) {
      setAdminStatus("Add the member or leader’s name so this access record is identifiable.", "error");
      return;
    }
    if (data.active && !data.department?.trim() && !data.departmentGroup && !data.leadersOnly && !data.womenMinistry) {
      setAdminStatus("Add a verified department or study group, or grant a specific restricted-room role before approving this member.", "error");
      return;
    }
    if (data.womenMinistry && data.sex !== "female") {
      setAdminStatus("Women’s Ministry access requires the administrator-verified sex field to be Female.", "error");
      return;
    }
    if (fieldsContainer.dataset.id && fieldsContainer.dataset.id !== data.uid) {
      setAdminStatus("The UID is the access record key. Delete this record and add a new one to change the UID.", "error");
      return;
    }
  }

  if (section === "meetingAccessRequests") {
    if (!id || !["pending", "approved", "rejected"].includes(data.status)) {
      setAdminStatus("Open an applicant’s request and choose an approval decision.", "error");
      return;
    }
    if (!data.uid || !data.programId || !["department", "departmentGroup", "leaders", "women"].includes(data.audience)) {
      setAdminStatus("This request is missing its room details and cannot be processed.", "error");
      return;
    }
    data.adminNote = String(data.adminNote || "").trim().slice(0, 500);
  }

  if (section === "userProfiles") {
    if (!id || id.includes("/") || data.uid !== id || !data.displayName?.trim() || !data.department?.trim() || !["female", "male"].includes(data.sex)) {
      setAdminStatus("Member eligibility needs a valid UID, name, department, and recorded sex before you save the correction.", "error");
      return;
    }
  }

  if (section === "campusSchoolCoordinators") {
    const validSchoolIds = ["medicine-health-sciences", "engineering-technology", "social-sciences"];
    if (!validSchoolIds.includes(data.schoolId) || !data.schoolName?.trim() || !data.coordinatorName?.trim()) {
      setAdminStatus("Choose a valid college and enter its college name and approved coordinator before saving.", "error");
      return;
    }
    data.schoolId = String(data.schoolId).trim();
    data.schoolName = String(data.schoolName).trim();
    data.coordinatorName = String(data.coordinatorName).trim();
    try {
      data.departmentCounts = data.departmentCounts ? JSON.parse(data.departmentCounts) : {};
      const schoolGroups = {
        "medicine-health-sciences": ["Health Sciences"],
        "engineering-technology": ["Engineering & Tech"],
        "social-sciences": ["Business & Economics", "Law & Humanities"]
      }[data.schoolId];
      const allowedDepartmentIds = new Set(seniorDepartments.filter(department => schoolGroups.includes(department.group)).map(department => department.id));
      if (!data.departmentCounts || typeof data.departmentCounts !== "object" || Array.isArray(data.departmentCounts)
        || Object.entries(data.departmentCounts).some(([departmentId, count]) => !allowedDepartmentIds.has(departmentId) || !Number.isInteger(Number(count)) || Number(count) < 0)) {
        throw new Error("Use only department IDs belonging to the selected college and nonnegative whole-number counts.");
      }
    } catch (error) {
      setAdminStatus(`Department counts must be valid JSON, for example {"med": 24}. ${error.message}`, "error");
      return;
    }
    data.telegram = String(data.telegram || "").replace(/^@/, "").trim();
    if (data.telegram && !/^[A-Za-z0-9_]{5,32}$/.test(data.telegram)) {
      setAdminStatus("Enter a valid Telegram username without the @ symbol.", "error");
      return;
    }
  }

  if (section === "meetingPrograms") {
    if (!data.title?.trim() || !data.eventDate || !["bibleStudy", "conference", "specialProgram"].includes(data.programType)) {
      setAdminStatus("Add the program title, date, and type before saving.", "error");
      return;
    }
    if (!["all", "department", "departmentGroup", "leaders", "women"].includes(data.audience)) {
      setAdminStatus("Choose a valid participation group.", "error");
      return;
    }
    if (data.audience === "department" && !data.department?.trim()) {
      setAdminStatus("Department-only programs require the department name so access can be checked.", "error");
      return;
    }
    if (data.audience === "departmentGroup" && !data.departmentGroup) {
      setAdminStatus("Choose the approved study group for this departmental gathering.", "error");
      return;
    }
    if (data.meetingUrl && !/^https:\/\//i.test(data.meetingUrl)) {
      setAdminStatus("Meeting links must begin with https:// for secure access.", "error");
      return;
    }
    if (data.liveAudioRoom && !["online", "hybrid"].includes(data.format)) {
      setAdminStatus("Choose Online or Hybrid before enabling the live audio room.", "error");
      return;
    }
    if (data.liveAudioRoom && !data.hostUid?.trim()) {
      setAdminStatus("Enter the designated live audio leader’s Firebase Authentication UID. The leader must also have an active Meeting Room membership record.", "error");
      return;
    }
    data.hostUid = String(data.hostUid || "").trim();
    if (data.audience !== "department") {
      data.department = "";
      data.university = "";
    }
    if (data.audience !== "departmentGroup") data.departmentGroup = "";
  }

  if (section === "audioLibrary") {
    const audioFile = event.currentTarget.querySelector('[name="mediaFile"]')?.files?.[0] || null;
    const priorSrc = fieldsContainer.dataset.src || "";
    const priorStoragePath = fieldsContainer.dataset.storagePath || "";

    if (!data.title?.trim()) {
      setAdminStatus("Enter a title for this resource.", "error");
      return;
    }
    if (data.type === "preaching" && !data.creator?.trim()) {
      setAdminStatus("Enter the preacher's name so listeners can find their teaching room.", "error");
      return;
    }
    if (data.type === "poem" && !data.text?.trim()) {
      setAdminStatus("Paste the approved poem text before saving.", "error");
      return;
    }
    if (data.type !== "poem" && !audioFile && !priorSrc) {
      setAdminStatus("Choose an audio file before publishing this song or preaching.", "error");
      return;
    }
    if (audioFile && (!isSupportedAudioFile(audioFile) || audioFile.size > 1024 * 1024 * 1024)) {
      setAdminStatus("Choose an audio file no larger than 1 GB (MP3, M4A, WAV, OGG, AAC, or WebM).", "error");
      return;
    }

    data.src = data.type === "poem" ? "" : priorSrc;
    data.storagePath = data.type === "poem" ? "" : priorStoragePath;
    if (audioFile) {
      const safeName = audioFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      newStoragePath = `siteAssets/audioLibrary/${id}/${Date.now()}-${safeName}`;
      try {
        data.src = await uploadAudioFile(audioFile, newStoragePath);
        data.storagePath = newStoragePath;
      } catch (error) {
        setAdminStatus(error?.message || "Audio upload failed.", "error");
        return;
      }
    }
  }

  if (section === "studentAdvice") {
    if (!data.title?.trim() || !data.advice?.trim() || !data.author?.trim() || !data.language?.trim()) {
      setAdminStatus("Add the title, contributor name, language, and advice message before saving.", "error");
      return;
    }
    if (!["currentStudent", "alumnus", "studentFamily", "churchServant"].includes(data.sourceType)) {
      setAdminStatus("Choose one of the four Advice Room voices.", "error");
      return;
    }
    if (["currentStudent", "alumnus"].includes(data.sourceType) && (!data.university?.trim() || !data.department?.trim())) {
      setAdminStatus("Add the university and department for current students and graduates.", "error");
      return;
    }
    if (data.sourceType === "churchServant" && !data.churchPosition) {
      setAdminStatus("Choose the church servant’s position before saving.", "error");
      return;
    }
    if (data.sourceType !== "churchServant") data.churchPosition = "";
    if (!["currentStudent", "alumnus"].includes(data.sourceType)) {
      data.university = "";
      data.department = "";
    }
  }

  let meetingSecret = null;
  if (section === "meetingPrograms") {
    meetingSecret = {
      meetingUrl: data.meetingUrl || "",
      accessNotes: data.accessNotes || "",
      hostUid: data.hostUid || "",
      updatedAt: serverTimestamp()
    };
    delete data.meetingUrl;
    delete data.accessNotes;
    delete data.hostUid;
  }

  try {
    if (section === "meetingPrograms") {
      const batch = writeBatch(db);
      batch.set(doc(sectionCollection(), id), data, { merge: true });
      batch.set(doc(db, "meetingProgramSecrets", id), meetingSecret, { merge: true });
      await batch.commit();
    } else if (section === "meetingAccessRequests") {
      const requestRef = doc(db, "meetingAccessRequests", id);
      const snapshot = await getDoc(requestRef);
      if (!snapshot.exists()) throw new Error("This access request no longer exists.");
      const request = snapshot.data();
      const batch = writeBatch(db);
      if (data.status === "approved") {
        const profileSnapshot = await getDoc(doc(db, "userProfiles", request.uid));
        if (!profileSnapshot.exists()) throw new Error("The applicant profile is missing. Do not approve until the account is reviewed.");
        const applicantProfile = profileSnapshot.data();
        if (request.requestedDepartment !== applicantProfile.department || request.profileSex !== applicantProfile.sex) {
          throw new Error("The request no longer matches the applicant’s recorded profile. Review the profile before approval.");
        }
        if (request.audience === "department" && request.requestedDepartment !== applicantProfile.department) {
          throw new Error("Departmental Bible study access must match the department recorded on the applicant profile.");
        }
        if (request.audience === "women" && applicantProfile.sex !== "female") {
          throw new Error("Women’s Ministry requests can only be approved for accounts recorded as female.");
        }
        const memberUpdate = {
          uid: request.uid,
          name: request.requesterName || "ACE-USF member",
          department: applicantProfile.department || "",
          sex: applicantProfile.sex || "",
          active: true,
          updatedAt: serverTimestamp()
        };
        if (request.audience === "departmentGroup") memberUpdate.departmentGroup = request.departmentGroup || "";
        if (request.audience === "leaders") memberUpdate.leadersOnly = true;
        if (request.audience === "women") { memberUpdate.sex = "female"; memberUpdate.womenMinistry = true; }
        batch.set(doc(db, "meetingRoomMembers", request.uid), memberUpdate, { merge: true });
      }
      batch.set(requestRef, {
        status: data.status,
        adminNote: data.adminNote || "",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      await batch.commit();
    } else if (section === "userProfiles") {
      if (!fieldsContainer.dataset.id) throw new Error("Open an existing member profile to correct it; profiles cannot be created here.");
      await updateDoc(doc(db, "userProfiles", id), {
        displayName: String(data.displayName).trim(),
        campus: String(data.campus || "").trim(),
        department: String(data.department).trim(),
        sex: data.sex,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(doc(sectionCollection(), id), data, { merge: true });
    }
    const oldStoragePath = fieldsContainer.dataset.storagePath || "";
    if (section === "audioLibrary" && oldStoragePath && oldStoragePath !== data.storagePath) {
      try {
        await deleteObject(ref(storage, oldStoragePath));
      } catch (cleanupError) {
        console.warn("Saved the updated Audio Room record, but could not remove its old file:", cleanupError);
      }
    }
    await loadPickerOptions();
    renderForm({});
    setAdminStatus(section === "audioLibrary" ? "Saved and published · your Audio Room is updating now." : section === "studentAdvice" ? "Advice saved · the Advice Room is updating now." : section === "meetingPrograms" ? "Program saved · public details and protected meeting access are updated." : section === "meetingRoomMembers" ? "Meeting membership access saved securely." : section === "meetingAccessRequests" ? `Request ${data.status} · membership access updated securely.` : section === "leaders" ? "Campus contacts saved · the Fellowship Leaders directory is updating live." : "Saved successfully · your website content is updated.", "success");
  } catch (error) {
    if (newStoragePath) {
      try { await deleteObject(ref(storage, newStoragePath)); } catch { /* No cleanup needed if upload did not finish. */ }
    }
    setAdminStatus(error?.message || "Could not save this item.", "error");
  }
}

function parseBranchLeaders(value) {
  const grouped = new Map();
  String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
    const [branchName = "", fullName = "", phone = "", publicApproval = ""] = line.split("|").map(part => part.trim());
    if (!branchName || !fullName) return;
    if (!grouped.has(branchName)) grouped.set(branchName, { name: branchName, leaders: [] });
    const phonePublic = /^(yes|true|public)$/i.test(publicApproval);
    grouped.get(branchName).leaders.push({ fullName, phone: phonePublic ? phone : "", phonePublic });
  });
  return [...grouped.values()];
}

function isSupportedAudioFile(file) {
  const supportedExtensions = /\.(mp3|m4a|wav|ogg|aac|webm)$/i;
  return String(file?.type || "").startsWith("audio/") || supportedExtensions.test(file?.name || "");
}

function uploadAudioFile(file, path) {
  const controls = document.getElementById("ace-admin-upload-controls");
  const track = controls?.querySelector('[role="progressbar"]');
  const fill = controls?.querySelector(".ace-upload-track > span");
  const pauseButton = document.getElementById("ace-admin-upload-pause");
  const resumeButton = document.getElementById("ace-admin-upload-resume");
  const label = document.getElementById("ace-admin-upload-label");
  const percentLabel = document.getElementById("ace-admin-upload-percent");
  controls?.classList.remove("hidden");
  if (label) label.textContent = `Uploading ${file.name}`;
  if (fill) fill.style.width = "0%";
  if (track) track.setAttribute("aria-valuenow", "0");
  if (pauseButton) pauseButton.classList.remove("hidden");
  if (resumeButton) resumeButton.classList.add("hidden");
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type || "audio/mpeg"
    });
    activeUploadTask = task;
    const pauseClick = () => { task.pause(); pauseButton?.classList.add("hidden"); resumeButton?.classList.remove("hidden"); };
    const resumeClick = () => { task.resume(); resumeButton?.classList.add("hidden"); pauseButton?.classList.remove("hidden"); };
    pauseButton?.addEventListener("click", pauseClick);
    resumeButton?.addEventListener("click", resumeClick);
    const cleanup = () => {
      pauseButton?.removeEventListener("click", pauseClick);
      resumeButton?.removeEventListener("click", resumeClick);
      activeUploadTask = null;
      controls?.classList.add("hidden");
    };
    task.on("state_changed", snapshot => {
      const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      if (fill) fill.style.width = `${percent}%`;
      if (track) track.setAttribute("aria-valuenow", String(percent));
      if (percentLabel) percentLabel.textContent = `${percent}%`;
      setAdminStatus(`Uploading audio · ${percent}% complete.`, "progress");
    }, error => {
      cleanup();
      if (error?.code === "storage/canceled") setAdminStatus("Upload canceled. No resource was published.", "info");
      reject(error);
    }, async () => {
      try {
        const url = await getDownloadURL(task.snapshot.ref);
        cleanup();
        resolve(url);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  });
}

async function removeItem() {
  const fieldsContainer = document.getElementById("ace-admin-fields");
  const id = fieldsContainer?.dataset.id;

  if (!id || !(await isCurrentUserAdmin())) return;
  const itemLabel = fieldsContainer.dataset.label || "this item";
  const removesAudio = activeSection() === "audioLibrary" && fieldsContainer.dataset.storagePath;
  const confirmed = await showAdminConfirm(
    `Remove ${itemLabel}?`,
    `This will remove this item from the public website${removesAudio ? " and permanently delete its audio file" : ""}. This action cannot be undone.`,
    removesAudio ? "Delete item and audio" : "Delete this item"
  );
  if (!confirmed) return;

  try {
    setAdminStatus(`Removing “${itemLabel}”…`, "progress");
    const storagePath = fieldsContainer.dataset.storagePath || "";
    let fileRemoved = !storagePath;
    if (activeSection() === "audioLibrary" && storagePath) {
      try {
        await deleteObject(ref(storage, storagePath));
        fileRemoved = true;
      } catch (storageError) {
        console.warn("Could not remove the stored audio file:", storageError);
      }
    }
    if (activeSection() === "meetingPrograms") {
      const batch = writeBatch(db);
      batch.delete(doc(sectionCollection(), id));
      batch.delete(doc(db, "meetingProgramSecrets", id));
      await batch.commit();
    } else {
      await deleteDoc(doc(sectionCollection(), id));
    }
    renderForm({});
    const removalMessage = activeSection() === "audioLibrary"
      ? fileRemoved ? "Removed successfully · the resource and its audio file are deleted." : "Resource removed, but its audio file remains in Storage. Check Firebase Storage permissions."
      : "Removed successfully · the record is deleted.";
    setAdminStatus(removalMessage, fileRemoved || activeSection() !== "audioLibrary" ? "success" : "error");
  } catch (error) {
    setAdminStatus(error?.message || "Could not delete this item.", "error");
  }
}

function setAdminStatus(message, state = "info") {
  const status = document.getElementById("ace-admin-status");
  if (status) {
    status.dataset.state = state;
    status.textContent = message;
  }

  const toast = document.getElementById("ace-admin-toast");
  const toastMessage = document.getElementById("ace-admin-toast-message");
  const toastIcon = document.getElementById("ace-admin-toast-icon");
  if (!toast || !toastMessage || !["success", "error"].includes(state)) return;
  window.clearTimeout(adminToastTimer);
  toast.dataset.state = state;
  toastMessage.textContent = message;
  toastIcon.innerHTML = state === "success"
    ? '<i class="fa-solid fa-check"></i>'
    : '<i class="fa-solid fa-triangle-exclamation"></i>';
  toastIcon.className = state === "success"
    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700"
    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg text-rose-700";
  toast.classList.add("ace-toast-visible");
  adminToastTimer = window.setTimeout(() => toast.classList.remove("ace-toast-visible"), 5200);
}

function showAdminConfirm(title, message, confirmLabel) {
  const panel = document.getElementById("ace-admin-panel");
  if (!panel) return Promise.resolve(false);

  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm";
    overlay.innerHTML = `
      <section role="alertdialog" aria-modal="true" aria-labelledby="ace-admin-confirm-title" aria-describedby="ace-admin-confirm-message" class="ace-confirm-card w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
        <div class="bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 sm:p-7">
          <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl text-rose-700"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></span>
          <p class="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-rose-700">Please confirm</p>
          <h3 id="ace-admin-confirm-title" class="mt-2 text-xl font-black text-slate-950">${safe(title)}</h3>
          <p id="ace-admin-confirm-message" class="mt-2 text-sm leading-6 text-slate-600">${safe(message)}</p>
          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" data-confirm-cancel class="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200">Keep item</button>
            <button type="button" data-confirm-delete class="min-h-11 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-900/15 transition hover:from-rose-800 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-rose-200">${safe(confirmLabel)}</button>
          </div>
        </div>
      </section>`;
    panel.append(overlay);
    const cancelButton = overlay.querySelector("[data-confirm-cancel]");
    const deleteButton = overlay.querySelector("[data-confirm-delete]");
    let finished = false;
    const finish = result => {
      if (finished) return;
      finished = true;
      document.removeEventListener("keydown", handleKeydown, true);
      overlay.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
      resolve(result);
    };
    const handleKeydown = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      } else if (event.key === "Tab") {
        const buttons = [cancelButton, deleteButton];
        if (event.shiftKey && document.activeElement === cancelButton) {
          event.preventDefault();
          deleteButton.focus();
        } else if (!event.shiftKey && document.activeElement === deleteButton) {
          event.preventDefault();
          cancelButton.focus();
        }
      }
    };
    cancelButton.addEventListener("click", () => finish(false));
    deleteButton.addEventListener("click", () => finish(true));
    overlay.addEventListener("click", event => { if (event.target === overlay) finish(false); });
    document.addEventListener("keydown", handleKeydown, true);
    cancelButton.focus();
  });
}
