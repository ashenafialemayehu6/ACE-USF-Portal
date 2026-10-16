// js/app.js - Master Interactive Controller for ACE-USF Portal
import { renderHomeSection, updateHomeGreeting } from './home_service.js';
import { renderCampusNetworkSection } from './campus_network.js';
import { initWeatherWidget, fetchCampusWeather } from "./weather_service.js";
import { renderChurchList } from "./church_locator.js";
import { populateInstitutionSelect } from "./institutions.js";
import { populateDepartmentSelect } from "./academic_data.js";
import { renderLibrarySection, setupLibraryModal } from "./library_service.js";
import { renderFellowshipLeadersSection, setupFellowshipLeadersSection } from "./fellowship_leaders.js";
import { setupStudentForumRoom, closeStudentForumRoom, isStudentForumRoomOpen } from "./student_forum.js";
import { setupFreshmenAlumniRoom } from "./freshmen_alumni.js";
import { setupFellowshipLeadersRoom } from "./fellowship_leaders_room.js";
import {
  registerStudent, loginStudent, logoutStudent, checkAuthState,
  getMyProfile, saveMyProfile, uploadMyProfilePhoto, changeMyPassword,
  sendPasswordReset, resendVerificationEmail, signInWithGoogle,
  isCurrentUserAdmin
} from "./auth_service.js";
import { setupAdminDashboard } from "./admin_dashboard.js";

