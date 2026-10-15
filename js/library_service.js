// js/library_service.js
// ACE-USF Apostolic Library — Spiritual Room + Academic Room

import {
  spiritualCategories,
  freshmanStreams,
  seniorDepartments
} from "./academic_data.js";

// ------------------------------------------------------
// 1. Shared helpers
// ------------------------------------------------------

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalizeSearch(value = "") {
  return String(value).trim().toLowerCase();
}

function getSafeResourceUrl(value = "") {
  if (!value || !String(value).trim() || String(value).trim() === "#") return "";
  try {
    const url = new URL(String(value).trim(), window.location.href);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function setVisible(element, visible) {
  if (!element) return;
  element.classList.toggle("hidden", !visible);
}

// ------------------------------------------------------
// 2. Spiritual Room renderer
// ------------------------------------------------------

export function renderSpiritualRoom(
  container,
  activeSubCategoryId = "all",
  searchQuery = ""
) {
  if (!container) return;

  const query = normalizeSearch(searchQuery);

  const filteredCategories = spiritualCategories
    .map(category => {
      const matchingPdfs = (category.pdfs || []).filter(pdf => {
        if (!getSafeResourceUrl(pdf.fileUrl)) return false;
        const searchableText = normalizeSearch(
          `${pdf.title || ""} ${pdf.author || ""}`
        );

        return !query || searchableText.includes(query);
      });

      return {
        ...category,
        matchingPdfs,
        matchesCategory:
          activeSubCategoryId === "all" ||
          category.id === activeSubCategoryId
      };
    })
    .filter(category =>
      category.matchesCategory &&
      (!query || category.matchingPdfs.length > 0)
    );

  let html = `
    <div class="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
      <button
        type="button"
        class="sp-cat-pill rounded-full border px-3 py-1.5 text-xs font-bold transition ${
          activeSubCategoryId === "all"
            ? "bg-teal-800 text-white border-teal-800"
            : "bg-white text-slate-700 border-gray-200 hover:border-teal-500"
        }"
        data-cat="all"
        aria-pressed="${activeSubCategoryId === "all"}"
      >
        All Topics
      </button>
  `;

  spiritualCategories.forEach(category => {
    const active = activeSubCategoryId === category.id;

    html += `
      <button
        type="button"
        class="sp-cat-pill rounded-full border px-3 py-1.5 text-xs font-bold transition ${
          active
            ? "bg-teal-800 text-white border-teal-800"
            : "bg-white text-slate-700 border-gray-200 hover:border-teal-500"
        }"
        data-cat="${escapeHTML(category.id)}"
        aria-pressed="${active}"
      >
        ${escapeHTML(category.name)}
      </button>
    `;
  });

  html += `</div><div class="grid grid-cols-1 gap-4 pt-3">`;

  if (filteredCategories.length === 0) {
    html += `
      <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <i class="fa-solid fa-magnifying-glass text-2xl text-gray-400"></i>
        <p class="mt-2 text-sm font-bold text-slate-700">No matching materials found</p>
        <p class="mt-1 text-xs text-gray-500">
          Try another search word or choose a different topic.
        </p>
      </div>
    `;

    container.innerHTML = html + `</div>`;
    return;
  }

  filteredCategories.forEach(category => {
    html += `
      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            escapeHTML(category.badgeColor || "bg-teal-50 text-teal-800")
          }">
            <i class="fa-solid ${escapeHTML(category.icon || "fa-book")}"></i>
          </div>

          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-extrabold text-slate-900">
              ${escapeHTML(category.name)}
            </h4>
            <p class="mt-1 text-xs leading-relaxed text-gray-600">
              ${escapeHTML(category.description || "")}
            </p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
    `;

    if (category.matchingPdfs.length === 0) {
      html += `
        <p class="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          No verified, accessible resources have been added to this topic yet.
        </p>
      `;
    }

    category.matchingPdfs.forEach(pdf => {
      const realUrl = getSafeResourceUrl(pdf.fileUrl);

      html += `
        <article class="library-resource-card rounded-xl border border-gray-100 bg-slate-50 p-4">
          <div class="flex items-start gap-2">
            <i class="fa-solid fa-file-pdf mt-1 text-lg text-rose-600"></i>

            <div class="min-w-0 flex-1">
              <h5 class="text-xs font-bold leading-relaxed text-slate-800">
                ${escapeHTML(pdf.title)}
              </h5>

              <p class="mt-1 text-[11px] text-gray-500">
                ${escapeHTML(pdf.author || "Author not specified")}
              </p>

              <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
                ${pdf.size ? `<span><i class="fa-solid fa-hard-drive mr-1"></i>${escapeHTML(pdf.size)}</span>` : ""}
                ${pdf.downloads ? `<span><i class="fa-solid fa-download mr-1"></i>${escapeHTML(pdf.downloads)} downloads</span>` : ""}
              </div>
            </div>
          </div>

          ${
            realUrl
              ? `
                <a
                  class="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-900"
                  href="${escapeHTML(realUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i class="fa-solid fa-download"></i> Open / Download
                </a>
              `
              : `
                <button
                  type="button"
                  class="mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-3 py-2 text-xs font-bold text-gray-500"
                  disabled
                  title="Add a real PDF URL to academic_data.js first"
                >
                  <i class="fa-solid fa-clock"></i> PDF not available yet
                </button>
              `
          }
        </article>
      `;
    });

    html += `
        </div>
      </section>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ------------------------------------------------------
// 3. Academic Room renderer
// ------------------------------------------------------

export function renderAcademicRoom({
  level = "freshman",
  stream = "natural",
  deptId = "med",
  searchQuery = "",
  container
} = {}) {
  if (!container) return;

  const query = normalizeSearch(searchQuery);
  let html = "";

  // Freshman materials
  if (level === "freshman") {
    const selectedStream = freshmanStreams[stream] || freshmanStreams.natural;

    if (!selectedStream) {
      container.innerHTML = `
        <p class="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          No stream data is available.
        </p>
      `;
      return;
    }

    const courses = (selectedStream.courses || []).filter(course =>
      normalizeSearch(course).includes(query)
    );

    const advices = (selectedStream.advices || []).filter(advice =>
      normalizeSearch(`${advice.author} ${advice.text}`).includes(query)
    );

    html += `
      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h4 class="text-sm font-extrabold text-slate-900">
              ${escapeHTML(selectedStream.name)}
            </h4>
            <p class="text-xs text-gray-500">Freshman course directory</p>
          </div>
        </div>

        <h5 class="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-600">
          Courses
        </h5>

        ${
          courses.length
            ? `<div class="space-y-2">
                ${courses.map(course => `
                  <div class="library-resource-card flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                    <i class="fa-solid fa-book-open mt-0.5 text-teal-700"></i>
                    <span>${escapeHTML(course)}</span>
                  </div>
                `).join("")}
              </div>`
            : `<p class="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">No matching courses found.</p>`
        }
      </section>
    `;

    if (advices.length) {
      html += `
        <section class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <h5 class="mb-3 text-xs font-extrabold uppercase tracking-wide text-amber-950">
            <i class="fa-solid fa-lightbulb mr-1"></i> Advice from seniors
          </h5>

          <div class="space-y-3">
            ${advices.map(advice => `
              <article class="library-resource-card rounded-xl border border-amber-100 bg-white p-3">
                <p class="text-xs leading-relaxed text-slate-700">
                  ${escapeHTML(advice.text)}
                </p>
                <p class="mt-2 text-[11px] font-bold text-amber-900">
                  ${escapeHTML(advice.author)}
                </p>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    if (!courses.length && !advices.length) {
      html = `
        <p class="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
          No matching academic materials found. Try another search.
        </p>
      `;
    }

    container.innerHTML = html;
    return;
  }

  // Senior and alumni materials
  if (level === "senior" || level === "alumni") {
    const department = seniorDepartments.find(dept => dept.id === deptId);

    if (!department) {
      container.innerHTML = `
        <div class="rounded-xl border border-dashed border-gray-300 p-5 text-center">
          <i class="fa-solid fa-building-columns text-xl text-gray-400"></i>
          <p class="mt-2 text-sm font-bold text-slate-700">Choose a department</p>
          <p class="mt-1 text-xs text-gray-500">
            Select your department above to view courses and advice.
          </p>
        </div>
      `;
      return;
    }

    const courses = (department.courses || []).filter(course =>
      normalizeSearch(course).includes(query)
    );

    const advices = (department.advices || []).filter(advice =>
      normalizeSearch(`${advice.author} ${advice.text}`).includes(query)
    );

    html += `
      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <i class="fa-solid fa-building-columns"></i>
          </div>

          <div>
            <h4 class="text-sm font-extrabold text-slate-900">
              ${escapeHTML(department.name)}
            </h4>
            <p class="text-xs text-gray-500">
              ${escapeHTML(department.group)} · ${level === "alumni" ? "Alumni / Graduate" : "Senior Student"}
            </p>
          </div>
        </div>

        <h5 class="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-600">
          Course and exam preparation directory
        </h5>

        ${
          courses.length
            ? `<div class="space-y-2">
                ${courses.map(course => `
                  <div class="library-resource-card flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                    <i class="fa-solid fa-book-open mt-0.5 text-teal-700"></i>
                    <span>${escapeHTML(course)}</span>
                  </div>
                `).join("")}
              </div>`
            : `<p class="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">No matching courses found.</p>`
        }
      </section>
    `;

    if (advices.length) {
      html += `
        <section class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <h5 class="mb-3 text-xs font-extrabold uppercase tracking-wide text-amber-950">
            <i class="fa-solid fa-lightbulb mr-1"></i> Advice and mentorship
          </h5>

          <div class="space-y-3">
            ${advices.map(advice => `
              <article class="library-resource-card rounded-xl border border-amber-100 bg-white p-3">
                <p class="text-xs leading-relaxed text-slate-700">
                  ${escapeHTML(advice.text)}
                </p>
                <p class="mt-2 text-[11px] font-bold text-amber-900">
                  ${escapeHTML(advice.author)}
                </p>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    if (!courses.length && !advices.length) {
      html = `
        <p class="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
          No matching academic materials found. Try another search.
        </p>
      `;
    }

    container.innerHTML = html;
    return;
  }

  container.innerHTML = `
    <p class="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
      Select a learning level to view its materials.
    </p>
  `;
}

// ------------------------------------------------------
// 4. Library modal controller
// ------------------------------------------------------

export function setupLibraryModal() {
  const modal = document.getElementById("library-modal");
  if (!modal) {
    console.warn("Library setup stopped: #library-modal was not found in index.html.");
    return;
  }
  if (modal.dataset.libraryInitialized === "true") return;

  const dialog = modal.firstElementChild;
  const body = modal.querySelector(".overflow-y-auto.flex-1");
  const closeButton = document.getElementById("close-library-modal-btn");
  const spiritualTab = document.getElementById("room-tab-spiritual");
  const academicTab = document.getElementById("room-tab-academic");
  const searchInput = document.getElementById("library-search-input");
  const resultsContainer = document.getElementById("library-results-container");
  const spiritualControls = document.getElementById("spiritual-controls");
  const academicControls = document.getElementById("academic-controls");
  const freshmanStreamBox = document.getElementById("freshman-stream-box");
  const seniorDeptBox = document.getElementById("senior-dept-box");
  const departmentSelect = document.getElementById("library-dept-select");
  const roomTabs = spiritualTab?.parentElement;

  if (!dialog || !body || !resultsContainer) {
    console.warn("Library setup stopped: the library dialog or room content is missing.");
    return;
  }

  modal.dataset.libraryInitialized = "true";
  modal.setAttribute("aria-hidden", "true");
  dialog.classList.remove("max-w-2xl", "max-h-[90vh]");
  dialog.classList.add("w-full", "max-w-7xl", "h-[92vh]");

  body.insertAdjacentHTML("afterbegin", `
    <section id="library-lobby" class="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 p-6 text-white sm:p-10">
      <div aria-hidden="true" class="absolute inset-0 -z-10 opacity-40" style="background: repeating-linear-gradient(90deg, transparent 0 42px, rgba(251,191,36,.28) 43px 47px, transparent 48px 88px), linear-gradient(180deg, transparent 0 44%, rgba(120,53,15,.9) 45% 49%, transparent 50% 82%, rgba(120,53,15,.9) 83% 87%, transparent 88%);"></div>
      <div class="mx-auto max-w-5xl">
        <div class="mb-8 flex items-center gap-3">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/15 text-amber-300"><i class="fa-solid fa-book-open-reader text-xl"></i></span>
          <div><p class="text-[11px] font-bold uppercase tracking-[.22em] text-amber-300">ACE-USF Digital Library</p><p class="text-xs text-slate-300">A place to read, learn, and grow</p></div>
        </div>
        <p class="text-xs font-bold uppercase tracking-[.2em] text-amber-200">Welcome, reader</p>
        <h1 class="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Choose your library room</h1>
        <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">Welcome to a calm place to read, learn, and grow. Fresh water, open-air comfort, and a quiet seat are ready for your visit.</p>
        <div class="mt-4 flex flex-wrap gap-2"><span class="library-breeze"><i class="fa-solid fa-glass-water"></i> Fresh water</span><span class="library-breeze"><i class="fa-solid fa-wind"></i> A fresh, airy reading space</span></div>
        <form id="library-lobby-search" class="mt-6 flex max-w-3xl gap-2" role="search"><label class="sr-only" for="library-lobby-search-input">Search books in both library rooms</label><input id="library-lobby-search-input" type="search" placeholder="Search books by title, author, or subject…" class="min-h-12 min-w-0 flex-1 rounded-xl border border-white/25 bg-white/95 px-4 text-sm text-slate-900 shadow-lg outline-none transition placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-300"><button class="min-h-12 rounded-xl bg-amber-400 px-4 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-white" type="submit"><i class="fa-solid fa-magnifying-glass mr-2"></i>Search books</button></form>
        <div class="mt-8 grid gap-4 md:grid-cols-2">
          <button type="button" data-enter-room="spiritual" class="group rounded-2xl border border-amber-200/25 bg-slate-950/55 p-5 text-left shadow-xl transition hover:-translate-y-1 hover:border-amber-300/70 hover:bg-slate-950/75 focus:outline-none focus:ring-2 focus:ring-amber-300 sm:p-7">
            <span class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><i class="fa-solid fa-book-bible text-xl"></i></span>
            <span class="block text-xl font-extrabold">Apostolic Spiritual Library</span>
            <span class="mt-2 block text-sm leading-6 text-slate-300">Explore Scripture, Apostolic faith topics, prayer, church history, and spiritual growth.</span>
            <span class="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-300">Enter spiritual room <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1"></i></span>
          </button>
          <button type="button" data-enter-room="academic" class="group rounded-2xl border border-teal-200/25 bg-slate-950/55 p-5 text-left shadow-xl transition hover:-translate-y-1 hover:border-teal-300/70 hover:bg-slate-950/75 focus:outline-none focus:ring-2 focus:ring-teal-300 sm:p-7">
            <span class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15 text-teal-300"><i class="fa-solid fa-graduation-cap text-xl"></i></span>
            <span class="block text-xl font-extrabold">Apostolic Academic Library</span>
            <span class="mt-2 block text-sm leading-6 text-slate-300">Find course topics, study guidance, and learning resources for university life.</span>
            <span class="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-300">Enter academic room <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1"></i></span>
          </button>
        </div>
        <p class="mt-6 text-[11px] leading-5 text-slate-400">Resource availability is shown clearly. External reading and download links will be added only when verified.</p>
      </div>
    </section>
  `);

  const lobby = document.getElementById("library-lobby");
  const lobbySearchForm = document.getElementById("library-lobby-search");
  const lobbySearchInput = document.getElementById("library-lobby-search-input");
  const roomToolbar = document.createElement("div");
  roomToolbar.id = "library-room-toolbar";
  roomToolbar.className = "hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between";
  roomToolbar.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="library-back-to-lobby" type="button" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600">
        <i class="fa-solid fa-arrow-left"></i><span>Library lobby</span>
      </button>
      <div><p class="text-[10px] font-bold uppercase tracking-wider text-teal-700">ACE-USF Digital Library</p><h2 id="library-room-title" class="text-base font-extrabold text-slate-900">Spiritual Library</h2></div>
    </div>
    <p id="library-room-subtitle" class="hidden text-xs text-slate-500 md:block"></p>
  `;
  lobby.after(roomToolbar);
  const roomScene = document.createElement("section");
  roomScene.id = "library-room-scene";
  roomScene.className = "hidden";
  roomToolbar.after(roomScene);

  const catalogResults = document.createElement("section");
  catalogResults.id = "library-catalog-results";
  catalogResults.className = "hidden";
  catalogResults.setAttribute("aria-live", "polite");
  catalogResults.setAttribute("aria-label", "Book catalog search results");
  resultsContainer.after(catalogResults);

  const searchActions = document.createElement("div");
  searchActions.className = "mt-3 flex flex-wrap items-center gap-3";
  searchActions.innerHTML = `
    <button id="library-catalog-search-btn" type="button" class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
      <i class="fa-solid fa-magnifying-glass"></i><span>Search books in both rooms</span>
    </button>
    <span class="text-xs text-slate-500">Searches the Open Library catalog. Access options vary by title.</span>
  `;
  searchInput?.insertAdjacentElement("afterend", searchActions);

  const roomStyle = document.createElement("style");
  roomStyle.textContent = `
    #library-modal #library-lobby { background-image: radial-gradient(ellipse at 15% 0%,rgba(145,227,206,.24),transparent 35%),radial-gradient(ellipse at 90% 100%,rgba(255,196,104,.17),transparent 42%); }
    #library-modal #library-room-scene { animation: library-room-enter .55s cubic-bezier(.2,.75,.25,1) both; }
    #library-modal .library-room-shell { background-size:180% 180%; animation:library-ambient 22s ease-in-out infinite alternate; }
    #library-modal .library-room-photo { position:relative; min-height:220px; aspect-ratio:16/6; overflow:hidden; border:1px solid rgba(255,255,255,.7); border-radius:1.25rem; background:#173c46; box-shadow:0 22px 55px rgba(15,23,42,.22); }
    #library-modal .library-room-photo img { width:100%; height:100%; min-height:220px; object-fit:cover; object-position:center 46%; transition:transform 1.2s cubic-bezier(.2,.7,.2,1),filter .5s ease; }
    #library-modal .library-room-photo:hover img { transform:scale(1.035); filter:saturate(1.08); }
    #library-modal .library-room-photo::after { content:""; position:absolute; inset:30% 0 0; background:linear-gradient(180deg,transparent,rgba(10,24,28,.78)); pointer-events:none; }
    #library-modal .library-photo-caption { position:absolute; z-index:1; left:1.1rem; right:1.1rem; bottom:1rem; display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:.75rem; color:#fff; }
    #library-modal .library-room-photo:hover { box-shadow:0 25px 65px rgba(15,23,42,.3); }
    #library-modal .library-book-card { position:relative; isolation:isolate; border:1px solid #e5e7eb; background:linear-gradient(145deg,#fff 0%,#fcfbf7 100%); box-shadow:0 8px 22px rgba(25,45,55,.07); transition:transform .24s ease,box-shadow .24s ease,border-color .24s ease; }
    #library-modal .library-book-card:hover { transform:translateY(-4px); border-color:#93c5b9; box-shadow:0 18px 38px rgba(22,68,68,.15); }
    #library-modal .library-book-card img { transition:transform .28s ease; }
    #library-modal .library-book-card:hover img { transform:rotate(-2deg) scale(1.035); }
    #library-modal .library-book-spine { position:relative; overflow:hidden; border-radius:5px 5px 2px 2px; box-shadow:inset 3px 0 5px rgba(0,0,0,.2),inset -2px 0 4px rgba(255,255,255,.18),0 5px 10px rgba(0,0,0,.25); transition:transform .2s ease,filter .2s ease; }
    #library-modal .library-book-spine::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(110deg,transparent 15%,rgba(255,255,255,.2) 45%,transparent 60%); transform:translateX(-120%); transition:transform .45s ease; }
    #library-modal .library-book-spine:hover::after { transform:translateX(120%); }
    #library-modal .library-resource-card { border:1px solid rgba(226,232,240,.9); background:linear-gradient(135deg,#fff 0%,#f7faf9 100%); box-shadow:0 7px 20px rgba(15,23,42,.045); transition:transform .2s ease,box-shadow .2s ease; }
    #library-modal .library-resource-card:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(15,23,42,.09); }
    #library-modal [data-library-room-art] { position:relative; overflow:hidden; min-height:150px; border-radius:1.15rem; isolation:isolate; }
    #library-modal [data-library-room-art]::before { content:""; position:absolute; inset:0; z-index:-1; background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.85),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.13),transparent 42%,rgba(15,23,42,.18)); }
    #library-modal .library-window-light { position:absolute; top:-20%; right:8%; width:25%; height:90%; border:10px solid rgba(255,255,255,.2); border-bottom:0; border-radius:50% 50% 0 0; background:linear-gradient(135deg,rgba(255,255,230,.4),rgba(139,220,238,.12)); filter:blur(.3px); transform:skewY(-8deg); }
    #library-modal .library-reader { position:absolute; bottom:14px; width:44px; height:60px; border-radius:23px 23px 8px 8px; background:linear-gradient(90deg,#193f40,#397d72); box-shadow:0 9px 14px rgba(15,23,42,.25); }
    #library-modal .library-reader::before { content:""; position:absolute; width:25px; height:25px; border-radius:50%; top:-19px; left:10px; background:linear-gradient(135deg,#985b3e,#d39a69); box-shadow:0 0 0 4px rgba(255,255,255,.28); }
    #library-modal .library-reader::after { content:""; position:absolute; left:-12px; right:-12px; top:20px; height:24px; border-radius:6px; background:linear-gradient(90deg,#f3d58b 0 48%,#fff5d6 49% 51%,#c88d43 52%); transform:rotate(-7deg); box-shadow:0 4px 9px rgba(15,23,42,.28); }
    #library-modal .library-reader.reader-two { background:linear-gradient(90deg,#593b60,#906c9a); }
    #library-modal .library-reader.reader-three { background:linear-gradient(90deg,#9a5a31,#d68a42); }
    #library-modal .library-browser { position:absolute; left:27%; bottom:18px; width:34px; height:66px; border-radius:18px 18px 5px 5px; background:linear-gradient(90deg,#244b66,#487b91); transform:rotate(-7deg); box-shadow:0 8px 12px rgba(15,23,42,.22); }
    #library-modal .library-browser::before { content:""; position:absolute; top:-19px; left:6px; width:23px; height:23px; border-radius:50%; background:linear-gradient(135deg,#985b3e,#d39a69); }
    #library-modal .library-browser::after { content:""; position:absolute; top:7px; right:-24px; width:32px; height:9px; border-radius:8px; background:#244b66; transform:rotate(-22deg); transform-origin:left center; }
    #library-modal .library-table { position:absolute; left:9%; right:9%; bottom:9px; height:13px; border-radius:8px; background:linear-gradient(#bd8750,#754820); box-shadow:0 9px 14px rgba(15,23,42,.28); }
    #library-modal .library-water { position:absolute; right:12%; bottom:22px; width:23px; height:34px; border:2px solid rgba(255,255,255,.75); border-radius:5px 5px 9px 9px; background:linear-gradient(180deg,rgba(255,255,255,.8) 12%,rgba(107,205,229,.8) 13%); box-shadow:0 2px 8px rgba(15,23,42,.2); }
    #library-modal .library-shelf-art { position:absolute; inset:16px auto 30px 4%; width:20%; border:8px solid #704622; border-right-width:5px; background:repeating-linear-gradient(90deg,#cb8b40 0 13px,#633f25 14px 16px,#b86e42 17px 28px,#633f25 29px 31px); box-shadow:5px 9px 18px rgba(15,23,42,.2); }
    #library-modal .library-breeze { display:inline-flex; align-items:center; gap:.45rem; border:1px solid rgba(255,255,255,.65); border-radius:999px; background:rgba(255,255,255,.72); padding:.55rem .85rem; color:#174a58; font-size:.72rem; font-weight:700; box-shadow:0 8px 24px rgba(30,64,80,.09); }
    @keyframes library-room-enter { from { opacity:0; transform:translateY(12px) scale(.99); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes library-ambient { from { background-position:0% 0%; } to { background-position:100% 100%; } }
    @media (prefers-reduced-motion: reduce) { #library-modal #library-room-scene,#library-modal .library-room-shell { animation:none; } #library-modal .library-book-card,#library-modal .library-resource-card { transition:none; } }
  `;
  body.prepend(roomStyle);

  const searchWrapper = searchInput?.parentElement;
  const roomContents = [roomScene, searchWrapper, searchActions, academicControls, spiritualControls, resultsContainer, catalogResults].filter(Boolean);
  const initialRoomTabsClass = roomTabs?.className || "";

  let activeRoom = "lobby";
  let activeSpiritualCategory = "all";
  let currentLevel = localStorage.getItem("ace_user_level") || "freshman";
  let currentStream = localStorage.getItem("ace_user_stream") || "natural";
  let currentDept = localStorage.getItem("ace_user_dept") || "med";
  let searchQuery = "";
  const catalogCache = new Map();
  let catalogController = null;

  function showCatalogMessage(message, isError = false) {
    catalogResults.innerHTML = `<div class="rounded-2xl border ${isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-white/90 text-slate-600"} p-5 text-sm" role="status">${escapeHTML(message)}</div>`;
    setVisible(catalogResults, true);
  }

  function renderCatalogBooks(data) {
    const books = (data.docs || []).slice(0, 12);
    if (!books.length) {
      showCatalogMessage("No books matched that search. Try a title, author, subject, or a shorter phrase.");
      return;
    }
    const cards = books.map(book => {
      const title = book.title || "Untitled book";
      const author = Array.isArray(book.author_name) ? book.author_name.slice(0, 3).join(", ") : "Author not listed";
      const cover = book.cover_i ? `https://covers.openlibrary.org/b/id/${encodeURIComponent(book.cover_i)}-M.jpg` : "";
      const recordUrl = book.key ? `https://openlibrary.org${book.key}` : "https://openlibrary.org";
      const year = book.first_publish_year ? `First published ${book.first_publish_year}` : "Publication year not listed";
      const subject = Array.isArray(book.subject) ? book.subject.slice(0, 2).join(" · ") : "";
      return `<article class="library-book-card group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div class="flex min-h-32 gap-4 p-4">${cover ? `<img src="${escapeHTML(cover)}" alt="Cover of ${escapeHTML(title)}" loading="lazy" class="h-28 w-20 shrink-0 rounded-lg bg-slate-100 object-cover shadow">` : `<div aria-hidden="true" class="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-700 to-slate-900 text-3xl text-amber-200 shadow"><i class="fa-solid fa-book-open"></i></div>`}<div class="min-w-0 flex-1"><h3 class="line-clamp-2 text-sm font-extrabold leading-5 text-slate-900">${escapeHTML(title)}</h3><p class="mt-2 line-clamp-2 text-xs text-slate-600">${escapeHTML(author)}</p><p class="mt-1 text-[11px] text-slate-500">${escapeHTML(year)}</p>${subject ? `<p class="mt-2 line-clamp-1 text-[10px] text-teal-800">${escapeHTML(subject)}</p>` : ""}<a class="mt-3 inline-flex items-center gap-2 text-xs font-bold text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-950" href="${escapeHTML(recordUrl)}" target="_blank" rel="noopener noreferrer">View catalog record <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a></div></div></article>`;
    }).join("");
    catalogResults.innerHTML = `<div class="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p class="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-800">Shared book search · both rooms</p><h3 class="mt-1 text-lg font-black text-slate-900">Catalog results</h3></div><p class="text-xs text-slate-500">From Open Library · Check each record for available reading options.</p></div><div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">${cards}</div>`;
    setVisible(catalogResults, true);
  }

  async function searchCatalog() {
    const query = (searchInput?.value || "").trim();
    searchQuery = query;
    renderCurrentRoom();
    if (!query) {
      showCatalogMessage("Type a title, author, or subject to search books across both library rooms.");
      searchInput?.focus();
      return;
    }
    const cacheKey = query.toLowerCase();
    if (catalogCache.has(cacheKey)) {
      renderCatalogBooks(catalogCache.get(cacheKey));
      catalogResults.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    catalogController?.abort();
    catalogController = new AbortController();
    showCatalogMessage("Searching the shared book catalog…");
    const button = document.getElementById("library-catalog-search-btn");
    if (button) { button.disabled = true; button.classList.add("opacity-70", "cursor-wait"); }
    try {
      const params = new URLSearchParams({ q: query, limit: "12", fields: "key,title,author_name,first_publish_year,cover_i,subject" });
      const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal: catalogController.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Catalog request returned ${response.status}`);
      const data = await response.json();
      catalogCache.set(cacheKey, data);
      renderCatalogBooks(data);
      catalogResults.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.warn("Open Library search could not be completed:", error);
      showCatalogMessage("The book catalog could not be reached right now. Check your internet connection and try again.", true);
    } finally {
      if (button) { button.disabled = false; button.classList.remove("opacity-70", "cursor-wait"); }
    }
  }

  function renderCurrentRoom() {
    if (activeRoom === "spiritual") {
      renderSpiritualRoom(resultsContainer, activeSpiritualCategory, searchQuery);
    } else if (activeRoom === "academic") {
      renderAcademicRoom({ level: currentLevel, stream: currentStream, deptId: currentDept, searchQuery, container: resultsContainer });
    }
  }

  function updateRoomUI() {
    const spiritualActive = activeRoom === "spiritual";
    setVisible(spiritualControls, spiritualActive);
    setVisible(academicControls, activeRoom === "academic");
    setVisible(freshmanStreamBox, activeRoom === "academic" && currentLevel === "freshman");
    setVisible(seniorDeptBox, activeRoom === "academic" && currentLevel !== "freshman");

    if (spiritualTab) {
      spiritualTab.classList.toggle("bg-amber-500", spiritualActive);
      spiritualTab.classList.toggle("text-slate-950", spiritualActive);
      spiritualTab.setAttribute("aria-pressed", String(spiritualActive));
    }
    if (academicTab) {
      academicTab.classList.toggle("bg-amber-500", activeRoom === "academic");
      academicTab.classList.toggle("text-slate-950", activeRoom === "academic");
      academicTab.setAttribute("aria-pressed", String(activeRoom === "academic"));
    }

    document.querySelectorAll(".level-btn").forEach(button => {
      const active = button.dataset.level === currentLevel;
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".stream-btn").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.stream === currentStream));
    });
    if (departmentSelect && departmentSelect.value !== currentDept) departmentSelect.value = currentDept;
  }

  function renderRoomScene(room) {
    const palettes = ["#9f3b24", "#d59a32", "#246b65", "#344b76", "#7a3e68", "#566b3c", "#9a683b", "#254e59"];
    const makeSpines = (items, kind) => items.map((item, index) => {
      const id = item.id || item.key || String(index);
      const label = item.name || item.title || "Book";
      const action = kind === "spiritual"
        ? `data-shelf-kind="spiritual" data-shelf-id="${escapeHTML(id)}"`
        : kind === "department"
          ? `data-shelf-kind="department" data-shelf-id="${escapeHTML(id)}"`
          : `data-shelf-kind="stream" data-shelf-id="${escapeHTML(id)}"`;
      const height = 92 + ((index * 17) % 48);
      return `
        <button type="button" ${action} aria-label="Open ${escapeHTML(label)} shelf" title="${escapeHTML(label)}"
          class="library-book-spine group relative mb-1 min-w-10 flex-1 rounded-t-md border border-white/20 px-1 pt-2 text-white shadow-lg transition hover:-translate-y-2 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:min-w-12"
          style="height:${height}px;background:linear-gradient(90deg,rgba(0,0,0,.3),transparent 24%,rgba(255,255,255,.12) 78%,rgba(0,0,0,.22)),${palettes[index % palettes.length]}">
          <span class="mx-auto block max-h-full overflow-hidden text-[9px] font-bold leading-tight tracking-wide" style="writing-mode:vertical-rl;transform:rotate(180deg)">${escapeHTML(label)}</span>
        </button>
      `;
    }).join("");

    if (room === "spiritual") {
      roomScene.innerHTML = `
        <section class="library-room-shell relative isolate overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-stone-100 to-amber-100 p-4 shadow-inner sm:p-7">
          <div aria-hidden="true" class="absolute inset-0 -z-10 opacity-50" style="background:radial-gradient(ellipse at 50% 0%,rgba(255,238,180,.9),transparent 58%),linear-gradient(180deg,transparent 72%,rgba(120,53,15,.12))"></div>
          <figure data-library-room-art class="library-room-photo mb-6">
            <img src="./assets/ace-usf-library-students.png" alt="Three young male students reading a Bible together in a bright library" loading="eager">
            <figcaption class="library-photo-caption"><span><span class="block text-[10px] font-extrabold uppercase tracking-[.2em] text-amber-200">Apostolic fellowship · shared reading</span><span class="mt-1 block text-lg font-black sm:text-2xl">Read together. Grow together.</span></span><span class="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-[11px] font-bold backdrop-blur"><i class="fa-solid fa-wind mr-1 text-teal-200"></i>Fresh, quiet reading space</span></figcaption>
          </figure>
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p class="text-[10px] font-extrabold uppercase tracking-[.2em] text-amber-800">Quiet reading room · Scripture & faith</p><h2 class="mt-1 text-2xl font-black tracking-tight text-amber-950 sm:text-3xl">Welcome to the Apostolic Spiritual Digital Library</h2><p class="mt-2 max-w-3xl text-xs leading-5 text-slate-700 sm:text-sm">A peaceful place to explore Scripture, deepen your understanding of Christian faith, discover spiritual wisdom, and grow in your walk with God.</p></div>
            <div class="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-xs font-semibold text-amber-950"><i class="fa-solid fa-book-bible text-amber-700"></i> Spiritual collections</div>
          </div>
          <div class="rounded-2xl border border-amber-950/20 bg-gradient-to-b from-amber-900 to-amber-950 p-3 shadow-2xl sm:p-5">
            <div class="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-amber-100/80"><span><i class="fa-solid fa-book-open mr-1"></i> Scripture & Apostolic study shelves</span><span class="hidden sm:inline">Select a book spine to explore its topic</span></div>
            <div class="flex min-h-36 items-end gap-1 overflow-x-auto border-b-[10px] border-amber-950 bg-gradient-to-b from-amber-800/70 to-amber-900 px-2 pt-5 shadow-[inset_0_8px_16px_rgba(0,0,0,.25)] sm:gap-2 sm:px-4">${makeSpines(spiritualCategories, "spiritual")}</div>
            <div class="mt-3 flex items-center justify-between text-[10px] text-amber-100/80"><span>Warm wood reading room</span><span><i class="fa-solid fa-volume-low mr-1"></i> Quiet space</span></div>
          </div>
        </section>
      `;
      return;
    }

    const streamItems = Object.entries(freshmanStreams).map(([id, item]) => ({ id, name: item.name }));
    roomScene.innerHTML = `
      <section class="library-room-shell relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 p-4 shadow-inner sm:p-7">
        <div aria-hidden="true" class="absolute inset-0 -z-10 opacity-50" style="background:radial-gradient(ellipse at 80% 0%,rgba(255,255,255,.95),transparent 52%),linear-gradient(180deg,transparent 72%,rgba(30,64,100,.12))"></div>
        <figure data-library-room-art class="library-room-photo mb-6">
          <img src="./assets/ace-usf-library-students.png" alt="Young male university students reading together among library shelves" loading="eager">
          <figcaption class="library-photo-caption"><span><span class="block text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-200">University study · books & discovery</span><span class="mt-1 block text-lg font-black sm:text-2xl">Find your next idea.</span></span><span class="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-[11px] font-bold backdrop-blur"><i class="fa-solid fa-glass-water mr-1 text-sky-200"></i>Fresh water · open-air comfort</span></figcaption>
        </figure>
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p class="text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-800">University study room · Knowledge & discovery</p><h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Welcome to the Apostolic Academic Digital Library</h2><p class="mt-2 max-w-3xl text-xs leading-5 text-slate-700 sm:text-sm">A place for university students to explore knowledge, strengthen academic foundations, and find learning resources for their studies.</p></div>
          <div class="flex shrink-0 items-center gap-2 rounded-2xl border border-sky-200 bg-white/75 px-4 py-3 text-xs font-semibold text-sky-950"><i class="fa-solid fa-graduation-cap text-sky-700"></i> Study collections</div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-300 bg-gradient-to-b from-slate-700 to-slate-900 p-3 shadow-2xl sm:p-5">
            <div class="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-100/80"><span>Freshman course shelves</span><span class="hidden sm:inline">Choose a stream</span></div>
            <div class="flex min-h-36 items-end gap-2 overflow-x-auto border-b-[10px] border-slate-950 bg-gradient-to-b from-slate-600/80 to-slate-800 px-3 pt-5 shadow-[inset_0_8px_16px_rgba(0,0,0,.25)]">${makeSpines(streamItems, "stream")}</div>
          </div>
          <div class="rounded-2xl border border-slate-300 bg-gradient-to-b from-slate-700 to-slate-900 p-3 shadow-2xl sm:p-5">
            <div class="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-100/80"><span>Department shelves</span><span class="hidden sm:inline">Select a subject</span></div>
            <div class="flex min-h-36 items-end gap-1 overflow-x-auto border-b-[10px] border-slate-950 bg-gradient-to-b from-slate-600/80 to-slate-800 px-2 pt-5 shadow-[inset_0_8px_16px_rgba(0,0,0,.25)] sm:gap-2 sm:px-3">${makeSpines(seniorDepartments, "department")}</div>
          </div>
        </div>
        <p class="mt-3 text-[10px] text-slate-600"><i class="fa-solid fa-laptop mr-1"></i> Course shelves open your existing academic hub; verified digital books will appear as catalog sources are connected.</p>
      </section>
    `;
  }
  function enterRoom(room) {
    if (room !== "spiritual" && room !== "academic") return;
    activeRoom = room;
    renderRoomScene(room);
    activeSpiritualCategory = "all";
    searchQuery = "";
    if (searchInput) searchInput.value = "";
    setVisible(lobby, false);
    setVisible(roomToolbar, true);
    roomToolbar.classList.remove("sm:flex");
    roomToolbar.classList.add("flex", "items-center", "justify-between", "gap-3");
    roomTabs?.classList.remove("hidden");
    const title = document.getElementById("library-room-title");
    const subtitle = document.getElementById("library-room-subtitle");
    if (title) title.textContent = room === "spiritual" ? "Apostolic Spiritual Library" : "Apostolic Academic Library";
    if (subtitle) subtitle.textContent = room === "spiritual" ? "Scripture, faith, and spiritual growth" : "Courses, study skills, and academic learning";
    roomContents.forEach(element => setVisible(element, true));
    updateRoomUI();
    renderCurrentRoom();
  }

  function returnToLobby() {
    activeRoom = "lobby";
    setVisible(lobby, true);
    setVisible(roomToolbar, false);
    roomTabs?.classList.add("hidden");
    roomContents.forEach(element => setVisible(element, false));
  }

  modal.querySelectorAll("[data-enter-room]").forEach(button => {
    button.addEventListener("click", () => enterRoom(button.dataset.enterRoom));
  });
  lobbySearchForm?.addEventListener("submit", event => {
    event.preventDefault();
    const query = lobbySearchInput?.value.trim() || "";
    enterRoom("spiritual");
    if (searchInput) searchInput.value = query;
    searchCatalog();
  });
  document.getElementById("library-back-to-lobby").addEventListener("click", returnToLobby);
  roomScene.addEventListener("click", event => {
    const shelf = event.target.closest("[data-shelf-kind]");
    if (!shelf || !roomScene.contains(shelf)) return;
    const kind = shelf.dataset.shelfKind;
    const id = shelf.dataset.shelfId || "";
    if (kind === "spiritual") {
      activeSpiritualCategory = id;
    } else if (kind === "stream") {
      currentLevel = "freshman";
      currentStream = id;
      try { localStorage.setItem("ace_user_level", currentLevel); localStorage.setItem("ace_user_stream", currentStream); } catch (error) { console.warn("Could not save academic selection:", error); }
    } else if (kind === "department") {
      currentLevel = "senior";
      currentDept = id;
      try { localStorage.setItem("ace_user_level", currentLevel); localStorage.setItem("ace_user_dept", currentDept); } catch (error) { console.warn("Could not save academic selection:", error); }
    }
    updateRoomUI();
    renderCurrentRoom();
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (roomTabs) roomTabs.classList.add("hidden");
  roomContents.forEach(element => setVisible(element, false));

  spiritualTab?.addEventListener("click", () => enterRoom("spiritual"));
  academicTab?.addEventListener("click", () => enterRoom("academic"));
  closeButton?.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    returnToLobby();
  });
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      returnToLobby();
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      returnToLobby();
    }
  });

  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value || "";
    setVisible(catalogResults, false);
    renderCurrentRoom();
  });
  document.getElementById("library-catalog-search-btn")?.addEventListener("click", searchCatalog);
  searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchCatalog();
    }
  });
  resultsContainer.addEventListener("click", event => {
    const categoryButton = event.target.closest(".sp-cat-pill");
    if (!categoryButton || !resultsContainer.contains(categoryButton)) return;
    activeSpiritualCategory = categoryButton.dataset.cat || "all";
    renderCurrentRoom();
  });

  document.querySelectorAll(".level-btn").forEach(button => {
    button.addEventListener("click", () => {
      currentLevel = button.dataset.level || "freshman";
      try { localStorage.setItem("ace_user_level", currentLevel); } catch (error) { console.warn("Could not save academic level:", error); }
      updateRoomUI();
      renderCurrentRoom();
    });
  });
  document.querySelectorAll(".stream-btn").forEach(button => {
    button.addEventListener("click", () => {
      currentStream = button.dataset.stream || "natural";
      try { localStorage.setItem("ace_user_stream", currentStream); } catch (error) { console.warn("Could not save academic stream:", error); }
      updateRoomUI();
      renderCurrentRoom();
    });
  });

  if (departmentSelect) {
    departmentSelect.innerHTML = `
      <option value="">Choose your department...</option>
      ${[...new Set(seniorDepartments.map(dept => dept.group))].map(group => `
        <optgroup label="${escapeHTML(group)}">
          ${seniorDepartments.filter(dept => dept.group === group).map(dept => `
            <option value="${escapeHTML(dept.id)}">${escapeHTML(dept.name)}</option>
          `).join("")}
        </optgroup>
      `).join("")}
    `;
    departmentSelect.addEventListener("change", () => {
      currentDept = departmentSelect.value || "med";
      try { localStorage.setItem("ace_user_dept", currentDept); } catch (error) { console.warn("Could not save academic department:", error); }
      renderCurrentRoom();
    });
    currentDept = seniorDepartments.some(dept => dept.id === currentDept) ? currentDept : "med";
    departmentSelect.value = currentDept;
  }

  if (roomTabs) roomTabs.className = initialRoomTabsClass;
  roomTabs?.classList.add("hidden");
  returnToLobby();
}

// ------------------------------------------------------
// 5. Compatibility with app.js navigation
// ------------------------------------------------------

export function renderLibrarySection() {
  const modal = document.getElementById("library-modal");
  if (!modal) {
    console.warn("Cannot open the Apostolic Library: #library-modal was not found in index.html.");
    return;
  }
  setupLibraryModal();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}
