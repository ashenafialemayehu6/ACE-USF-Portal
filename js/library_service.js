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

function bindLibraryPhotoFallback(container) {
  const image = container?.querySelector("[data-library-photo]");
  const fallback = container?.querySelector("[data-library-photo-fallback]");
  if (!image || !fallback) return;

  const showFallback = () => {
    image.classList.add("hidden");
    fallback.classList.remove("hidden");
    fallback.setAttribute("aria-hidden", "false");
  };
  const showImage = () => {
    image.classList.remove("hidden");
    fallback.classList.add("hidden");
    fallback.setAttribute("aria-hidden", "true");
  };

  if (!image.getAttribute("src")) {
    showFallback();
    return;
  }

  image.addEventListener("load", showImage, { once: true });
  image.addEventListener("error", showFallback, { once: true });
  if (image.complete) (image.naturalWidth > 0 ? showImage : showFallback)();
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
        const searchableText = normalizeSearch(
          `${pdf.title || ""} ${pdf.author || ""} ${category.name || ""} ${category.description || ""}`
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
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p class="text-[9px] font-extrabold uppercase tracking-[.2em] text-amber-800">Explore the shelves</p><h3 class="library-display mt-1 text-2xl font-semibold text-emerald-950">Spiritual Collections</h3></div>
      <p class="text-xs text-slate-600">Search by book, author, or collection.</p>
    </div>
    <div class="flex flex-wrap gap-2 border-b border-emerald-950/10 pb-4">
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

  html += `</div><div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">`;

  if (filteredCategories.length === 0) {
    html += `
      <div class="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-8 text-center md:col-span-2 xl:col-span-3">
        <i class="fa-solid fa-magnifying-glass text-2xl text-amber-800"></i>
        <p class="mt-3 text-sm font-bold text-slate-800">No matching books found</p>
        <p class="mt-1 text-xs text-gray-500">
          Try a title, author, or collection name, or choose another topic.
        </p>
      </div>
    `;

    container.innerHTML = html + `</div>`;
    return;
  }

  filteredCategories.forEach(category => {
    html += `
      <section class="library-collection-card flex flex-col rounded-2xl p-4 sm:p-5">
        <div class="flex items-start gap-3 border-b border-amber-900/10 pb-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            escapeHTML(category.badgeColor || "bg-emerald-50 text-emerald-900")
          }">
            <i class="fa-solid ${escapeHTML(category.icon || "fa-book")}" aria-hidden="true"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-800">Collection</p>
            <h4 class="mt-1 text-sm font-extrabold leading-snug text-slate-900">${escapeHTML(category.name)}</h4>
            <p class="mt-2 text-xs leading-5 text-slate-600">${escapeHTML(category.description || "")}</p>
          </div>
        </div>

        <div class="mt-4 flex flex-1 flex-col gap-3">
    `;

    if (category.matchingPdfs.length === 0) {
      html += `
        <p class="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-xs leading-5 text-amber-950">
          No book entries have been added to this collection yet.
        </p>
      `;
    }

    category.matchingPdfs.forEach(pdf => {
      const realUrl = getSafeResourceUrl(pdf.fileUrl);

      const categoryName = category.name || "Spiritual literature";
      const hasCover = Boolean(getSafeResourceUrl(pdf.coverUrl));
      const cover = getSafeResourceUrl(pdf.coverUrl);
      const detailsId = `library-details-${escapeHTML(category.id)}-${escapeHTML(pdf.title || "book").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      html += `
        <article class="library-resource-card group overflow-hidden rounded-2xl">
          <div class="flex gap-3 p-3.5">
            <div class="library-cover flex h-28 w-[4.5rem] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-white/40 px-1.5 text-center text-white shadow-md" aria-label="${hasCover ? `Cover of ${escapeHTML(pdf.title)}` : "Book cover not provided yet"}">
              ${hasCover
                ? `<img class="h-full w-full object-cover" src="${escapeHTML(cover)}" alt="Cover of ${escapeHTML(pdf.title)}" loading="lazy">`
                : `<i class="fa-solid fa-book-open mb-2 text-xl text-amber-200" aria-hidden="true"></i><span class="line-clamp-3 text-[8px] font-bold leading-tight">${escapeHTML(pdf.title || "Book")}</span>`}
            </div>
            <div class="min-w-0 flex-1 py-0.5">
              <p class="text-[9px] font-extrabold uppercase tracking-[.14em] text-emerald-800">${escapeHTML(categoryName)}</p>
              <h5 class="mt-1.5 text-xs font-extrabold leading-[1.45] text-slate-900">${escapeHTML(pdf.title || "Untitled resource")}</h5>
              <p class="mt-1.5 text-[11px] text-slate-600">${escapeHTML(pdf.author || "Author not specified")}</p>
              <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                ${pdf.size ? `<span><i class="fa-solid fa-hard-drive mr-1" aria-hidden="true"></i>${escapeHTML(pdf.size)}</span>` : ""}
                ${pdf.downloads ? `<span><i class="fa-solid fa-download mr-1" aria-hidden="true"></i>${escapeHTML(pdf.downloads)} downloads</span>` : ""}
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 border-t border-emerald-950/5 bg-white/60 px-3.5 py-3">
            ${realUrl
              ? `<a class="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-900 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" href="${escapeHTML(realUrl)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-book-open-reader" aria-hidden="true"></i>Read / open PDF</a>`
              : `<span class="inline-flex min-h-9 items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-[11px] font-semibold text-slate-500" aria-label="PDF not uploaded yet"><i class="fa-regular fa-clock" aria-hidden="true"></i>PDF coming soon</span>`}
            <details class="library-book-details ml-auto">
              <summary aria-controls="${detailsId}" class="cursor-pointer list-none rounded-lg px-2.5 py-2 text-[11px] font-bold text-emerald-900 underline decoration-emerald-700/30 underline-offset-4 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">Details</summary>
              <div id="${detailsId}" class="mt-2 basis-full text-[11px] leading-5 text-slate-600">${escapeHTML(pdf.description || category.description || "Details will appear when this resource is added.")}</div>
            </details>
          </div>
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
  modal.setAttribute("aria-label", "Apostolic Library");
  dialog.classList.remove("max-w-2xl", "max-h-[90vh]");
  dialog.classList.add("w-full", "max-w-7xl", "h-[92vh]");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "Apostolic Library");
  dialog.firstElementChild?.classList.add("library-modal-header");
  closeButton?.setAttribute("aria-label", "Close Apostolic Library");

  body.insertAdjacentHTML("afterbegin", `
    <section id="library-lobby" class="relative isolate overflow-hidden rounded-[1.75rem] p-5 text-slate-900 sm:p-8 lg:p-10">
      <figure class="library-lobby-banner -mx-5 -mt-5 mb-7 sm:-mx-8 sm:-mt-8 lg:-mx-10 lg:-mt-10">
        <img src="./assets/apostolic-library-lobby.jpg" alt="Apostolic Library reading room with bookshelves, study tables, Scripture, and book collections" loading="eager" fetchpriority="high">
      </figure>
      <div class="library-lobby-glow" aria-hidden="true"></div>
      <div class="relative mx-auto max-w-6xl">
        <div class="flex items-center gap-3">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-900/10 bg-amber-100 text-amber-900 shadow-sm"><i class="fa-solid fa-book-open-reader text-xl" aria-hidden="true"></i></span>
          <div><p class="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-900">ACE-USF • Digital Reading Room</p><p class="mt-0.5 text-xs text-slate-600">A quiet place for Scripture and spiritual growth</p></div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p id="library-welcome-name" class="text-[10px] font-extrabold uppercase tracking-[.24em] text-amber-800">Welcome to the library</p>
            <h1 class="library-display mt-2 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-tight text-emerald-950 sm:text-5xl">THE APOSTOLIC<br class="hidden sm:block"> LIBRARY</h1>
            <p class="library-display mt-4 text-base italic text-amber-900 sm:text-lg">“Rooted in the Word. Growing in Wisdom. Walking in the Spirit.”</p>
            <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">Welcome to a peaceful place to study Scripture, explore spiritual books, gain wisdom, and grow in faith. Choose a room to begin, or search the library collections.</p>
          </div>

          <aside class="library-scripture-card rounded-2xl p-5 sm:p-6" aria-label="Scripture reading">
            <div class="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-amber-200"><i class="fa-solid fa-sun" aria-hidden="true"></i> Wisdom for the journey</div>
            <blockquote class="library-display mt-4 text-lg leading-7 text-white sm:text-xl">“Happy is the man that findeth wisdom, and the man that getteth understanding.”</blockquote>
            <p class="mt-4 text-xs font-bold tracking-wide text-amber-200">PROVERBS 3:13 <span class="ml-1 font-medium text-amber-100/75">· King James Version</span></p>
          </aside>
        </div>

        <form id="library-lobby-search" class="mt-7 flex max-w-3xl flex-col gap-2 sm:flex-row" role="search">
          <label class="sr-only" for="library-lobby-search-input">Search books by title, author, or collection</label>
          <input id="library-lobby-search-input" type="search" placeholder="Search titles, authors, or collections…" class="min-h-12 min-w-0 flex-1 rounded-xl border border-emerald-950/15 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20">
          <button class="min-h-12 rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2" type="submit"><i class="fa-solid fa-magnifying-glass mr-2" aria-hidden="true"></i>Search library</button>
        </form>

        <div class="mt-7 grid gap-3 md:grid-cols-2">
          <button type="button" data-enter-room="spiritual" class="library-room-choice group rounded-2xl p-5 text-left transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 sm:p-6">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-amber-200"><i class="fa-solid fa-book-bible text-lg" aria-hidden="true"></i></span>
            <span class="mt-4 block text-lg font-extrabold text-emerald-950">Apostolic Spiritual Library</span>
            <span class="mt-2 block text-sm leading-5 text-slate-600">Scripture, apostolic teaching, prayer, and spiritual growth.</span>
            <span class="mt-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-900">Enter spiritual room <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1" aria-hidden="true"></i></span>
          </button>
          <button type="button" data-enter-room="academic" class="library-room-choice group rounded-2xl p-5 text-left transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 sm:p-6">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-950"><i class="fa-solid fa-graduation-cap text-lg" aria-hidden="true"></i></span>
            <span class="mt-4 block text-lg font-extrabold text-emerald-950">Apostolic Academic Library</span>
            <span class="mt-2 block text-sm leading-5 text-slate-600">Course directories and study guidance for university life.</span>
            <span class="mt-4 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-900">Enter academic room <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1" aria-hidden="true"></i></span>
          </button>
        </div>
        <p class="mt-4 text-[11px] leading-5 text-slate-600">Books appear with reading links when a verified PDF or source has been added.</p>
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
    #library-modal #library-lobby { background:linear-gradient(145deg,#faf8f1 0%,#f3eee1 55%,#f8f5ec 100%); box-shadow:inset 0 0 0 1px rgba(91,65,33,.12),0 24px 70px rgba(34,48,37,.12); }
    #library-modal .library-lobby-banner { position:relative; overflow:hidden; border:1px solid rgba(255,255,255,.72); border-top:0; border-radius:0 0 1.35rem 1.35rem; box-shadow:0 18px 44px rgba(19,37,42,.2),inset 0 1px rgba(255,255,255,.6); animation:library-room-enter .75s cubic-bezier(.2,.7,.2,1) both; }
    #library-modal .library-lobby-banner img { display:block; width:100%; height:auto; aspect-ratio:16/9; object-fit:cover; object-position:center; transition:transform 1.2s cubic-bezier(.2,.7,.2,1),filter .5s ease; }
    #library-modal .library-lobby-banner:hover img { transform:scale(1.02); filter:saturate(1.04); }
    @media (prefers-reduced-motion:reduce) { #library-modal .library-lobby-banner,#library-modal .library-lobby-banner img { animation:none; transition:none; } }
    #library-modal .library-lobby-banner img { display:block; width:100%; height:auto; aspect-ratio:16/9; object-fit:cover; object-position:center; }
    #library-modal .library-lobby-glow { position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(ellipse at 83% 10%,rgba(209,177,106,.2),transparent 35%),radial-gradient(ellipse at 2% 86%,rgba(51,99,73,.09),transparent 34%); }
    #library-modal .library-modal-header { background:linear-gradient(100deg,#173e32,#0c2d25)!important; border-color:rgba(229,198,130,.22)!important; }
    #library-modal .library-modal-header > div:first-child { color:#faf7ee; }
    #library-modal .library-modal-header > div:first-child i { color:#e8c779!important; }
    #library-modal .library-modal-header > div:nth-child(2) { background:rgba(7,32,25,.45)!important; border:1px solid rgba(255,255,255,.12); }
    #library-modal .library-modal-header #room-tab-spiritual[aria-pressed="true"],#library-modal .library-modal-header #room-tab-academic[aria-pressed="true"] { background:#e8c779!important; color:#172d22!important; }
    #library-modal .library-modal-header #room-tab-spiritual[aria-pressed="false"],#library-modal .library-modal-header #room-tab-academic[aria-pressed="false"] { color:#e5e7eb; }
    #library-modal .library-modal-header #close-library-modal-btn { color:#f5f0e3; }
    #library-modal .library-modal-header #close-library-modal-btn:hover { color:#f4d88e; }
    #library-modal .library-display { font-family:Georgia,"Times New Roman",serif; }
    #library-modal .library-scripture-card { background:linear-gradient(145deg,#173e32 0%,#0c2d25 100%); box-shadow:0 18px 38px rgba(13,45,37,.18); }
    #library-modal .library-room-choice { border:1px solid rgba(73,91,65,.17); background:rgba(255,255,255,.73); box-shadow:0 8px 22px rgba(51,57,42,.055); }
    #library-modal .library-room-choice:hover { border-color:rgba(143,103,42,.4); box-shadow:0 16px 32px rgba(51,57,42,.11); }
    #library-modal #library-room-scene { animation: library-room-enter .55s cubic-bezier(.2,.75,.25,1) both; }
    #library-modal .library-room-shell { background:linear-gradient(145deg,#faf8f1 0%,#f0eadc 100%); }
    #library-modal .library-room-photo { position:relative; min-height:260px; aspect-ratio:16/7; overflow:hidden; border:1px solid rgba(255,255,255,.78); border-radius:1.35rem; background:#183b31; box-shadow:0 24px 60px rgba(15,23,42,.2); }
    #library-modal .library-room-photo.library-modest-reader { width:100%; max-width:none; margin-inline:0; aspect-ratio:16/9; }
    #library-modal .library-room-photo.library-modest-reader img { animation:library-room-reveal 900ms ease-out both; }
    @keyframes library-room-reveal { from { opacity:0; transform:scale(1.035); } to { opacity:1; transform:scale(1); } }
    @media (max-width:640px) { #library-modal .library-room-photo.library-modest-reader { aspect-ratio:4/3; } }
    @media (prefers-reduced-motion:reduce) { #library-modal .library-room-photo.library-modest-reader img { animation:none; } }
    #library-modal .library-room-photo img { display:block; width:100%; height:100%; min-height:260px; object-fit:cover; object-position:center 52%; transition:transform 1.2s cubic-bezier(.2,.7,.2,1),filter .5s ease; }
    #library-modal .library-room-photo:hover img { transform:scale(1.025); filter:saturate(1.06) contrast(1.02); }
    #library-modal .library-photo-fallback:not(.hidden) { display:flex; min-height:inherit; align-items:center; justify-content:center; background:radial-gradient(ellipse at 50% 5%,rgba(244,218,161,.7),transparent 58%),linear-gradient(135deg,#264d3d,#17382f 60%,#392c1e); color:#fff; text-align:center; }
    #library-modal .library-photo-caption { position:absolute; z-index:2; left:clamp(1rem,3vw,2rem); right:clamp(1rem,3vw,2rem); bottom:clamp(1rem,3vw,1.7rem); display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:.75rem; color:#fff; text-shadow:0 2px 14px rgba(0,0,0,.3); }
    #library-modal .library-room-photo::after { content:""; position:absolute; inset:30% 0 0; background:linear-gradient(180deg,transparent 0%,rgba(7,19,24,.75) 100%); pointer-events:none; }
    #library-modal .library-book-card { position:relative; isolation:isolate; border:1px solid #e5e7eb; background:linear-gradient(145deg,#fff 0%,#fcfbf7 100%); box-shadow:0 8px 22px rgba(25,45,55,.07); transition:transform .24s ease,box-shadow .24s ease,border-color .24s ease; }
    #library-modal .library-book-card:hover { transform:translateY(-4px); border-color:#93c5b9; box-shadow:0 18px 38px rgba(22,68,68,.15); }
    #library-modal .library-book-card img { transition:transform .28s ease; }
    #library-modal .library-book-card:hover img { transform:rotate(-2deg) scale(1.035); }
    #library-modal .library-collection-card { border:1px solid rgba(91,65,33,.14); background:linear-gradient(145deg,#fffdf8,#f8f5eb); box-shadow:0 12px 28px rgba(44,51,37,.065); }
    #library-modal .library-study-card { border:1px solid rgba(38,72,54,.1); background:rgba(255,255,255,.68); box-shadow:0 5px 16px rgba(44,51,37,.04); }
    #library-modal .library-cover { background:linear-gradient(150deg,#174638,#0d2e26 68%,#805c2a); }
    #library-modal .library-book-spine { position:relative; overflow:hidden; border-radius:5px 5px 2px 2px; box-shadow:inset 3px 0 5px rgba(0,0,0,.2),inset -2px 0 4px rgba(255,255,255,.18),0 5px 10px rgba(0,0,0,.25); transition:transform .2s ease,filter .2s ease; }
    #library-modal .library-book-spine::after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(110deg,transparent 15%,rgba(255,255,255,.2) 45%,transparent 60%); transform:translateX(-120%); transition:transform .45s ease; }
    #library-modal .library-book-spine:hover::after { transform:translateX(120%); }
    #library-modal .library-bookshelf { position:relative; isolation:isolate; overflow:hidden; }    #library-modal .library-modern-shelf { position:relative; overflow:hidden; border:1px solid rgba(46,82,66,.14); background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(245,248,243,.92)); box-shadow:0 16px 40px rgba(28,54,45,.08); }
    #library-modal .library-modern-shelf-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr)); gap:.85rem; }
    #library-modal .library-shelf-choice { isolation:isolate; overflow:hidden; border-color:rgba(32,76,59,.13); background:linear-gradient(145deg,#fff 0%,#f6f8f3 100%); box-shadow:0 7px 20px rgba(23,54,44,.07); }
    #library-modal .library-shelf-choice::before { content:""; position:absolute; z-index:-1; inset:0; opacity:0; background:radial-gradient(circle at 100% 0%,color-mix(in srgb,var(--shelf-accent) 22%,transparent),transparent 55%); transition:opacity .25s ease; }
    #library-modal .library-shelf-choice:hover { transform:translateY(-5px) scale(1.012); border-color:rgba(30,105,79,.36); box-shadow:0 18px 34px rgba(23,54,44,.14); }
    #library-modal .library-shelf-choice:hover::before,#library-modal .library-shelf-choice[aria-pressed="true"]::before { opacity:1; }
    #library-modal .library-shelf-choice[aria-pressed="true"] { border-color:#28715a; box-shadow:0 0 0 2px rgba(40,113,90,.14),0 16px 32px rgba(23,54,44,.13); }
    #library-modal .library-shelf-choice-icon { display:inline-flex; width:2.5rem; height:2.5rem; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,.78); border-radius:.9rem; background:linear-gradient(145deg,color-mix(in srgb,var(--shelf-accent) 88%,white),var(--shelf-accent)); color:#fff; font-size:1.05rem; box-shadow:0 7px 14px color-mix(in srgb,var(--shelf-accent) 25%,transparent); }
    #library-modal .library-shelf-choice-arrow { display:inline-flex; width:2rem; height:2rem; align-items:center; justify-content:center; border-radius:999px; background:rgba(15,65,48,.06); color:#315d4d; font-size:.72rem; transition:transform .25s ease,background .25s ease; }
    #library-modal .library-shelf-choice:hover .library-shelf-choice-arrow { transform:translate(2px,-2px); background:rgba(15,65,48,.12); }
    #library-modal .library-shelf-choice-action { opacity:.7; transition:opacity .2s ease; }
    #library-modal .library-shelf-choice:hover .library-shelf-choice-action,#library-modal .library-shelf-choice[aria-pressed="true"] .library-shelf-choice-action { opacity:1; }
    #library-modal .library-bookshelf::before { content:""; position:absolute; z-index:-1; inset:0; opacity:.3; background:repeating-linear-gradient(90deg,transparent 0 18px,rgba(255,236,190,.12) 19px 20px,transparent 21px 40px),linear-gradient(180deg,rgba(255,255,255,.06),transparent 55%); }
    #library-modal .library-shelf-footer { height:9px; border-radius:2px; background:linear-gradient(180deg,rgba(255,224,170,.42),rgba(0,0,0,.3)); box-shadow:0 7px 12px rgba(0,0,0,.24); }
    #library-modal .library-resource-card { border:1px solid rgba(226,232,240,.9); background:linear-gradient(135deg,#fff 0%,#f7faf9 100%); box-shadow:0 7px 20px rgba(15,23,42,.045); transition:transform .2s ease,box-shadow .2s ease; }
    #library-modal .library-resource-card:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(15,23,42,.09); }
    @keyframes library-room-enter { from { opacity:0; transform:translateY(12px) scale(.99); } to { opacity:1; transform:translateY(0) scale(1); } }
    @media (max-width:640px) { #library-modal .library-room-photo { min-height:220px; aspect-ratio:4/3; } #library-modal .library-room-photo img { min-height:220px; object-position:center 44%; } }
    @media (prefers-reduced-motion: reduce) { #library-modal #library-room-scene { animation:none; } #library-modal .library-book-card,#library-modal .library-resource-card,#library-modal .library-room-photo img,#library-modal .library-room-choice { transition:none; } }
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
    roomScene?.querySelectorAll("[data-shelf-kind]").forEach(button => {
      const kind = button.dataset.shelfKind;
      const selected = kind === "spiritual"
        ? activeRoom === "spiritual" && button.dataset.shelfId === activeSpiritualCategory && activeSpiritualCategory !== "all"
        : kind === "stream"
          ? activeRoom === "academic" && currentLevel === "freshman" && button.dataset.shelfId === currentStream
          : activeRoom === "academic" && currentLevel !== "freshman" && button.dataset.shelfId === currentDept;
      button.setAttribute("aria-pressed", String(selected));
    });    if (departmentSelect && departmentSelect.value !== currentDept) departmentSelect.value = currentDept;
  }

  function renderRoomScene(room) {
    const palettes = ["#9f3b24", "#d59a32", "#246b65", "#344b76", "#7a3e68", "#566b3c", "#9a683b", "#254e59"];
    const makeSpines = (items, kind) => items.map((item, index) => {
      const id = item.id || item.key || String(index);
      const label = item.name || item.title || "Book collection";
      const action = kind === "spiritual"
        ? `data-shelf-kind="spiritual" data-shelf-id="${escapeHTML(id)}"`
        : kind === "department"
          ? `data-shelf-kind="department" data-shelf-id="${escapeHTML(id)}"`
          : `data-shelf-kind="stream" data-shelf-id="${escapeHTML(id)}"`;
      const eyebrow = kind === "spiritual" ? "Spiritual collection" : kind === "department" ? "Academic department" : "Freshman stream";
      const detail = kind === "spiritual"
        ? (item.description || "Explore books and resources in this collection.")
        : kind === "department"
          ? (item.group || "Explore courses and study materials.")
          : "Explore courses and study materials.";
      const itemCount = kind === "spiritual" ? (item.pdfs || []).length : (item.courses || []).length;
      const itemLabel = kind === "spiritual" ? "resources" : "courses";
      const icon = kind === "spiritual" ? (item.icon || "fa-book-bible") : kind === "department" ? "fa-building-columns" : "fa-graduation-cap";
      const accent = palettes[index % palettes.length];
      return `
        <button type="button" ${action} aria-pressed="false" aria-label="Open ${escapeHTML(label)} ${kind === "spiritual" ? "collection" : "study section"}" title="${escapeHTML(label)}"
          class="library-shelf-choice group relative flex min-h-40 w-full flex-col rounded-2xl border p-4 text-left transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          style="--shelf-accent:${accent}">
          <span class="flex items-start justify-between gap-3">
            <span class="library-shelf-choice-icon"><i class="fa-solid ${escapeHTML(icon)}" aria-hidden="true"></i></span>
            <span class="library-shelf-choice-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
          </span>
          <span class="mt-4 block text-[9px] font-extrabold uppercase tracking-[.16em] text-emerald-800">${escapeHTML(eyebrow)}</span>
          <span class="mt-1 block text-sm font-extrabold leading-snug text-slate-900">${escapeHTML(label)}</span>
          <span class="mt-1 line-clamp-2 block text-[11px] leading-5 text-slate-600">${escapeHTML(detail)}</span>
          <span class="mt-auto flex items-center justify-between gap-2 pt-3 text-[10px] font-bold text-emerald-900"><span>${itemCount} ${itemLabel}</span><span class="library-shelf-choice-action">Explore <i class="fa-solid fa-arrow-right ml-1" aria-hidden="true"></i></span></span>
        </button>
      `;
    }).join("");

    if (room === "spiritual") {
      roomScene.innerHTML = `
        <section class="library-room-shell relative isolate overflow-hidden rounded-3xl border border-amber-950/10 p-4 shadow-inner sm:p-7">
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p class="text-[9px] font-extrabold uppercase tracking-[.2em] text-amber-800">Apostolic fellowship · shared reading</p><h2 class="library-display mt-1 text-2xl font-semibold text-emerald-950 sm:text-3xl">A Place to Read, Reflect, and Grow</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-700">Settle into a peaceful reading room. Study the Word, explore trusted spiritual literature, and grow alongside others.</p></div>
            <span class="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-emerald-950/10 bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-950"><i class="fa-solid fa-book-bible text-amber-800" aria-hidden="true"></i> Quiet reading room</span>
          </div>
          <figure class="library-room-photo library-modest-reader mb-6" aria-label="Students reading and studying the Bible together outdoors">
            <img data-library-photo src="./assets/apostolic-library-spiritual-room.jpg" alt="A group of students reading Bibles together in a peaceful green outdoor setting" loading="lazy">
            <div class="library-photo-fallback" data-library-photo-fallback aria-hidden="true"><div class="px-6"><i class="fa-solid fa-book-open-reader text-3xl text-amber-200" aria-hidden="true"></i><p class="library-display mt-3 text-xl">A quiet place for reading and reflection</p><p class="mt-2 text-xs text-white/75">The reading-room photograph could not be loaded.</p></div></div>
            <figcaption class="library-photo-caption"><span><span class="block text-[9px] font-extrabold uppercase tracking-[.2em] text-amber-200">Scripture · fellowship · wisdom</span><span class="library-display mt-1 block text-xl font-semibold sm:text-2xl">Read. Reflect. Grow.</span></span><span class="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-[11px] font-semibold backdrop-blur"><i class="fa-solid fa-leaf mr-1 text-emerald-200" aria-hidden="true"></i>Room to reflect</span><span class="text-[10px] text-white/80">Spiritual Room</span></figcaption>
          </figure>
          <aside class="mb-6 rounded-2xl border border-amber-900/10 bg-white/75 p-5 sm:p-6">
            <p class="text-[9px] font-extrabold uppercase tracking-[.2em] text-amber-800">A blessing for your study</p>
            <p class="library-display mt-2 text-base leading-7 text-emerald-950 sm:text-lg">“May God bless your reading, strengthen your understanding, guard your heart, and grant you wisdom. May He bless your mind as you study, guide you into truth, and help you use the knowledge you gain to serve Him and others.”</p>
          </aside>
          <section aria-labelledby="library-study-purpose-title" class="mb-7">
            <div class="mb-3"><p class="text-[9px] font-extrabold uppercase tracking-[.2em] text-amber-800">A thoughtful rhythm</p><h3 id="library-study-purpose-title" class="library-display mt-1 text-xl font-semibold text-emerald-950">How to Study with Purpose</h3></div>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              ${[
                ["fa-hands-praying", "Begin with prayer", "Ask God for humility, wisdom, and a receptive heart."],
                ["fa-book-open", "Read in context", "Notice the passage, its setting, and the surrounding chapter."],
                ["fa-pen", "Take thoughtful notes", "Write down questions, key ideas, and what stands out."],
                ["fa-scale-balanced", "Compare passages", "Let related Scriptures help clarify what you are reading."],
                ["fa-seedling", "Apply what you learn", "Choose a faithful, practical way to live out the truth."],
                ["fa-rotate", "Review consistently", "Return to your notes and build a steady study rhythm."]
              ].map(([icon, title, text]) => `<article class="library-study-card rounded-xl p-3.5"><span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 text-sm text-amber-200"><i class="fa-solid ${icon}" aria-hidden="true"></i></span><h4 class="mt-2 text-xs font-extrabold text-emerald-950">${title}</h4><p class="mt-1 text-[11px] leading-5 text-slate-600">${text}</p></article>`).join("")}
            </div>
          </section>
          <div class="library-modern-shelf rounded-2xl p-4 sm:p-5">
            <div class="mb-4 flex flex-wrap items-end justify-between gap-2"><span><span class="block text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-800">Discover by subject</span><span class="library-display mt-1 block text-lg font-semibold text-emerald-950">Spiritual collections</span></span><span class="text-[11px] text-slate-500">Choose a card to filter the books below</span></div>
            <div class="library-modern-shelf-grid">${makeSpines(spiritualCategories, "spiritual")}</div>
          </div>
        </section>
      `;
      bindLibraryPhotoFallback(roomScene);
      return;
    }

    const streamItems = Object.entries(freshmanStreams).map(([id, item]) => ({ id, name: item.name }));
    roomScene.innerHTML = `
      <section class="library-room-shell relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 p-4 shadow-inner sm:p-7">
        <div aria-hidden="true" class="absolute inset-0 -z-10 opacity-50" style="background:radial-gradient(ellipse at 80% 0%,rgba(255,255,255,.95),transparent 52%),linear-gradient(180deg,transparent 72%,rgba(30,64,100,.12))"></div>
        <figure class="library-room-photo mb-6">
          <img data-library-photo src="./assets/apostolic-library-academic-room.jpg" alt="Students studying Scripture and books together at wooden tables in a bright library" loading="lazy">
          <div class="library-photo-fallback" data-library-photo-fallback aria-hidden="true"><div class="px-6"><i class="fa-solid fa-book-open-reader text-3xl text-amber-200" aria-hidden="true"></i><p class="library-display mt-3 text-xl">A quiet room for learning</p><p class="mt-2 text-xs text-white/75">The reading-room photograph could not be loaded.</p></div></div>
          <figcaption class="library-photo-caption"><span><span class="block text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-200">University study · books & discovery</span><span class="mt-1 block text-lg font-black sm:text-2xl">Find your next idea.</span></span><span class="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-[11px] font-bold backdrop-blur"><i class="fa-solid fa-glass-water mr-1 text-sky-200"></i>Fresh water · open-air comfort</span><span class="text-[10px] text-white/80">Academic Room</span></figcaption>
        </figure>
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p class="text-[10px] font-extrabold uppercase tracking-[.2em] text-sky-800">University study room · Knowledge & discovery</p><h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Welcome to the Apostolic Academic Digital Library</h2><p class="mt-2 max-w-3xl text-xs leading-5 text-slate-700 sm:text-sm">A place for university students to explore knowledge, strengthen academic foundations, and find learning resources for their studies.</p></div>
          <div class="flex shrink-0 items-center gap-2 rounded-2xl border border-sky-200 bg-white/75 px-4 py-3 text-xs font-semibold text-sky-950"><i class="fa-solid fa-graduation-cap text-sky-700"></i> Study collections</div>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="library-modern-shelf rounded-2xl p-4 sm:p-5">
            <div class="mb-4 flex flex-wrap items-end justify-between gap-2"><span><span class="block text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-800">Start here</span><span class="mt-1 block text-base font-extrabold text-slate-900">Freshman course streams</span></span><span class="text-[11px] text-slate-500">Choose your study stream</span></div>
            <div class="library-modern-shelf-grid">${makeSpines(streamItems, "stream")}</div>
          </div>
          <div class="library-modern-shelf rounded-2xl p-4 sm:p-5">
            <div class="mb-4 flex flex-wrap items-end justify-between gap-2"><span><span class="block text-[9px] font-extrabold uppercase tracking-[.18em] text-emerald-800">Explore your field</span><span class="mt-1 block text-base font-extrabold text-slate-900">Academic departments</span></span><span class="text-[11px] text-slate-500">Choose a department</span></div>
            <div class="library-modern-shelf-grid">${makeSpines(seniorDepartments, "department")}</div>
          </div>
        </div>
        <p class="mt-3 text-[10px] text-slate-600"><i class="fa-solid fa-laptop mr-1"></i> Course shelves open your existing academic hub; verified digital books will appear as catalog sources are connected.</p>
      </section>
    `;
    bindLibraryPhotoFallback(roomScene);
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

  function closeLibraryModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    returnToLobby();
    if (modal.__libraryReturnFocus instanceof HTMLElement) modal.__libraryReturnFocus.focus();
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
  closeButton?.addEventListener("click", closeLibraryModal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeLibraryModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) closeLibraryModal();
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

export function renderLibrarySection(displayName = "") {
  const modal = document.getElementById("library-modal");
  if (!modal) {
    console.warn("Cannot open the Apostolic Library: #library-modal was not found in index.html.");
    return;
  }
  modal.__libraryReturnFocus = document.activeElement;
  setupLibraryModal();
  const welcome = modal.querySelector("#library-welcome-name");
  const name = String(displayName || "").trim();
  if (welcome) welcome.textContent = name ? `Welcome, ${name}` : "Welcome to the library";
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("overflow-hidden");
  document.getElementById("close-library-modal-btn")?.focus();
}