let currentUser = null;
let currentLanguage = "en";
let weatherRoomReturnFocus = null;
let weatherRoomHomeContent = [];
let weatherPanelTemplate = null;

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
  const initialWeatherPanel = document.getElementById("weather-section");
  if (initialWeatherPanel) weatherPanelTemplate = initialWeatherPanel.cloneNode(true);

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
      renderHomeSection("app-dashboard", currentUser);
    }
  });

  // 2. Home Navigation Click Binding
  const homeBtn = document.getElementById("nav-home");
  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (document.getElementById("weather-room-view")?.classList.contains("hidden") === false) {
        closeWeatherRoom();
      }
      if (isStudentForumRoomOpen()) closeStudentForumRoom();
      console.log("📍 Navigation: Home clicked");
      safeInit("Render Home", () => {
        if (typeof renderHomeSection === "function") {
          renderHomeSection("app-dashboard", currentUser);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  // Delegate section navigation so links rendered later inside dynamic sections work too.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a, button");
    if (!link) return;

    if (link.matches("a[data-open-weather-room], a[href='#weather-section']")) {
      event.preventDefault();
      openWeatherRoom(link);
      return;
    }

    if (link.matches("[data-open-church-locator]")) {
      event.preventDefault();
      const churchModal = document.getElementById("church-modal");
      const campusSelect = document.getElementById("locator-campus-select");
      const churchResults = document.getElementById("church-results-container");
      if (churchModal) {
        churchModal.classList.remove("hidden");
        renderChurchList(campusSelect?.value || "aau", churchResults);
      }
      return;
    }
    if ((link.matches("a") || link.id === "auth-btn") && document.getElementById("weather-room-view")?.classList.contains("hidden") === false) {
      closeWeatherRoom();
    }

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

    if (link.matches("[data-open-fellowship-leaders-top], [data-open-fellowship-leaders-middle], a[href='#hubs-section'], a[href='#fellowship-leaders']")) {
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
  safeInit("Student Forum Room", () => setupStudentForumRoom({
    onOpen: () => updateAuthUI(currentUser),
    isSignedIn: () => Boolean(currentUser),
    getCurrentUser: () => currentUser,
    openSignIn: () => document.getElementById("auth-btn")?.click(),
    onClose: () => updateAuthUI(currentUser)
  }));
  safeInit("Freshmen & Alumni Journey Hub", setupFreshmenAlumniRoom);
  safeInit("Library Modal", setupLibraryModal);
  safeInit("Fellowship Leaders Network", setupFellowshipLeadersSection);
  safeInit("Fellowship Leaders Dedicated Room", setupFellowshipLeadersRoom);
  safeInit("Secure Admin Workspace", setupAdminDashboard);
  // Restore the real Firebase session and profile on refresh.
  checkAuthState(async user => {
    if (!user) {
      updateAuthUI(null);
      return;
    }
    try {
      const profile = await getMyProfile();
      const admin = await isCurrentUserAdmin();
      updateAuthUI({ ...user, ...(profile || {}), uid: user.uid, email: user.email, photoURL: profile?.photoURL || user.photoURL, isAdmin: admin, role: admin ? "Administrator" : "Fellowship Student" });
    } catch (error) {
      console.error("Could not load the signed-in account profile:", error);
      updateAuthUI({ ...user, uid: user.uid, email: user.email, isAdmin: false, role: "Fellowship Student" });
    }
  });
});

/**
 * Weather Service Controller
 */
function setupWeatherService() {
  const weatherSelect = document.getElementById("weather-uni-select");
  const weatherRefresh = document.getElementById("weather-refresh");
  const weatherRoom = document.getElementById("weather-room-view");
  const weatherRoomClose = document.getElementById("weather-room-close");

  // Bind the home feature tile directly so the room still opens if another
  // component stops the click before it reaches the document-level router.
  document.querySelectorAll('a[data-open-weather-room], a[href="#weather-section"]').forEach(trigger => {
    if (trigger.dataset.weatherRoomBound === "true") return;
    trigger.dataset.weatherRoomBound = "true";
    trigger.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      openWeatherRoom(trigger);
    });
  });

  try {
    if (typeof initWeatherWidget === "function") {
      initWeatherWidget();
    }
  } catch (err) {
    console.warn("Weather widget warning:", err.message);
  }

  if (weatherSelect) {
    updateWeatherSeasonLocation(weatherSelect);
    weatherSelect.addEventListener("change", (e) => {
      updateWeatherSeasonLocation(e.target);
      if (typeof fetchCampusWeather === "function") {
        fetchCampusWeather(e.target.value);
      }
    });
    if (typeof fetchCampusWeather === "function") {
      fetchCampusWeather(weatherSelect.value || "aau");
    }
  }

  if (weatherRefresh && weatherSelect && typeof fetchCampusWeather === "function") {
    weatherRefresh.addEventListener("click", async () => {
      const icon = weatherRefresh.querySelector("i");
      weatherRefresh.disabled = true;
      weatherRefresh.setAttribute("aria-busy", "true");
      icon?.classList.add("fa-spin");
      try {
        await fetchCampusWeather(weatherSelect.value || "aau");
      } catch (err) {
        console.warn("Campus weather refresh failed:", err);
      } finally {
        weatherRefresh.disabled = false;
        weatherRefresh.removeAttribute("aria-busy");
        icon?.classList.remove("fa-spin");
      }
    });
  }

  if (weatherRoomClose && weatherRoom && weatherRoomClose.dataset.bound !== "true") {
    weatherRoomClose.dataset.bound = "true";
    weatherRoomClose.addEventListener("click", closeWeatherRoom);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !weatherRoom.classList.contains("hidden")) closeWeatherRoom();
    });
  }
}

function openWeatherRoom(trigger) {
  const room = document.getElementById("weather-room-view");
  const roomContent = document.getElementById("weather-room-content");
  const roomHomeSlot = document.getElementById("weather-room-home-slot");
  const dashboard = document.getElementById("app-dashboard");
  const closeButton = document.getElementById("weather-room-close");
  if (!room || !roomContent || !roomHomeSlot || !dashboard || !weatherPanelTemplate) return;
  if (!room.classList.contains("hidden")) return;

  weatherRoomReturnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
  weatherRoomHomeContent = [...dashboard.childNodes];
  dashboard.replaceChildren(room);
  roomContent.replaceChildren(weatherPanelTemplate.cloneNode(true));
  room.classList.remove("hidden");
  room.setAttribute("aria-hidden", "false");
  setupWeatherRoomControls();
  room.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  closeButton?.focus();
}

