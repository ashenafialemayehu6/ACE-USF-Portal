// js/library_service.js - Interactive Library UI Renderer

import { spiritualCategories, freshmanStreams, seniorDepartments } from "./academic_data.js";

/**
 * Render Spiritual Room Sub-Categories & PDF Lists
 */
export function renderSpiritualRoom(container, activeSubCategoryId = "all", searchQuery = "") {
  if (!container) return;

  // Filter categories by pill selection & search query
  const filteredCategories = spiritualCategories.map(cat => {
    const matchesCategory = activeSubCategoryId === "all" || cat.id === activeSubCategoryId;
    const matchingPdfs = cat.pdfs.filter(pdf => 
      pdf.title.toLowerCase().includes(searchQuery) ||
      pdf.author.toLowerCase().includes(searchQuery)
    );
    return { ...cat, matchingPdfs, matchesCategory };
  }).filter(cat => cat.matchesCategory && (searchQuery === "" || cat.matchingPdfs.length > 0));

  let html = `
    <!-- Sub-Room Filter Pills -->
    <div class="flex flex-wrap gap-1.5 pb-2 border-b border-gray-200 overflow-x-auto">
      <button type="button" class="sp-cat-pill px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 ${activeSubCategoryId === 'all' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}" data-cat="all">
        ✨ All Sub-Rooms
      </button>
  `;

  spiritualCategories.forEach(cat => {
    const isActive = activeSubCategoryId === cat.id;
    html += `
      <button type="button" class="sp-cat-pill px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 ${isActive ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}" data-cat="${cat.id}">
        <i class="fa-solid ${cat.icon} mr-1"></i> ${cat.name}
      </button>
    `;
  });

  html += `</div> <div class="grid grid-cols-1 gap-3 pt-2">`;

  if (filteredCategories.length === 0) {
    container.innerHTML = html + `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-book-open text-2xl text-gray-300 mb-2"></i>
        <p class="text-xs font-semibold">No spiritual materials found matching your search.</p>
      </div></div>`;
    return;
  }

  filteredCategories.forEach(cat => {
    const pdfsToDisplay = searchQuery ? cat.matchingPdfs : cat.pdfs;

    html += `
      <div class="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 hover:border-amber-400 transition">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
              <i class="fa-solid ${cat.icon}"></i>
            </div>
            <div>
              <h4 class="text-xs font-extrabold text-slate-900">${cat.name}</h4>
              <p class="text-[10px] text-gray-500 line-clamp-1">${cat.description}</p>
            </div>
          </div>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${cat.badgeColor} shrink-0">
            ${pdfsToDisplay.length} PDFs
          </span>
        </div>

        <div class="grid grid-cols-1 gap-2 pt-1">
          ${pdfsToDisplay.map(pdf => `
            <div class="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-100 hover:border-amber-300 transition gap-2">
              <div class="min-w-0">
                <h5 class="text-xs font-bold text-slate-800 truncate"><i class="fa-solid fa-file-pdf text-red-600 mr-1.5"></i>${pdf.title}</h5>
                <p class="text-[10px] text-gray-400">By ${pdf.author} • ${pdf.size} •${pdf.downloads} downloads</p>
              </div>
              <button onclick="alert('Downloading: ${pdf.title}')" class="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-xs">
                <i class="fa-solid fa-download"></i> PDF
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render Academic Room Materials & Senior Advice
 */
export function renderAcademicRoom({ level, stream = "natural", deptId = "med", searchQuery = "", container }) {
  if (!container) return;

  let html = "";

  if (level === "freshman") {
    const data = freshmanStreams[stream] || freshmanStreams.natural;
    const matchingCourses = data.courses.filter(c => c.toLowerCase().includes(searchQuery));

    html += `
      <!-- Senior Advice Section -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
        <h4 class="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
          <i class="fa-solid fa-lightbulb text-amber-600"></i> Senior Advice for Freshman (${data.name})
        </h4>
        <div class="space-y-2">
          ${data.advices.map(adv => `
            <div class="bg-white p-3 rounded-xl border border-amber-100 text-[11px] text-slate-700">
              <p class="italic">"${adv.text}"</p>
              <p class="text-[10px] font-bold text-teal-800 mt-1">— ${adv.author}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Course Modules -->
      <div class="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-2">
        <h4 class="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <i class="fa-solid fa-book text-teal-800"></i> Course Modules & Exam Preparation
        </h4>
        <div class="grid grid-cols-1 gap-2 pt-1">
          ${matchingCourses.length === 0 ? `
            <p class="text-xs text-gray-500 py-3 text-center">No courses match your search.</p>
          ` : matchingCourses.map(course => `
            <div class="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-100 hover:border-teal-300 transition gap-2">
              <span class="text-xs font-bold text-slate-800 truncate"><i class="fa-solid fa-file-pdf text-red-600 mr-2"></i>${course}</span>
              <button onclick="alert('Downloading course module for: ${course}')" class="shrink-0 text-[10px] bg-teal-800 text-amber-400 font-bold px-2.5 py-1 rounded-lg hover:bg-teal-900 transition">
                <i class="fa-solid fa-download"></i> PDF
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (level === "senior" || level === "alumni") {
    const dept = seniorDepartments.find(d => d.id === deptId) || seniorDepartments[0];
    const matchingCourses = dept.courses.filter(c => c.toLowerCase().includes(searchQuery));

    html += `
      <!-- Senior Mentorship Advice -->
      <div class="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
        <h4 class="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
          <i class="fa-solid fa-graduation-cap text-purple-700"></i> Exit Exam & Mentorship Guidance (${dept.name})
        </h4>
        <div class="space-y-2">
          ${dept.advices.map(adv => `
            <div class="bg-white p-3 rounded-xl border border-purple-100 text-[11px] text-slate-700">
              <p class="italic">"${adv.text}"</p>
              <p class="text-[10px] font-bold text-purple-900 mt-1">— ${adv.author}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Department Modules & Exit Exam Prep -->
      <div class="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-2">
        <h4 class="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <i class="fa-solid fa-folder-open text-teal-800"></i> Core Courses & National Exit Exam Materials
        </h4>
        <div class="grid grid-cols-1 gap-2 pt-1">
          ${matchingCourses.length === 0 ? `
            <p class="text-xs text-gray-500 py-3 text-center">No materials match your search.</p>
          ` : matchingCourses.map(course => `
            <div class="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-100 hover:border-teal-300 transition gap-2">
              <span class="text-xs font-bold text-slate-800 truncate"><i class="fa-solid fa-file-lines text-teal-700 mr-2"></i>${course}</span>
              <button onclick="alert('Downloading study material for: ${course}')" class="shrink-0 text-[10px] bg-teal-800 text-amber-400 font-bold px-2.5 py-1 rounded-lg hover:bg-teal-900 transition">
                <i class="fa-solid fa-download"></i> Download
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}