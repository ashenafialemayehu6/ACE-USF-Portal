// js/app.js - Master Interactive Controller for ACE-USF Portal
import { renderHomeSection } from './home_service.js';
import { renderCampusNetworkSection } from './campus_network.js';
import { initWeatherWidget, fetchCampusWeather } from "./weather_service.js";
import { renderChurchList } from "./church_locator.js";
import { populateInstitutionSelect } from "./institutions.js";
import { populateDepartmentSelect } from "./academic_data.js";
import { renderLibrarySection, setupLibraryModal } from "./library_service.js";
import { renderFellowshipLeadersSection, setupFellowshipLeadersSection } from "./fellowship_leaders.js";
// Database store for registered accounts
const userDatabase = new Map();

let currentUser = null;
let currentLanguage = "en";

// Amharic Translation Dictionary
const i18n = {
  en: {
    home: "Home",
    network: "Campus Network",
    library: "Apostolic Library",
    signIn: "Sign In",
    heroTitle: "Apostolic Church of Ethiopia University Students Fellowship",
    heroDesc: "Uniting and empowering Apostolic students across public and private universities and colleges in Ethiopia through pastoral teachings, spiritual literature, worship networks, and mentorship."
  },
  am: {
    home: "ዋና ገጽ",
    network: "የካምፓስ አውታረ መረብ",
    library: "ሐዋርያዊ ቤተ-መጻሕፍት",
    signIn: "ግባ / ተመዝገብ",
    heroTitle: "የኢትዮጵያ ሐዋርያዊት ቤተ ክርስቲያን የዩኒቨርሲቲ ተማሪዎች ሕብረት",
    heroDesc: "በኢትዮጵያ ውስጥ በሚገኙ ከፍተኛ ትምህርት ተቋማት የሚማሩ ሐዋርያውያን ተማሪዎችን መንፈሳዊ እድገት፣ አምልኮ እና ትምህርት የሚያስተናድድ ማህበረሰብ።"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 ACE-USF Portal Controller Active...");

  // Helper for safe module initialization
  const safeInit = (name, fn) => {
    try {
      if (typeof fn === "function") {
        fn();
      }
    } catch (err) {
      console.warn(`⚠️ [Module Warning]: ${name} failed to initialize.`, err.message);
    }
  };

  // 1. Initial Load (Render Home Section)
  safeInit("Initial Home Render", () => {
    if (typeof renderHomeSection === "function") {
      renderHomeSection("app-dashboard");
    }
  });

  // 2. Home Navigation Click Binding
  const homeBtn = document.getElementById("nav-home");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("📍 Navigation: Home clicked");
      safeInit("Render Home", () => {
        if (typeof renderHomeSection === "function") {
          renderHomeSection("app-dashboard");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  // Delegate section navigation so links rendered later inside dynamic sections work too.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a, button");
    if (!link) return;

    if (link.matches("a[href='#ace-about-section'], a[href='#about-section']")) {
      const template = document.getElementById("ace-about-template");
      const dashboard = document.getElementById("app-dashboard");
      if (template && dashboard) {
        event.preventDefault();
        dashboard.replaceChildren(template.content.cloneNode(true));
        window.requestAnimationFrame(() => {
          const aboutSection = document.getElementById("ace-about-section");
          const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
          aboutSection?.scrollIntoView({ behavior, block: "start" });
        });
      }
      return;
    }

    if (link.matches("#nav-campus-network, a[href='#campus-network']")) {
      event.preventDefault();
      renderCampusNetworkSection("app-dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (link.matches("a[href='#hubs-section']")) {
      event.preventDefault();
      renderFellowshipLeadersSection();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (link.matches(".lang-text-library, a[href='#apostolic-library']")) {
      event.preventDefault();
      renderLibrarySection();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (link.matches("[data-about-action='join']")) {
      document.getElementById("auth-btn")?.click();
    }
  });
  // 4. Dropdowns & Select Initializers
  safeInit("Institution Dropdowns", () => {
    if (typeof populateInstitutionSelect === "function") {
      populateInstitutionSelect("modal-reg-campus", "Choose your university or college...");
      populateInstitutionSelect("locator-campus-select", "Filter church locator by campus...");
      populateInstitutionSelect("weather-uni-select", "Select campus city for weather...");
    }
  });

  safeInit("Academic Departments", () => {
    if (typeof populateDepartmentSelect === "function") {
      populateDepartmentSelect("library-dept-select");
    }
  });

  // 5. Feature Initializers (Isolated Execution)
  safeInit("Weather Service", setupWeatherService);
  safeInit("Language Switcher", setupLanguageSwitcher);
  safeInit("Auth Modal", setupAuthModal);
  safeInit("User Dropdown", setupUserDropdownToggle);
  safeInit("Church Locator", setupChurchLocatorModal);
  safeInit("Forum Feed", setupForumFeed);
  safeInit("Library Modal", setupLibraryModal);
  safeInit("Fellowship Leaders Network", setupFellowshipLeadersSection);
});

/**
 * Weather Service Controller
 */
function setupWeatherService() {
  const weatherSelect = document.getElementById("weather-uni-select");

  try {
    if (typeof initWeatherWidget === "function") {
      initWeatherWidget();
    }
  } catch (err) {
    console.warn("Weather widget warning:", err.message);
  }

  if (weatherSelect) {
    weatherSelect.addEventListener("change", (e) => {
      if (typeof fetchCampusWeather === "function") {
        fetchCampusWeather(e.target.value);
      }
    });
    if (typeof fetchCampusWeather === "function") {
      fetchCampusWeather(weatherSelect.value || "aau");
    }
  }
}
/**
 * Language Switcher Handler (English & Amharic)
 */
function setupLanguageSwitcher() {
  const enBtn = document.getElementById("lang-en-btn");
  const amBtn = document.getElementById("lang-am-btn");

  if (enBtn && amBtn) {
    enBtn.onclick = () => switchLanguage("en");
    amBtn.onclick = () => switchLanguage("am");
  }
}

function switchLanguage(lang) {
  currentLanguage = lang;
  const t = i18n[lang];
  window.dispatchEvent(new CustomEvent("ace:language-change", { detail: { language: lang } }));

  const enBtn = document.getElementById("lang-en-btn");
  const amBtn = document.getElementById("lang-am-btn");

  if (lang === "en") {
    enBtn.className = "px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold";
    amBtn.className = "px-2 py-0.5 rounded-md text-slate-300 hover:text-white transition font-bold";
  } else {
    amBtn.className = "px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold";
    enBtn.className = "px-2 py-0.5 rounded-md text-slate-300 hover:text-white transition font-bold";
  }

  document.querySelectorAll(".lang-text-home").forEach(el => el.textContent = t.home);
  document.querySelectorAll(".lang-text-network").forEach(el => el.textContent = t.network);
  document.querySelectorAll(".lang-text-library").forEach(el => el.textContent = t.library);

  const authBtnText = document.getElementById("auth-btn-text");
  if (authBtnText && !currentUser) authBtnText.textContent = t.signIn;

  const heroTitle = document.getElementById("hero-title");
  const heroDesc = document.getElementById("hero-desc");

  if (heroTitle) heroTitle.textContent = t.heroTitle;
  if (heroDesc) heroDesc.textContent = t.heroDesc;
}

/**
 * Church Locator Modal Handler
 */
function setupChurchLocatorModal() {
  const locatorCard = document.getElementById("church-locator-card");
  const churchModal = document.getElementById("church-modal");
  const closeBtn = document.getElementById("close-church-modal-btn");
  const selectElement = document.getElementById("locator-campus-select");
  const resultsContainer = document.getElementById("church-results-container");

  if (locatorCard && churchModal) {
    locatorCard.onclick = () => {
      churchModal.classList.remove("hidden");
      renderChurchList(selectElement?.value || "aau", resultsContainer);
    };
  }

  if (closeBtn && churchModal) {
    closeBtn.onclick = () => churchModal.classList.add("hidden");
  }

  if (selectElement && resultsContainer) {
    selectElement.onchange = (e) => {
      renderChurchList(e.target.value, resultsContainer);
    };
  }
}

/**
 * Authentication Modal & Form Listeners
 */
function setupAuthModal() {
  const modal = document.getElementById("auth-modal");
  const authBtn = document.getElementById("auth-btn");
  const promptBtn = document.getElementById("prompt-signin-link");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const tabLogin = document.getElementById("modal-tab-login");
  const tabRegister = document.getElementById("modal-tab-register");
  const loginForm = document.getElementById("modal-login-form");
  const registerForm = document.getElementById("modal-register-form");
  const loginError = document.getElementById("modal-login-error");
  const regError = document.getElementById("modal-reg-error");
  const googleBtn = document.getElementById("google-auth-btn");

  const openModal = () => {
    if (modal) modal.classList.remove("hidden");
  };

  if (authBtn) authBtn.onclick = openModal;
  if (promptBtn) promptBtn.onclick = openModal;

  if (closeModalBtn) {
    closeModalBtn.onclick = () => modal.classList.add("hidden");
  }

  if (tabLogin && tabRegister) {
    tabLogin.onclick = () => {
      tabLogin.className = "flex-1 py-1.5 text-teal-900 bg-white shadow-xs rounded-md transition font-bold";
      tabRegister.className = "flex-1 py-1.5 text-gray-400 hover:text-gray-600 transition font-bold";
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    };

    tabRegister.onclick = () => {
      tabRegister.className = "flex-1 py-1.5 text-teal-900 bg-white shadow-xs rounded-md transition font-bold";
      tabLogin.className = "flex-1 py-1.5 text-gray-400 hover:text-gray-600 transition font-bold";
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    };
  }

  if (googleBtn) {
    googleBtn.onclick = () => {
      const simulatedGoogleUser = {
        displayName: "Apostolic Fellow",
        email: "student@gmail.com",
        campus: "Addis Ababa University (AAU)",
        role: "Fellowship Student"
      };
      updateAuthUI(simulatedGoogleUser);
      modal.classList.add("hidden");
    };
  }

  if (registerForm) {
    registerForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("modal-reg-fullname").value.trim();
      const email = document.getElementById("modal-reg-email").value.trim().toLowerCase();
      const campusSelect = document.getElementById("modal-reg-campus");
      const campus = campusSelect && campusSelect.selectedIndex >= 0 ? campusSelect.options[campusSelect.selectedIndex].text : "Campus Fellow";
      const pass = document.getElementById("modal-reg-password").value;
      const confirm = document.getElementById("modal-reg-confirm").value;

      if (regError) regError.textContent = "";

      if (pass.length < 6) {
        if (regError) regError.textContent = "⚠️ Password must be at least 6 characters.";
        return;
      }
      if (pass !== confirm) {
        if (regError) regError.textContent = "⚠️ Passwords do not match.";
        return;
      }

      const newUser = { displayName: name, email, campus, password: pass, role: "Fellowship Student" };
      userDatabase.set(email, newUser);
      updateAuthUI(newUser);
      modal.classList.add("hidden");
    };
  }

  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById("modal-login-email").value.trim().toLowerCase();
      const pass = document.getElementById("modal-login-password").value;

      if (loginError) loginError.textContent = "";

      const user = userDatabase.get(email);
      if (user) {
        if (user.password === pass) {
          updateAuthUI(user);
          modal.classList.add("hidden");
        } else {
          if (loginError) loginError.textContent = "⚠️ Incorrect password. Please try again.";
        }
      } else {
        if (loginError) loginError.textContent = "⚠️ Account not registered yet. Click 'Create Account'.";
      }
    };
  }
}

/**
 * Account Menu Dropdown Handler
 */
function setupUserDropdownToggle() {
  const trigger = document.getElementById("user-menu-trigger");
  const menu = document.getElementById("user-dropdown-menu");
  const logoutBtn = document.getElementById("header-logout-btn");
  if (!menu) return;

  if (!document.getElementById("profile-menu-my-profile")) {
    const signOutArea = logoutBtn?.parentElement;
    const profileAction = document.createElement("button");
    profileAction.id = "profile-menu-my-profile";
    profileAction.type = "button";
    profileAction.className = "w-full rounded-xl px-3 py-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600";
    profileAction.innerHTML = '<i class="fa-regular fa-id-card mr-2 text-teal-700"></i><span>My Profile</span>';
    signOutArea?.insertAdjacentElement("beforebegin", profileAction);
    profileAction.addEventListener("click", () => {
      menu.classList.add("hidden");
      openUserProfilePanel();
    });
  }

  if (trigger && menu) {
    trigger.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
      trigger.setAttribute("aria-expanded", String(!menu.classList.contains("hidden")));
    };

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.classList.add("hidden");
        trigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  ensureUserProfilePanel();
  ensurePersonalizedGreeting();
  window.addEventListener("ace:language-change", () => {
    if (currentUser) {
      updatePersonalizedGreeting(currentUser);
      renderUserProfilePanel();
    }
    const label = document.querySelector("#profile-menu-my-profile span");
    if (label) label.textContent = currentLanguage === "am" ? "የእኔ መገለጫ" : "My Profile";
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentUser) updatePersonalizedGreeting(currentUser);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      menu.classList.add("hidden");
      trigger?.setAttribute("aria-expanded", "false");
      closeUserProfilePanel();
    }
  });

  if (logoutBtn) {
    logoutBtn.onclick = handleLogout;
  }
}