function closeWeatherRoom() {
  const room = document.getElementById("weather-room-view");
  const roomHomeSlot = document.getElementById("weather-room-home-slot");
  const dashboard = document.getElementById("app-dashboard");
  const roomContent = document.getElementById("weather-room-content");
  if (!room || !roomHomeSlot || !dashboard || !roomContent) return;

  roomContent.replaceChildren();
  room.classList.add("hidden");
  room.setAttribute("aria-hidden", "true");
  dashboard.replaceChildren(...weatherRoomHomeContent);
  roomHomeSlot.append(room);
  weatherRoomHomeContent = [];
  if (weatherRoomReturnFocus instanceof HTMLElement) weatherRoomReturnFocus.focus();
  weatherRoomReturnFocus = null;
}

function setupWeatherRoomControls() {
  const select = document.getElementById("weather-uni-select");
  const refresh = document.getElementById("weather-refresh");
  if (!select) return;

  if (typeof populateInstitutionSelect === "function") {
    populateInstitutionSelect("weather-uni-select", "Select campus city for weather...");
  }
  updateWeatherSeasonLocation(select);
  try {
    if (typeof initWeatherWidget === "function") initWeatherWidget();
  } catch (err) {
    console.warn("Weather room initialization warning:", err.message);
  }

  select.addEventListener("change", event => {
    updateWeatherSeasonLocation(event.target);
    if (typeof fetchCampusWeather === "function") fetchCampusWeather(event.target.value);
  });
  if (typeof fetchCampusWeather === "function") fetchCampusWeather(select.value || "aau");

  refresh?.addEventListener("click", async () => {
    if (typeof fetchCampusWeather !== "function") return;
    const icon = refresh.querySelector("i");
    refresh.disabled = true;
    refresh.setAttribute("aria-busy", "true");
    icon?.classList.add("fa-spin");
    try {
      await fetchCampusWeather(select.value || "aau");
    } catch (err) {
      console.warn("Campus weather refresh failed:", err);
    } finally {
      refresh.disabled = false;
      refresh.removeAttribute("aria-busy");
      icon?.classList.remove("fa-spin");
    }
  });
}

