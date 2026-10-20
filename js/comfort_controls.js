// Persistent, site-wide appearance and eye-comfort controls.
(() => {
  const STORAGE_KEY = "ace-usf-display-comfort-v1";

  function init() {
    const toggle = document.getElementById("comfort-toggle");
    const popover = document.getElementById("comfort-popover");
    const close = document.getElementById("comfort-close");
    const darkToggle = document.getElementById("comfort-dark-toggle");
    const darkState = document.getElementById("comfort-dark-state");
    const dimSlider = document.getElementById("comfort-dim-slider");
    const dimValue = document.getElementById("comfort-dim-value");
    const warmSlider = document.getElementById("comfort-warm-slider");
    const warmValue = document.getElementById("comfort-warm-value");
    const nightPreset = document.getElementById("comfort-night-preset");
    if (!toggle || !popover || !darkToggle || !dimSlider || !warmSlider) return;

    let settings = { dark: false, brightness: 100, warmth: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        settings = {
          dark: saved.dark === true,
          brightness: Math.min(100, Math.max(65, Number(saved.brightness) || 100)),
          warmth: Math.min(55, Math.max(0, Number(saved.warmth) || 0))
        };
      }
    } catch { /* Continue with defaults when browser storage is unavailable. */ }

    const save = () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Private browsing may block storage. */ }
    };

    const render = () => {
      document.body.classList.toggle("comfort-dark", settings.dark);
      document.body.classList.toggle("comfort-dim", settings.brightness < 100);
      document.body.classList.toggle("comfort-warm", settings.warmth > 0);
      document.body.style.setProperty("--comfort-dim", String(((100 - settings.brightness) / 100).toFixed(2)));
      document.body.style.setProperty("--comfort-warm", String((settings.warmth / 100).toFixed(2)));
      darkToggle.setAttribute("aria-pressed", String(settings.dark));
      if (darkState) darkState.textContent = settings.dark ? "On" : "Off";
      dimSlider.value = String(settings.brightness);
      warmSlider.value = String(settings.warmth);
      if (dimValue) dimValue.textContent = `${settings.brightness}%`;
      if (warmValue) warmValue.textContent = settings.warmth ? `${settings.warmth}%` : "Off";
    };

    const setOpen = (open) => {
      popover.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) darkToggle.focus();
      else toggle.focus();
    };

    toggle.addEventListener("click", () => setOpen(popover.classList.contains("hidden")));
    close?.addEventListener("click", () => setOpen(false));
    darkToggle.addEventListener("click", () => { settings.dark = !settings.dark; save(); render(); });
    dimSlider.addEventListener("input", () => { settings.brightness = Number(dimSlider.value); save(); render(); });
    warmSlider.addEventListener("input", () => { settings.warmth = Number(warmSlider.value); save(); render(); });
    nightPreset?.addEventListener("click", () => {
      settings = { dark: true, brightness: 88, warmth: 28 };
      save();
      render();
    });

    document.addEventListener("pointerdown", (event) => {
      if (!popover.classList.contains("hidden") && !popover.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !popover.classList.contains("hidden")) setOpen(false);
    });

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
