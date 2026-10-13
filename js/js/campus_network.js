// js/campus_network.js - Campus Network Directory & Chapter Detail Service

export const campusNetworkData = [
  {
    id: "aau",
    name: "Addis Ababa University (AAU)",
    region: "Addis Ababa",
    campuses: ["Sidist Kilo", "Arat Kilo", "Amst Kilo", "FBE / Commerce"],
    leader: "Yonas Tadesse",
    contact: "@yonas_ace",
    phone: "+251 91 123 4567",
    meetingTime: "Every Friday @ 5:00 Local Time (11:00 PM UTC)",
    location: "Sidist Kilo Main Student Hall & Fellowship Room",
    status: "Active Fellowship",
    studentCount: "350+ Active Students",
    prayerSchedule: "Wednesdays & Fridays @ 11:30 - 12:30 Local Time",
    description: "The AAU Apostolic Students Fellowship serves students across all main campuses in Addis Ababa with weekly worship, Bible study, and academic mentorship."
  },
  {
    id: "astu",
    name: "Adama Science and Technology University (ASTU)",
    region: "Oromia",
    campuses: ["Main Campus (Adama)"],
    leader: "Ephrem Kebede",
    contact: "@ephrem_astu",
    phone: "+251 92 234 5678",
    meetingTime: "Every Thursday @ 11:00 Local Time",
    location: "Block 102 Student Christian Union Hall",
    status: "Active Fellowship",
    studentCount: "220+ Active Students",
    prayerSchedule: "Tuesdays & Thursdays @ 12:00 Local Time",
    description: "ASTU Fellowship brings together engineering and science students for weekly spiritual growth, mentorship, and weekend outreach programs."
  },
  {
    id: "hu",
    name: "Hawassa University",
    region: "Sidama",
    campuses: ["Main Campus (Tulla)", "Medicine & Health Sciences"],
    leader: "Bethlehem Worku",
    contact: "@bethy_hu",
    phone: "+251 93 345 6789",
    meetingTime: "Every Saturday @ 9:00 Local Time",
    status: "Active Fellowship",
    studentCount: "280+ Active Students",
    prayerSchedule: "Mondays & Fridays @ 11:30 Local Time",
    description: "Serving Hawassa University students across medical and technology faculties with regular worship sessions and campus community projects."
  },
  {
    id: "ju",
    name: "Jimma University",
    region: "Oromia",
    campuses: ["Main Campus", "Agro-Campus", "Kito Furdisa"],
    leader: "Kaleab Mamo",
    contact: "@kaleab_ju",
    phone: "+251 94 456 7890",
    meetingTime: "Every Friday @ 10:00 Local Time",
    status: "Active Fellowship",
    studentCount: "200+ Active Students",
    prayerSchedule: "Wednesdays @ 12:00 Local Time",
    description: "Connecting students across Jimma University campuses through regular Bible study, choir ministry, and prayer networks."
  },
  {
    id: "ddu",
    name: "Dire Dawa University",
    region: "Dire Dawa",
    campuses: ["Main Campus"],
    leader: "Hanna Samuel",
    contact: "@mise100",
    phone: "+251 91 607 2727",
    meetingTime: "Every Thursday @ 12:00 Local Time",
    status: "Active Fellowship",
    studentCount: "150+ Active Students",
    prayerSchedule: "friday @ 11:00 Local Time",
    description: "A vibrant fellowship community serving Dire Dawa University students with continuous prayer gatherings and peer support."
  },
  {
    id: "bdu",
    name: "Bahir Dar University",
    region: "Amhara",
    campuses: ["Poly Campus", "Bitew Dagnaw", "Peda Campus"],
    leader: "Dawit Alemu",
    contact: "@dawit_bdu",
    phone: "+251 96 678 9012",
    meetingTime: "Every Saturday @ 10:00 Local Time",
    status: "Active Fellowship",
    studentCount: "240+ Active Students",
    prayerSchedule: "Wednesdays & Saturdays @ 11:00 Local Time",
    description: "Bahir Dar University chapter unites students across all university institutes for fellowship, teaching, and spiritual empowerment."
  }
];

/**
 * Render main network grid
 */