function updateWeatherSeasonLocation(select) {
  const locationLabel = document.getElementById("weather-season-location");
  const regionLabel = document.getElementById("weather-season-region");
  const belgDescription = document.getElementById("weather-belg-description");
  const kiremtDescription = document.getElementById("weather-kiremt-description");
  const begaDescription = document.getElementById("weather-bega-description");
  if (!locationLabel) return;

  const selectedText = select?.selectedOptions?.[0]?.textContent?.trim();
  const selectedValue = select?.value || "";
  if (!selectedText || /select campus/i.test(selectedText)) {
    locationLabel.textContent = "Typical seasonal guide for the selected campus area";
  } else {
    locationLabel.textContent = `Typical seasonal guide for ${selectedText}`;
  }

  const campusKey = `${selectedText || ""} ${selectedValue}`.toLowerCase();
  const regionalProfiles = [
    {
      match: /adigrat|mekelle|mek'ele|tigray|axum|aksum|sh[eiy]re|adwa|wukro/,
      region: "Tigray highlands · Belg and Kiremt rains",
      belg: "Eastern and southern Tigray can receive Belg rain from about February to May. Around Adigrat, amounts are variable and may be limited, so dry spells can occur.",
      kiremt: "June to September is the main rainy period. Rainfall is stronger in many central and western highlands; eastern Tigray can have both Belg and Kiremt rain periods.",
      bega: "October to January is generally the drier period. Highland mornings and nights can feel cool, with occasional local showers possible."
    },
    {
      match: /dire dawa|diredawa|harar|har[a]maya|jigjiga|jijiga|somali|gode|kebri|dehar|degehabur|oda bultum|chiro/,
      region: "Eastern Ethiopia · lowland and eastern rainfall pattern",
      belg: "February to May is an important rain period across much of eastern Ethiopia. Rain is highly variable, and hot, dry intervals can separate showers.",
      kiremt: "June to September is often less rainy here than in the western and central highlands. Local showers can still occur, and lowland days are often hot.",
      bega: "October to January is mostly dry around many eastern cities. Farther south in Somali Region, a separate rainy period can occur, so conditions vary by locality."
    },
    {
      match: /afar|semera|samara|asayita|gewane|metehara|awash/,
      region: "Afar and Rift Valley lowlands · hot, locally variable pattern",
      belg: "Some areas receive short, variable rains from February to May. Rainfall can be patchy, with long dry intervals in lowland locations.",
      kiremt: "The main highland rainy season brings limited or uneven rain to many Afar lowlands. Local storms can still occur; conditions change with elevation and location.",
      bega: "October to January is generally very dry in much of Afar. Expect strong local differences between lowlands and nearby highland areas."
    },
    {
      match: /hawassa|sidama|dilla|arba minch|wolaita|wolayta|south ethiopia|snnpr|gedeo|konso|bale|borena|omo|jinka|bule hora|madda walabu|wachemo|wachamo|wolaita sodo|sodo|hosanna|hossana|yirgalem/,
      region: "Southern Ethiopia · Belg rains and a distinct southern pattern",
      belg: "February to May is a key rainy period across many southern areas, often with the longer rains building in March and April. Start and strength vary locally.",
      kiremt: "June to September is more variable in the south. Some highland areas receive rain, while many southern and southeastern lowlands are relatively drier.",
      bega: "October to January can bring a second rainy period to parts of southern and southeastern Ethiopia. Rain is not uniform, and dry spells remain possible."
    },
    {
      match: /jimma|gambella|assosa|nekemte|wollega|bonga|mizan|tepi|benishangul|ambo|mettu|me[t]u|wollega/,
      region: "Western and southwestern Ethiopia · extended rainy influence",
      belg: "Rain may begin during March or April in parts of the west and southwest, making this a transition into the wetter part of the year.",
      kiremt: "June to September is typically the strongest rainy period across much of western and southwestern Ethiopia, with frequent rain in many areas.",
      bega: "October to January is drier in many places, but western and southwestern locations can keep receiving rain. Local conditions vary with elevation."
    },
    {
      match: /bahir dar|gondar|debre markos|dessie|wollo|amhara|lalibela|debre tabor|woldia|injibara|kombolcha/,
      region: "Amhara and northwestern highlands · Kiremt-dominant pattern",
      belg: "Much of the northwestern highlands is relatively dry from February through April; rain commonly increases toward May, with local variation.",
      kiremt: "June to September is the main rainy season, especially across the highlands. Expect frequent rain and cooler, cloudier conditions during wet spells.",
      bega: "October to January is generally dry, with cool highland mornings and nights. Occasional showers may occur in some central areas."
    },
    {
      match: /addis|bishoftu|deb[a]?re zeit|adama|astu|oromia|unity|st\. mary|st mary|aastu|central ethiopia|arsi|asella|kotebe/,
      region: "Central Ethiopian highlands · Belg and main Kiremt seasons",
      belg: "The shorter rains generally fall from February to May, often becoming more noticeable from March. Showers and dry breaks vary from year to year.",
      kiremt: "June to September is the main rainy season, with frequent showers and cloudier periods across the central highlands.",
      bega: "October to January is usually the drier season. Days are often clearer, while highland mornings and nights can be cool."
    }
  ];

  const profile = regionalProfiles.find(item => item.match.test(campusKey));
  const nationalGuide = {
    region: "Ethiopia-wide overview · campus location not recognized",
    belg: "February to May is a rainy period in many central, eastern, and southern areas. It is much drier in some northwestern areas; local timing varies.",
    kiremt: "June to September brings the main rains to much of the highlands and west. Many southern and southeastern lowlands have a different pattern.",
    bega: "October to January is generally drier across much of Ethiopia, while parts of the south, southwest, and southeast can still receive rain."
  };
  const guide = profile || nationalGuide;
  if (regionLabel) regionLabel.textContent = guide.region;
  if (belgDescription) belgDescription.textContent = guide.belg;
  if (kiremtDescription) kiremtDescription.textContent = guide.kiremt;
  if (begaDescription) begaDescription.textContent = guide.bega;
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
  const resetBtn = document.getElementById("modal-password-reset-btn");
  const resendBtn = document.getElementById("modal-resend-verification-btn");

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
    googleBtn.onclick = async () => {
      setAuthBusy(googleBtn, true);
      try {
        await signInWithGoogle();
        modal?.classList.add("hidden");
      } catch (error) {
        showAuthError(loginError, error);
      } finally { setAuthBusy(googleBtn, false); }
    };
  }

  if (resetBtn) resetBtn.onclick = async () => {
    const email = document.getElementById("modal-login-email")?.value.trim();
    if (!email) {
      showAuthMessage(loginError, "Enter your email above, then choose Forgot password.", true);
      document.getElementById("modal-login-email")?.focus();
      return;
    }
    setAuthBusy(resetBtn, true);
    try {
      await sendPasswordReset(email);
      showAuthMessage(loginError, "Thank you for being part of ACE-USF. If an account matches that email, secure reset instructions are on the way. Check your inbox and spam folder; if you normally use Google, choose Continue with Google. If you did not request a reset, ignore the email.");
    } catch (error) { showAuthError(loginError, error); }
    finally { setAuthBusy(resetBtn, false); }
  };

  if (resendBtn) {
    resendBtn.onclick = async () => {
      setAuthBusy(resendBtn, true);
      try {
        await resendVerificationEmail();
        showAuthMessage(loginError, "Verification email sent. Check your inbox and spam folder.");
      } catch (error) {
        showAuthError(loginError, error);
      } finally {
        setAuthBusy(resendBtn, false);
      }
    };
  }
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("modal-reg-fullname").value.trim();
      const email = document.getElementById("modal-reg-email").value.trim().toLowerCase();
      const campusSelect = document.getElementById("modal-reg-campus");
      const campus = campusSelect && campusSelect.selectedIndex >= 0 ? campusSelect.options[campusSelect.selectedIndex].text : "Campus Fellow";
      const pass = document.getElementById("modal-reg-password").value;
      const confirm = document.getElementById("modal-reg-confirm").value;

      if (regError) regError.textContent = "";

      if (pass.length < 8) {
        if (regError) regError.textContent = "Use at least 8 characters for your password.";
        return;
      }
      if (pass !== confirm) {
        if (regError) regError.textContent = "⚠️ Passwords do not match.";
        return;
      }

      const submit = registerForm.querySelector('[type="submit"]');
      setAuthBusy(submit, true);
      try {
        await registerStudent(email, pass, { name, campus, department: "" });
        modal?.classList.add("hidden");
        alert("Account created. Please check your email to verify your address.");
      } catch (error) { showAuthError(regError, error); }
      finally { setAuthBusy(submit, false); }
    };
  }

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("modal-login-email").value.trim().toLowerCase();
      const pass = document.getElementById("modal-login-password").value;

      if (loginError) loginError.textContent = "";

      const submit = loginForm.querySelector('[type="submit"]');
      setAuthBusy(submit, true);
      try {
        const user = await loginStudent(email, pass);
        if (user && user.emailVerified === false) {
          resendBtn?.classList.remove("hidden");
          showAuthMessage(
            loginError,
            "Your email is not verified yet. Choose Resend verification email."
          );
        } else {
          resendBtn?.classList.add("hidden");
          modal?.classList.add("hidden");
        }
      } catch (error) { showAuthError(loginError, error); }
      finally { setAuthBusy(submit, false); }
    };
  }
}