function escapeAccountText(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function ensurePersonalizedGreeting() {
  let banner = document.getElementById("personalized-greeting");
  if (banner) return banner;
  const dashboard = document.getElementById("app-dashboard");
  if (!dashboard) return null;
  banner = document.createElement("section");
  banner.id = "personalized-greeting";
  banner.className = "hidden mx-auto mb-4 w-full max-w-7xl px-4";
  banner.innerHTML = '<div class="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-amber-50 px-5 py-4 shadow-sm sm:px-6"><div aria-hidden="true" class="absolute -right-5 -top-10 h-32 w-32 rounded-full border-[18px] border-teal-100/50"></div><div class="relative"><p id="personalized-greeting-title" class="text-lg font-black text-slate-900 sm:text-xl"></p><p id="personalized-greeting-copy" class="mt-1 text-xs leading-5 text-slate-600 sm:text-sm"></p></div></div>';
  dashboard.insertAdjacentElement("beforebegin", banner);
  return banner;
}

function updatePersonalizedGreeting(user) {
  const banner = ensurePersonalizedGreeting();
  if (!banner) return;
  if (!user) {
    banner.classList.add("hidden");
    return;
  }
  const hour = new Date().getHours();
  const firstName = String(user.displayName || "").trim().split(/\s+/)[0];
  let timeEn = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : hour >= 17 && hour < 21 ? "Good evening" : "Good night";
  let timeAm = hour >= 5 && hour < 12 ? "እንደምን አደሩ" : hour >= 12 && hour < 17 ? "እንደምን ዋሉ" : hour >= 17 && hour < 21 ? "እንደምን አመሹ" : "መልካም ምሽት";
  const greeting = currentLanguage === "am"
    ? `${timeAm}${firstName ? `፣ ${firstName}` : ""}! ወደ ACE-USF እንኳን ደህና መጡ።`
    : `${timeEn}${firstName ? `, ${firstName}` : ""}! Welcome back to ACE-USF.`;
  const copy = currentLanguage === "am"
    ? "የሕብረት መረጃዎችን ይመልከቱ፣ ከተማሪዎች ጋር ይገናኙ፣ በእምነትና በእውቀት ያድጉ።"
    : "Continue exploring fellowship resources, connecting with students, and growing in faith and knowledge.";
  banner.querySelector("#personalized-greeting-title").textContent = greeting;
  banner.querySelector("#personalized-greeting-copy").textContent = copy;
  banner.classList.remove("hidden");
}

function ensureUserProfilePanel() {
  if (document.getElementById("ace-user-profile-panel")) return;
  const panel = document.createElement("div");
  panel.id = "ace-user-profile-panel";
  panel.className = "fixed inset-0 z-[90] hidden items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="ace-profile-title" class="w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
      <header class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 px-5 py-6 text-white sm:px-8">
        <div class="absolute -right-8 -top-20 h-52 w-52 rounded-full border-[24px] border-white/5" aria-hidden="true"></div>
        <div class="relative flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4"><div id="ace-profile-avatar" class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/30 bg-teal-800 text-xl font-black text-amber-300 shadow-lg"></div><div class="min-w-0"><p class="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">ACE-USF · MY ACCOUNT</p><h2 id="ace-profile-title" class="mt-1 truncate text-xl font-black sm:text-2xl"></h2><p id="ace-profile-subtitle" class="mt-1 truncate text-xs text-teal-100"></p></div></div>
          <button id="ace-profile-close" type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300" aria-label="Close profile"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </header>
      <div class="max-h-[68vh] space-y-5 overflow-y-auto p-5 sm:p-8">
        <p id="ace-profile-note" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"></p>
        <section><h3 id="ace-personal-heading" class="mb-3 text-xs font-black uppercase tracking-wider text-slate-500"></h3><div id="ace-personal-fields" class="grid gap-3 sm:grid-cols-2"></div></section>
        <section><h3 id="ace-academic-heading" class="mb-3 text-xs font-black uppercase tracking-wider text-slate-500"></h3><div id="ace-academic-fields" class="grid gap-3 sm:grid-cols-2"></div></section>
      </div>
    </section>`;
  document.body.append(panel);
  panel.querySelector("#ace-profile-close").addEventListener("click", closeUserProfilePanel);
  panel.addEventListener("click", event => { if (event.target === panel) closeUserProfilePanel(); });
}

function profileImageUrl(user) {
  const value = user?.photoURL || user?.photoUrl || user?.profilePicture || "";
  if (!String(value).trim()) return "";
  try {
    const parsed = new URL(value, window.location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch { return ""; }
}

function userInitials(user) {
  return String(user?.displayName || "ACE-USF").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("");
}

function renderUserProfilePanel() {
  const panel = document.getElementById("ace-user-profile-panel");
  if (!panel || !currentUser) return;
  const user = currentUser;
  const am = currentLanguage === "am";
  const missing = am ? "ገና አልተጨመረም" : "Not added yet";
  const value = (field, aliases = []) => {
    const keys = [field, ...aliases];
    for (const key of keys) if (String(user[key] || "").trim()) return String(user[key]).trim();
    return missing;
  };
  const card = (icon, label, content) => `<article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500"><i class="fa-solid ${icon} text-teal-700"></i>${escapeAccountText(label)}</p><p class="mt-2 break-words text-sm font-bold text-slate-900">${escapeAccountText(content)}</p></article>`;
  const avatar = panel.querySelector("#ace-profile-avatar");
  const photo = profileImageUrl(user);
  avatar.innerHTML = photo ? `<img src="${escapeAccountText(photo)}" alt="" class="h-full w-full object-cover">` : escapeAccountText(userInitials(user));
  panel.querySelector("#ace-profile-title").textContent = user.displayName || (am ? "የACE-USF አባል" : "ACE-USF member");
  panel.querySelector("#ace-profile-subtitle").textContent = user.campus || (am ? "ዩኒቨርሲቲ አልተገለጸም" : "University not provided");
  panel.querySelector("#ace-profile-note").textContent = am
    ? "ይህ መገለጫ በአሁኑ የድር ጣቢያ ክፍለ-ጊዜ ውስጥ የተገኘውን መረጃ ብቻ ያሳያል። የመገለጫ ማስተካከያ፣ ፎቶ መጫንና የይለፍ ቃል ለውጥ ደህንነቱ የተጠበቀ የመለያ አገልግሎት ሲገናኝ ይከፈታሉ።"
    : "This profile shows only information available in the current website session. Editing, photo uploads, and password changes need a secure account service before they can be safely enabled.";
  panel.querySelector("#ace-personal-heading").textContent = am ? "የግል መረጃ" : "Personal information";
  panel.querySelector("#ace-academic-heading").textContent = am ? "የትምህርትና የሕብረት መረጃ" : "Academic and fellowship information";
  panel.querySelector("#ace-personal-fields").innerHTML = [
    card("fa-envelope", am ? "ኢሜይል" : "Email", value("email")),
    card("fa-brands fa-telegram", "Telegram", value("telegramUsername", ["telegram"]))
  ].join("");
  panel.querySelector("#ace-academic-fields").innerHTML = [
    card("fa-building-columns", am ? "ዩኒቨርሲቲ" : "University", value("campus", ["university"])),
    card("fa-location-dot", am ? "ከተማ / ግቢ" : "City / campus", value("location", ["city"])),
    card("fa-graduation-cap", am ? "ዲፓርትመንት" : "Department", value("department")),
    card("fa-book-open", am ? "የትምህርት ደረጃ" : "Study level", value("academicYear", ["studyLevel", "year"])),
    card("fa-user-tag", am ? "የACE-USF ሚና" : "ACE-USF role", value("role")),
    card("fa-circle-info", am ? "አጭር መግቢያ" : "About", value("bio", ["biography"]))
  ].join("");
}

function openUserProfilePanel() {
  ensureUserProfilePanel();
  const panel = document.getElementById("ace-user-profile-panel");
  if (!panel || !currentUser) return;
  renderUserProfilePanel();
  panel.classList.remove("hidden");
  panel.classList.add("flex");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("overflow-hidden");
  panel.querySelector("#ace-profile-close").focus();
}

function closeUserProfilePanel() {
  const panel = document.getElementById("ace-user-profile-panel");
  if (!panel || panel.classList.contains("hidden")) return;
  panel.classList.add("hidden");
  panel.classList.remove("flex");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overflow-hidden");
  document.getElementById("user-menu-trigger")?.focus();
}

/**
 * Update Header User UI State
 */
function updateAuthUI(user) {
  currentUser = user;
  const authBtn = document.getElementById("auth-btn");
  const userHeaderProfile = document.getElementById("user-header-profile");
  const headerUserName = document.getElementById("header-user-name");
  const headerUserCampus = document.getElementById("header-user-campus");

  const dropdownName = document.getElementById("dropdown-full-name");
  const dropdownCampus = document.getElementById("dropdown-campus");
  const dropdownEmail = document.getElementById("dropdown-email");
  const dropdownRole = document.getElementById("dropdown-role");

  const postBox = document.getElementById("post-creation-card");
  const postPrompt = document.getElementById("login-to-post-prompt");

  if (user) {
    if (authBtn) authBtn.classList.add("hidden");
    if (userHeaderProfile) userHeaderProfile.classList.remove("hidden");

    if (headerUserName) headerUserName.textContent = user.displayName || "ACE-USF Member";
    if (headerUserCampus) headerUserCampus.textContent = user.campus || "Campus not added";

    if (dropdownName) dropdownName.textContent = user.displayName || "ACE-USF Member";
    if (dropdownCampus) dropdownCampus.textContent = user.campus || "Campus not added";
    if (dropdownEmail) dropdownEmail.textContent = user.email || "Email not provided";
    if (dropdownRole) dropdownRole.textContent = user.role || "Fellowship Student";
    renderAccountAvatars(user);
    updatePersonalizedGreeting(user);
    renderUserProfilePanel();
    const status = document.querySelector("#user-dropdown-menu .text-emerald-700");
    if (status) {
      status.classList.remove("text-emerald-700");
      status.classList.add("text-slate-500");
      status.innerHTML = `<i class="fa-solid fa-circle-info text-xs"></i> ${currentLanguage === "am" ? "የአሁኑ የድር ጣቢያ ክፍለ-ጊዜ" : "Current website session"}`;
    }

    if (postBox) postBox.classList.remove("hidden");
    if (postPrompt) postPrompt.classList.add("hidden");
  } else {
    if (authBtn) authBtn.classList.remove("hidden");
    if (userHeaderProfile) userHeaderProfile.classList.add("hidden");

    if (postBox) postBox.classList.add("hidden");
    if (postPrompt) postPrompt.classList.remove("hidden");
    document.getElementById("user-dropdown-menu")?.classList.add("hidden");
    document.getElementById("user-menu-trigger")?.setAttribute("aria-expanded", "false");
    closeUserProfilePanel();
    updatePersonalizedGreeting(null);
  }
}

function renderAccountAvatars(user) {
  const profileBadge = document.querySelector("#user-menu-trigger .w-7.h-7");
  const dropdownBadge = document.querySelector("#user-dropdown-menu .w-10.h-10");
  const photo = profileImageUrl(user);
  const initials = escapeAccountText(userInitials(user));
  [profileBadge, dropdownBadge].filter(Boolean).forEach((badge, index) => {
    badge.classList.add("rounded-full", "overflow-hidden");
    badge.classList.remove("rounded-lg", "rounded-xl");
    badge.innerHTML = photo
      ? `<img src="${escapeAccountText(photo)}" alt="" class="h-full w-full object-cover">`
      : `<span aria-hidden="true">${initials}</span>`;
    badge.setAttribute("aria-label", `${user?.displayName || "User"} profile`);
  });
}

function handleLogout() {
  updateAuthUI(null);
  window.location.reload();
}

/**
 * Setup Interactive Forum Feed
 */
function setupForumFeed() {
  const submitBtn = document.getElementById("submit-post");
  const postContent = document.getElementById("post-content");
  const postCategory = document.getElementById("post-category");
  const forumFeed = document.getElementById("forum-feed");

  if (forumFeed && forumFeed.children.length === 0) {
    renderSamplePosts(forumFeed);
  }

  if (submitBtn && postContent) {
    submitBtn.onclick = () => {
      const text = postContent.value.trim();
      const category = postCategory ? postCategory.value : "General";

      if (!text) {
        alert("Please enter post content before publishing.");
        return;
      }

      const newPostHTML = createPostCard({
        author: currentUser ? currentUser.displayName : "Fellowship Member",
        campus: currentUser?.campus || "ACE-USF Campus Network",
        role: currentUser?.role || "Fellowship Student",
        category: category,
        content: text,
        time: "Just now"
      });

      if (forumFeed) {
        forumFeed.insertAdjacentHTML("afterbegin", newPostHTML);
      }

      postContent.value = "";
    };
  }
}

function createPostCard({ author, campus, role, category, content, time }) {
  return `
    <div class="p-4 bg-slate-50 rounded-xl border border-gray-100 space-y-2 hover:border-teal-200 transition">
      <div class="flex justify-between items-start">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-full bg-teal-800 text-amber-400 font-bold flex items-center justify-center text-xs shadow-xs">
            <i class="fa-solid fa-user"></i>
          </div>
          <div>
            <h4 class="text-xs font-bold text-gray-900">${author}</h4>
            <p class="text-[10px] text-gray-500">${role} <span class="text-teal-800 font-semibold">${campus}</span></p>
          </div>
        </div>
        <span class="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          ${category}
        </span>
      </div>
      <p class="text-xs text-gray-700 leading-relaxed pt-1">${content}</p>
      <div class="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-200/50">
        <span><i class="fa-regular fa-clock"></i> ${time}</span>
        <div class="flex items-center space-x-3 text-gray-500">
          <button type="button" class="hover:text-teal-800 transition flex items-center gap-1"><i class="fa-regular fa-heart"></i> Like</button>
          <button type="button" class="hover:text-teal-800 transition flex items-center gap-1"><i class="fa-regular fa-comment"></i> Reply</button>
        </div>
      </div>
    </div>
  `;
}

function renderSamplePosts(container) {
  const samplePosts = [
    {
      author: "Yonas Tadesse",
      campus: "Addis Ababa University (AAU)",
      role: "Campus Fellowship Leader",
      category: "Fellowship News",
      content: "Welcome all new freshmen and continuing students to the new academic year! Join us for our weekly evening prayer and fellowship gatherings.",
      time: "2 hours ago"
    },
    {
      author: "Bethlehem Worku",
      campus: "Hawassa University",
      role: "Fellowship Student",
      category: "Testimony",
      content: "Praise God for His grace during exam week! Thank you to everyone who kept us in prayer.",
      time: "5 hours ago"
    }
  ];

  container.innerHTML = samplePosts.map(post => createPostCard(post)).join("");
}