export function renderCampusNetwork(container, regionFilter = "all", searchQuery = "") {
  if (!container) return;

  const filtered = campusNetworkData.filter(item => {
    const matchesRegion = regionFilter === "all" || item.region.toLowerCase() === regionFilter.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                          item.region.toLowerCase().includes(searchQuery) ||
                          item.campuses.some(c => c.toLowerCase().includes(searchQuery));
    return matchesRegion && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-university text-3xl mb-2 text-teal-700/50"></i>
        <p class="font-bold text-sm">No campus network found matching your search.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(campus => `
    <div class="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-teal-300 transition flex flex-col justify-between space-y-4">
      <div>
        <div class="flex justify-between items-start mb-2">
          <span class="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            ${campus.region} Region
          </span>
          <span class="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
            <i class="fa-solid fa-circle text-[6px] text-teal-600 mr-1"></i> ${campus.status}
          </span>
        </div>
        <h3 class="text-base font-bold text-slate-900">${campus.name}</h3>
        <p class="text-xs text-gray-600 mt-1">
          <i class="fa-solid fa-location-dot text-teal-700 mr-1"></i> Campuses: ${campus.campuses.join(", ")}
        </p>
      </div>

      <div class="space-y-2 pt-3 border-t border-gray-100 text-xs">
        <div class="flex justify-between text-gray-700">
          <span class="font-semibold text-gray-500">Fellowship Leader:</span>
          <span class="font-bold">${campus.leader}</span>
        </div>
        <div class="flex justify-between text-gray-700">
          <span class="font-semibold text-gray-500">Gathering Time:</span>
          <span class="font-bold text-teal-900">${campus.meetingTime}</span>
        </div>
      </div>

      <button 
        type="button" 
        data-campus-id="${campus.id}"
        class="open-campus-modal-btn w-full py-2 rounded-xl bg-teal-800 text-amber-400 font-bold text-xs hover:bg-teal-900 transition shadow-xs flex items-center justify-center gap-1.5"
      >
        <i class="fa-solid fa-circle-info"></i> View Chapter Details
      </button>
    </div>
  `).join("");
}

/**
 * Render modal details for a specific campus
 */
export function renderCampusDetailModal(campusId, container) {
  if (!container) return;

  const campus = campusNetworkData.find(c => c.id === campusId) || campusNetworkData[0];

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header Banner -->
      <div class="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-2xl space-y-2">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-md">
            ${campus.region} Region
          </span>
          <span class="text-xs text-teal-300 font-semibold"><i class="fa-solid fa-users text-amber-400 mr-1"></i> ${campus.studentCount}</span>
        </div>
        <h2 class="text-xl font-extrabold text-amber-400">${campus.name}</h2>
        <p class="text-xs text-slate-300">${campus.description}</p>
      </div>

      <!-- Quick Info Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
          <div class="flex items-center gap-2 text-teal-800 font-bold text-xs">
            <i class="fa-solid fa-user-shield"></i> Fellowship Leader
          </div>
          <p class="text-xs font-extrabold text-slate-900">${campus.leader}</p>
          <p class="text-[11px] text-gray-500">Telegram: <span class="font-semibold text-teal-700">${campus.contact}</span></p>
          <p class="text-[11px] text-gray-500">Phone: <span class="font-semibold text-slate-700">${campus.phone}</span></p>
        </div>

        <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
          <div class="flex items-center gap-2 text-teal-800 font-bold text-xs">
            <i class="fa-solid fa-clock"></i> Weekly Gathering
          </div>
          <p class="text-xs font-bold text-slate-900">${campus.meetingTime}</p>
          <p class="text-[11px] text-gray-500"><i class="fa-solid fa-map-pin text-amber-600 mr-1"></i> ${campus.location}</p>
        </div>

        <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
          <div class="flex items-center gap-2 text-teal-800 font-bold text-xs">
            <i class="fa-solid fa-hands-praying"></i> Prayer Schedule
          </div>
          <p class="text-xs font-bold text-slate-800">${campus.prayerSchedule}</p>
        </div>

        <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
          <div class="flex items-center gap-2 text-teal-800 font-bold text-xs">
            <i class="fa-solid fa-layer-group"></i> Active Sub-Campuses
          </div>
          <p class="text-xs font-semibold text-slate-700">${campus.campuses.join(" • ")}</p>
        </div>

      </div>

      <!-- Action Footer -->
      <div class="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
        <a 
          href="https://t.me/${campus.contact.replace('@','')}" 
          target="_blank"
          class="flex-1 py-2.5 rounded-xl bg-teal-800 text-amber-400 font-bold text-xs text-center hover:bg-teal-900 transition flex items-center justify-center gap-2 shadow-xs"
        >
          <i class="fa-brands fa-telegram text-sm"></i> Join Chapter Telegram Group
        </a>
      </div>
    </div>
  `;
}