function setAuthBusy(button, busy) {
  if (!button) return;
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
  if (busy) button.dataset.originalText = button.textContent;
  button.textContent = busy ? "Please wait…" : (button.dataset.originalText || button.textContent);
}

function showAuthMessage(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("text-red-600", isError);
  target.classList.toggle("text-emerald-700", !isError);
}

function showAuthError(target, error) {
  const messages = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use": "An account already uses this email. Try signing in.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/popup-closed-by-user": "The sign-in window was closed before completion.",
    "auth/network-request-failed": "Connection failed. Check your internet and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a little and try again."
  };
  const code = error?.code || "";
  showAuthMessage(target, messages[code] || error?.message || "Something went wrong. Please try again.", true);
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

function updatePersonalizedGreeting(user) {
  updateHomeGreeting(user);
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
      <div class="max-h-[72vh] space-y-5 overflow-y-auto p-5 sm:p-8">
        <p id="ace-profile-note" role="status" class="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-950"></p>
        <form id="ace-profile-form" class="space-y-4">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-500">Personal and campus information</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="text-xs font-semibold text-slate-600">Full name<input id="profile-display-name" required maxlength="100" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"></label>
            <label class="text-xs font-semibold text-slate-600">Email address<input id="profile-email" readonly class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"></label>
            <label class="text-xs font-semibold text-slate-600">University / college<input id="profile-campus" maxlength="160" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"></label>
            <label class="text-xs font-semibold text-slate-600">Department<input id="profile-department" maxlength="120" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"></label>
            <label class="text-xs font-semibold text-slate-600">Telegram username<input id="profile-telegram" maxlength="80" placeholder="@username" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"></label>
            <label class="text-xs font-semibold text-slate-600 sm:col-span-2">Short introduction<textarea id="profile-bio" maxlength="400" rows="3" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600"></textarea></label>
          </div>
          <div class="flex flex-wrap items-center gap-3"><label class="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><i class="fa-regular fa-image mr-2"></i>Choose profile photo<input id="profile-photo-file" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"></label><span class="text-[11px] text-slate-500">JPG, PNG, WebP · up to 5 MB</span><span id="profile-save-status" role="status" class="text-xs"></span></div>
          <button type="submit" class="rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-teal-700">Save profile</button>
        </form>
        <form id="ace-password-form" class="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-600">Change password</h3>
          <div class="grid gap-3 sm:grid-cols-2"><label class="text-xs font-semibold text-slate-600">Current password<input id="profile-current-password" type="password" autocomplete="current-password" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"></label><label class="text-xs font-semibold text-slate-600">New password (8+ characters)<input id="profile-new-password" type="password" autocomplete="new-password" minlength="8" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"></label></div>
          <p id="password-change-status" role="status" class="text-xs"></p><button type="submit" class="rounded-xl border border-teal-800 px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-teal-50">Update password</button>
        </form>
        <button id="profile-resend-verification" type="button" class="hidden text-xs font-bold text-teal-800 underline">Resend email verification</button>
      </div>
    </section>`;
  document.body.append(panel);
  panel.querySelector("#ace-profile-close").addEventListener("click", closeUserProfilePanel);
  panel.addEventListener("click", event => { if (event.target === panel) closeUserProfilePanel(); });
  panel.querySelector("#ace-profile-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = panel.querySelector("#profile-save-status");
    status.textContent = "Saving…";
    try {
      await saveMyProfile({
        displayName: panel.querySelector("#profile-display-name").value,
        campus: panel.querySelector("#profile-campus").value,
        department: panel.querySelector("#profile-department").value,
        telegram: panel.querySelector("#profile-telegram").value,
        bio: panel.querySelector("#profile-bio").value
      });
      const fresh = await getMyProfile();
      updateAuthUI({ ...currentUser, ...fresh, email: currentUser.email, uid: currentUser.uid });
      status.textContent = "Profile saved.";
    } catch (error) { status.textContent = error?.message || "Could not save profile."; }
  });
  panel.querySelector("#profile-photo-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const status = panel.querySelector("#profile-save-status");
    status.textContent = "Uploading photo…";
    try {
      await uploadMyProfilePhoto(file);
      const fresh = await getMyProfile();
      updateAuthUI({ ...currentUser, ...fresh, email: currentUser.email, uid: currentUser.uid });
      status.textContent = "Profile photo updated.";
    } catch (error) { status.textContent = error?.message || "Photo upload failed."; }
    finally { event.target.value = ""; }
  });
  panel.querySelector("#ace-password-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = panel.querySelector("#password-change-status");
    status.textContent = "Updating…";
    try {
      await changeMyPassword({
        currentPassword: panel.querySelector("#profile-current-password").value,
        newPassword: panel.querySelector("#profile-new-password").value
      });
      event.target.reset();
      status.textContent = "Password updated securely.";
    } catch (error) { status.textContent = error?.message || "Could not update password."; }
  });
  panel.querySelector("#profile-resend-verification").addEventListener("click", async () => {
    try { await resendVerificationEmail(); panel.querySelector("#ace-profile-note").textContent = "Verification email sent. Check your inbox."; }
    catch (error) { panel.querySelector("#ace-profile-note").textContent = error?.message || "Could not send verification email."; }
  });
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
  const avatar = panel.querySelector("#ace-profile-avatar");
  const photo = profileImageUrl(user);
  avatar.innerHTML = photo ? `<img src="${escapeAccountText(photo)}" alt="" class="h-full w-full object-cover">` : escapeAccountText(userInitials(user));
  panel.querySelector("#ace-profile-title").textContent = user.displayName || (am ? "የACE-USF አባል" : "ACE-USF member");
  panel.querySelector("#ace-profile-subtitle").textContent = user.campus || (am ? "ዩኒቨርሲቲ አልተገለጸም" : "University not provided");
  panel.querySelector("#ace-profile-note").textContent = user.emailVerified
    ? "Your account is connected. These details are private to your account; the website’s shared content is managed by authorized administrators."
    : "Please verify your email to secure your account. Your personal details remain private to your account.";
  panel.querySelector("#profile-display-name").value = user.displayName || "";
  panel.querySelector("#profile-email").value = user.email || "";
  panel.querySelector("#profile-campus").value = user.campus || "";
  panel.querySelector("#profile-department").value = user.department || "";
  panel.querySelector("#profile-telegram").value = user.telegram || user.telegramUsername || "";
  panel.querySelector("#profile-bio").value = user.bio || user.biography || "";
  panel.querySelector("#profile-resend-verification").classList.toggle("hidden", Boolean(user.emailVerified));
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
  window.firebaseAuthUser = user || null;
  const authBtn = document.getElementById("auth-btn");
  const userHeaderProfile = document.getElementById("user-header-profile");

  const dropdownName = document.getElementById("dropdown-full-name");
  const dropdownCampus = document.getElementById("dropdown-campus");
  const dropdownEmail = document.getElementById("dropdown-email");
  const dropdownRole = document.getElementById("dropdown-role");

  const postBox = document.getElementById("post-creation-card");
  const postPrompt = document.getElementById("login-to-post-prompt");

  if (user) {
    if (authBtn) authBtn.classList.add("hidden");
    if (userHeaderProfile) userHeaderProfile.classList.remove("hidden");


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
  window.dispatchEvent(new CustomEvent("aceusf-auth-changed"));
}

function renderAccountAvatars(user) {
  const profileBadge = document.querySelector("#user-menu-trigger .user-avatar-badge");
  const dropdownBadge = document.querySelector("#user-dropdown-menu .w-10.h-10");
  const photo = profileImageUrl(user);
  const initials = escapeAccountText(userInitials(user));
  const displayName = user?.displayName || "ACE-USF Member";
  const trigger = document.getElementById("user-menu-trigger");
  if (trigger) {
    trigger.setAttribute("aria-label", `Open account menu for ${displayName}`);
    trigger.setAttribute("title", `Account: ${displayName}`);
  }
  [profileBadge, dropdownBadge].filter(Boolean).forEach(badge => {
    badge.classList.add("rounded-full", "overflow-hidden");
    badge.classList.remove("rounded-lg", "rounded-xl");
    badge.innerHTML = photo
      ? `<img src="${escapeAccountText(photo)}" alt="" class="h-full w-full object-cover">`
      : `<span aria-hidden="true">${initials}</span>`;
  });
}
async function handleLogout() {
  try { await logoutStudent(); }
  catch (error) { console.error("Sign out failed:", error); }
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




