// js/app.js - Master Controller for ACE-USF Portal

import { initWeatherWidget, fetchCampusWeather } from "./weather_service.js";

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
    heroDesc: "በኢትዮጵያ ውስጥ በሚገኙ ከፍተኛ ትምህርት ተቋማት የሚማሩ ሐዋርያውያን ተማሪዎችን መንፈሳዊ እድገት፣ አምልኮ እና ትምህርት የሚያስተናግድ ማህበረሰብ።"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 ACE-USF Portal Controller Active...");

  setupWeatherService();
  setupLanguageSwitcher();
  setupAuthModal();
  setupUserDropdownToggle();
  setupForumFeed();
});

/**
 * Weather Service Controller
 */
function setupWeatherService() {
  const weatherSelect = document.getElementById("weather-uni-select");

  try {
    initWeatherWidget();
  } catch (err) {
    console.warn("Weather widget warning:", err.message);
  }

  if (weatherSelect) {
    weatherSelect.addEventListener("change", (e) => {
      fetchCampusWeather(e.target.value);
    });
    fetchCampusWeather(weatherSelect.value || "aau");
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

  const enBtn = document.getElementById("lang-en-btn");
  const amBtn = document.getElementById("lang-am-btn");

  if (lang === "en") {
    enBtn.className = "px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold";
    amBtn.className = "px-2 py-0.5 rounded-md text-slate-300 hover:text-white transition font-bold";
  } else {
    amBtn.className = "px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold";
    enBtn.className = "px-2 py-0.5 rounded-md text-slate-300 hover:text-white transition font-bold";
  }

  // Update Navigation Labels
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

  // Tab Switcher inside Modal
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

  // Google Sign In
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

  // Register Submit Handler
  if (registerForm) {
    registerForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("modal-reg-fullname").value.trim();
      const email = document.getElementById("modal-reg-email").value.trim().toLowerCase();
      const campusSelect = document.getElementById("modal-reg-campus");
      const campus = campusSelect ? campusSelect.options[campusSelect.selectedIndex].text : "Campus Fellow";
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

  // Strict Login Submit Handler
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
 * Account Menu Dropdown Handler (Prevents Accidental Sign-Out)
 */
function setupUserDropdownToggle() {
  const trigger = document.getElementById("user-menu-trigger");
  const menu = document.getElementById("user-dropdown-menu");
  const logoutBtn = document.getElementById("header-logout-btn");

  if (trigger && menu) {
    trigger.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    };

    // Close menu when clicking anywhere outside
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.classList.add("hidden");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.onclick = handleLogout;
  }
}

/**
 * Update Header User UI State
 */
function updateAuthUI(user) {
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
    currentUser = user;

    if (authBtn) authBtn.classList.add("hidden");
    if (userHeaderProfile) userHeaderProfile.classList.remove("hidden");

    if (headerUserName) headerUserName.textContent = user.displayName;
    if (headerUserCampus) headerUserCampus.textContent = user.campus;

    if (dropdownName) dropdownName.textContent = user.displayName;
    if (dropdownCampus) dropdownCampus.textContent = user.campus;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
    if (dropdownRole) dropdownRole.textContent = user.role || "Fellowship Student";

    if (postBox) postBox.classList.remove("hidden");
    if (postPrompt) postPrompt.classList.add("hidden");
  } else {
    currentUser = null;

    if (authBtn) authBtn.classList.remove("hidden");
    if (userHeaderProfile) userHeaderProfile.classList.add("hidden");

    if (postBox) postBox.classList.add("hidden");
    if (postPrompt) postPrompt.classList.remove("hidden");
  }
}

function handleLogout() {
  currentUser = null;
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
            <p class="text-[10px] text-gray-500">${role} • <span class="text-teal-800 font-semibold">${campus}</span></p>
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