// ACE-USF owner/admin content workspace.
// Firestore Rules enforce who can make changes.

import { db } from "./firebase_config.js";
import { isCurrentUserAdmin } from "./firebase_auth_service.js";
import { ethiopianInstitutions } from "./institutions.js";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const SECTIONS = {
  leaders: {
    label: "Fellowship leaders",
    fields: [
      ["universityName", "University / college", "campus"],
      ["city", "City"],
      ["activeMembers", "Active members", "number"],
      ["latitude", "Latitude", "number"],
      ["longitude", "Longitude", "number"],
      ["description", "Campus fellowship description", "textarea"],
      ["coordinatorName", "Coordinator አስተባባሪ name"],
      ["coordinatorDepartment", "Coordinator department", "department"],
      ["coordinatorTelegram", "Coordinator Telegram"],
      ["treasurerName", "Treasurer ገንዘብ ያዥ name"],
      ["treasurerDepartment", "Treasurer department", "department"],
      ["treasurerTelegram", "Treasurer Telegram"],
      ["secretaryName", "Secretary ጸሐፊ name"],
      ["secretaryDepartment", "Secretary department", "department"],
      ["secretaryTelegram", "Secretary Telegram"],
      ["electedYear", "Election year", "number"],
      ["termStartYear", "Term start year", "number"],
      ["termEndYear", "Term end year", "number"]
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

  campuses: {
    label: "Campus network",
    fields: [
      ["universityName", "University / college", "campus"],
      ["region", "Region"],
      ["city", "City"],
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
      ["city", "City / region"],
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

let pickerOptions = {
  campus: [...new Set(campusNames)].sort((a, b) => a.localeCompare(b)),
  department: [...COMMON_DEPARTMENTS].sort((a, b) => a.localeCompare(b))
};

let unsubscribe = null;

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
          <label class="block text-xs font-bold text-slate-600">
            Choose a section
            <select
              id="ace-admin-section"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            ></select>
          </label>
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

          <p id="ace-admin-status" role="status" class="text-xs text-slate-500">
            Choose a section to begin.
          </p>

          <div id="ace-admin-fields" class="grid gap-3 sm:grid-cols-2"></div>

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

  sectionSelect.addEventListener("change", loadItems);
  panel.querySelector("#ace-admin-close").onclick = closePanel;
  panel.querySelector("#ace-admin-new").onclick = () => renderForm({});
  panel.querySelector("#ace-admin-form").onsubmit = saveItem;
  panel.querySelector("#ace-admin-delete").onclick = removeItem;

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
  return collection(db, "siteContent", section, "items");
}

async function loadPickerOptions() {
  const campuses = new Set(campusNames);
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
    department: [...departments].sort((a, b) => a.localeCompare(b))
  };
}

function addIfValue(set, value) {
  const cleanValue = String(value ?? "").trim();
  if (cleanValue) set.add(cleanValue);
}

function loadItems() {
  unsubscribe?.();

  unsubscribe = onSnapshot(
    sectionCollection(),
    snapshot => {
      const list = document.getElementById("ace-admin-list");
      if (!list) return;

      if (snapshot.empty) {
        list.innerHTML = `
          <p class="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            No records yet. Add the first one using the form.
          </p>
        `;
        renderForm({});
        return;
      }

      list.innerHTML = snapshot.docs.map(item => {
        const data = item.data();
        const title =
          data.universityName || data.title || data.campus || item.id;
        const visibility = data.published === false ? "Draft" : "Published";

        return `
          <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              data-edit="${safe(item.id)}"
              class="min-w-0 flex-1 truncate text-left text-xs font-bold text-slate-800"
            >
              ${safe(title)}
              <span class="ml-1 text-[10px] font-normal text-slate-400">${visibility}</span>
            </button>
          </div>
        `;
      }).join("");

      list.querySelectorAll("[data-edit]").forEach(button => {
        button.onclick = () => {
          const chosen = snapshot.docs.find(
            item => item.id === button.dataset.edit
          );

          if (chosen) {
            renderForm({ id: chosen.id, ...chosen.data() });
          }
        };
      });
    },
    error => {
      const status = document.getElementById("ace-admin-status");
      if (status) status.textContent = error.message;
    }
  );

  renderForm({});
}

function renderForm(record) {
  const container = document.getElementById("ace-admin-fields");
  if (!container) return;

  const section = SECTIONS[activeSection()];

  container.innerHTML = section.fields.map(([key, label, type]) => {
    if (type === "checkbox") {
      return `
        <label class="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700">
          <input name="${safe(key)}" type="checkbox" ${record[key] !== false ? "checked" : ""}>
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

    if (type === "campus" || type === "department") {
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

  const status = document.getElementById("ace-admin-status");
  if (status) {
    status.textContent = record.id
      ? "Editing this record. Save to publish your changes."
      : "New record. Add accurate, approved information before publishing.";
  }

  document.getElementById("ace-admin-delete")
    ?.classList.toggle("hidden", !record.id);

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
    .slice(0, 10);

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
    alert("Administrator permission is required.");
    return;
  }

  const section = activeSection();
  const fields = event.currentTarget.querySelectorAll("[name]");
  const data = { published: true };

  fields.forEach(field => {
    data[field.name] =
      field.type === "checkbox"
        ? field.checked
        : field.type === "number"
          ? (field.value === "" ? null : Number(field.value))
          : field.value.trim();
  });

  if (section === "leaders") {
    data.leaders = [
      {
        role: "Astebabari",
        fullName: data.coordinatorName || "",
        department: data.coordinatorDepartment || "",
        telegram: data.coordinatorTelegram || "",
        telegramPublic: Boolean(data.coordinatorTelegram),
        electedYear: data.electedYear,
        termStartYear: data.termStartYear,
        termEndYear: data.termEndYear
      },
      {
        role: "Genzeb Yazh",
        fullName: data.treasurerName || "",
        department: data.treasurerDepartment || "",
        telegram: data.treasurerTelegram || "",
        telegramPublic: Boolean(data.treasurerTelegram),
        electedYear: data.electedYear,
        termStartYear: data.termStartYear,
        termEndYear: data.termEndYear
      },
      {
        role: "Tsehafi",
        fullName: data.secretaryName || "",
        department: data.secretaryDepartment || "",
        telegram: data.secretaryTelegram || "",
        telegramPublic: Boolean(data.secretaryTelegram),
        electedYear: data.electedYear,
        termStartYear: data.termStartYear,
        termEndYear: data.termEndYear
      }
    ].filter(leader => leader.fullName);
  }

  data.active = true;
  data.updatedAt = serverTimestamp();

  const fieldsContainer = document.getElementById("ace-admin-fields");
  const id = fieldsContainer.dataset.id || `${Date.now()}`;

  try {
    await setDoc(doc(sectionCollection(), id), data, { merge: true });
    await loadPickerOptions();
    renderForm({});
    document.getElementById("ace-admin-status").textContent = "Saved.";
  } catch (error) {
    document.getElementById("ace-admin-status").textContent =
      error?.message || "Could not save this item.";
  }
}

async function removeItem() {
  const fieldsContainer = document.getElementById("ace-admin-fields");
  const id = fieldsContainer?.dataset.id;

  if (!id || !(await isCurrentUserAdmin())) return;
  if (!confirm("Delete this published record?")) return;

  try {
    await deleteDoc(doc(sectionCollection(), id));
    renderForm({});
  } catch (error) {
    document.getElementById("ace-admin-status").textContent =
      error?.message || "Could not delete this item.";
  }
}