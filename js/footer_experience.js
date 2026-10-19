import { ethiopianInstitutions } from "./institutions.js";

const BOT_URL = "https://t.me/ACE_USF_AssistantBot";
const MEDIA_URL = "https://t.me/AmenApostolicMedia";
const YOUTUBE_URL = "https://youtu.be/OmA9U3AgUss";
const CHURCH_URL = "https://acieth.org/";

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const icon = (name, extra = "") => `<i class="fa-solid ${name}${extra ? ` ${extra}` : ""}" aria-hidden="true"></i>`;
const regions = [...new Set(ethiopianInstitutions.map(item => item.region))].sort((a, b) => a.localeCompare(b));

const styles = `
  .ace-footer-dialog{width:min(100% - 24px,1040px);max-width:1040px;max-height:min(92vh,900px);padding:0;border:1px solid rgba(148,163,184,.3);border-radius:28px;background:#f8fafc;color:#0f172a;box-shadow:0 32px 100px rgba(2,6,23,.45);overflow:hidden}
  .ace-footer-dialog::backdrop{background:rgba(2,6,23,.76);backdrop-filter:blur(9px)}
  .ace-footer-shell{display:flex;flex-direction:column;max-height:min(92vh,900px)}
  .ace-footer-head{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px clamp(20px,4vw,38px);color:white;background:radial-gradient(circle at 85% 0%,rgba(45,212,191,.22),transparent 34%),linear-gradient(120deg,#071b2b,#0f3e43 65%,#123a3b)}
  .ace-footer-head::after{content:"";position:absolute;z-index:-1;width:230px;height:230px;right:8%;top:-160px;border:1px solid rgba(251,191,36,.28);border-radius:50%;box-shadow:0 0 0 26px rgba(251,191,36,.04),0 0 0 54px rgba(251,191,36,.035)}
  .ace-footer-kicker{margin:0 0 5px;color:#fcd34d;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}
  .ace-footer-title{margin:0;color:white;font-size:clamp(23px,4vw,34px);font-weight:900;letter-spacing:-.04em;line-height:1.1}
  .ace-footer-subtitle{margin:8px 0 0;max-width:660px;color:#cbd5e1;font-size:13px;line-height:1.65}
  .ace-footer-close{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border:1px solid rgba(255,255,255,.2);border-radius:15px;background:rgba(255,255,255,.08);color:white;font-size:20px;transition:.2s}
  .ace-footer-close:hover{transform:rotate(90deg);background:rgba(255,255,255,.17)}
  .ace-footer-content{overflow:auto;padding:clamp(18px,4vw,36px)}
  .ace-footer-view[hidden]{display:none}
  .ace-footer-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:19px}
  .ace-footer-search,.ace-footer-select{min-height:46px;border:1px solid #cbd5e1;border-radius:14px;background:white;color:#0f172a;font:inherit;font-size:13px;outline:none}
  .ace-footer-search{flex:1 1 260px;display:flex;align-items:center;gap:10px;padding:0 14px}
  .ace-footer-search input{width:100%;border:0;outline:0;background:transparent;color:#0f172a;font-size:13px}
  .ace-footer-select{padding:0 13px}
  .ace-footer-search:focus-within,.ace-footer-select:focus-visible{border-color:#0f766e;box-shadow:0 0 0 3px rgba(13,148,136,.15)}
  .ace-footer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
  .ace-footer-card{position:relative;overflow:hidden;border:1px solid #e2e8f0;border-radius:20px;background:linear-gradient(145deg,#fff,#f8fafc);padding:19px;box-shadow:0 5px 16px rgba(15,23,42,.04);transition:transform .2s,border-color .2s,box-shadow .2s}
  .ace-footer-card:hover{transform:translateY(-3px);border-color:#99f6e4;box-shadow:0 16px 32px rgba(15,23,42,.09)}
  .ace-footer-card-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#ecfdf5;color:#0f766e;font-size:17px}
  .ace-footer-card h3{margin:13px 0 5px;color:#0f172a;font-size:15px;font-weight:850}
  .ace-footer-card p{margin:0;color:#64748b;font-size:12px;line-height:1.65}
  .ace-footer-card-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}
  .ace-footer-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;padding:5px 9px;color:#475569;font-size:10px;font-weight:750}
  .ace-footer-card-action,.ace-footer-primary,.ace-footer-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;margin-top:15px;border:0;border-radius:12px;padding:0 13px;background:#0f766e;color:#fff;text-decoration:none;font-size:11px;font-weight:850;transition:.18s;cursor:pointer}
  .ace-footer-card-action:hover,.ace-footer-primary:hover{background:#115e59;transform:translateY(-1px)}
  .ace-footer-secondary{border:1px solid #cbd5e1;background:#fff;color:#0f172a}
  .ace-footer-secondary:hover{border-color:#0f766e;color:#0f766e}
  .ace-footer-callout{display:flex;gap:12px;align-items:flex-start;margin:0 0 20px;border:1px solid #bae6fd;border-radius:18px;background:linear-gradient(110deg,#eff6ff,#f0fdfa);padding:15px;color:#334155;font-size:12px;line-height:1.7}
  .ace-footer-callout i{margin-top:2px;color:#0369a1}
  .ace-footer-copy{max-width:820px;color:#475569;font-size:13px;line-height:1.8}
  .ace-footer-copy h3{margin:23px 0 7px;color:#0f172a;font-size:15px;font-weight:850}
  .ace-footer-copy p{margin:8px 0}
  .ace-footer-copy ul{padding-left:20px;list-style:disc}
  .ace-footer-copy li{margin:6px 0}
  .ace-footer-empty{grid-column:1/-1;border:1px dashed #cbd5e1;border-radius:18px;padding:28px;text-align:center;color:#64748b;font-size:13px}
  .ace-footer-legal-note{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:14px;color:#64748b;font-size:10px;line-height:1.6}
  @media(max-width:640px){.ace-footer-dialog{width:calc(100% - 14px);max-height:94vh;border-radius:22px}.ace-footer-shell{max-height:94vh}.ace-footer-head{padding:19px}.ace-footer-grid{grid-template-columns:1fr}.ace-footer-select{flex:1}.ace-footer-content{padding:16px}}
  @media(prefers-reduced-motion:reduce){.ace-footer-dialog *{scroll-behavior:auto!important;transition:none!important}}
`;

const dialog = document.createElement("dialog");
dialog.className = "ace-footer-dialog";
dialog.id = "ace-footer-dialog";
dialog.setAttribute("aria-labelledby", "ace-footer-title");
dialog.innerHTML = `
  <div class="ace-footer-shell">
    <header class="ace-footer-head">
      <div><p class="ace-footer-kicker">ACE-USF · Official portal</p><h2 class="ace-footer-title" id="ace-footer-title">Explore the fellowship</h2><p class="ace-footer-subtitle" id="ace-footer-subtitle">Useful information and official ways to connect with the community.</p></div>
      <button class="ace-footer-close" type="button" data-footer-close aria-label="Close this panel">×</button>
    </header>
    <div class="ace-footer-content">
      <section class="ace-footer-view" data-footer-view="campuses" hidden>
        <div class="ace-footer-callout"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Browse institutions currently listed in the portal. Fellowship presence and contact details vary by campus; use the campus directory for current local information.</span></div>
        <div class="ace-footer-toolbar">
          <label class="ace-footer-search">${icon("fa-magnifying-glass")}<input type="search" data-campus-search placeholder="Search university, college, or region…" aria-label="Search campus institutions"></label>
          <select class="ace-footer-select" data-campus-region aria-label="Filter by region"><option value="">All regions</option>${regions.map(region => `<option value="${escapeHTML(region)}">${escapeHTML(region)}</option>`).join("")}</select>
        </div>
        <p class="text-xs font-semibold text-slate-500 mb-3" data-campus-count aria-live="polite"></p><div class="ace-footer-grid" data-campus-results></div>
        <button type="button" class="ace-footer-primary" data-campus-open-directory>${icon("fa-sitemap")}Open the full Campus Network</button>
      </section>
      <section class="ace-footer-view" data-footer-view="connect" hidden>
        <p class="mb-5 max-w-3xl text-sm leading-6 text-slate-600">Use verified links below to reach ACE-USF and Apostolic Church channels. External links open in a new tab.</p>
        <div class="ace-footer-grid">
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-robot")}</span><h3>ACE-USF Assistant</h3><p>Ask about the portal, request help, and reach the support workflow in Telegram.</p><a class="ace-footer-card-action" href="${BOT_URL}" target="_blank" rel="noopener noreferrer">Open assistant ${icon("fa-arrow-up-right-from-square")}</a></article>
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-tower-broadcast")}</span><h3>Apostolic Media</h3><p>Open the Apostolic Media Telegram channel for church media and updates.</p><a class="ace-footer-card-action" href="${MEDIA_URL}" target="_blank" rel="noopener noreferrer">Open Telegram channel ${icon("fa-arrow-up-right-from-square")}</a></article>
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-circle-play")}</span><h3>Official YouTube</h3><p>Visit the official Apostolic Church of Ethiopia YouTube channel.</p><a class="ace-footer-card-action" href="${YOUTUBE_URL}" target="_blank" rel="noopener noreferrer">Watch on YouTube ${icon("fa-arrow-up-right-from-square")}</a></article>
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-church")}</span><h3>Apostolic Church of Ethiopia</h3><p>Visit the church’s official website for church information and resources.</p><a class="ace-footer-card-action" href="${CHURCH_URL}" target="_blank" rel="noopener noreferrer">Visit acieth.org ${icon("fa-arrow-up-right-from-square")}</a></article>
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-envelope")}</span><h3>Email the portal team</h3><p>Send a question or request an update to the contact address shown by ACE-USF.</p><a class="ace-footer-card-action" href="mailto:info@aceusf.org?subject=ACE-USF%20Portal%20question">Compose email ${icon("fa-arrow-up-right-from-square")}</a></article>
        </div>
      </section>
      <section class="ace-footer-view" data-footer-view="contact" hidden>
        <div class="ace-footer-callout"><i class="fa-solid fa-life-ring" aria-hidden="true"></i><span>For the quickest portal support, message the ACE-USF Assistant. You can also email the portal team. Never send passwords, verification codes, or private financial details.</span></div>
        <div class="ace-footer-grid">
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-robot")}</span><h3>Message the support bot</h3><p>Describe the issue in Telegram. Support reports can be routed to the administrator even when they are offline.</p><a class="ace-footer-card-action" href="${BOT_URL}" target="_blank" rel="noopener noreferrer">Open ACE-USF Assistant ${icon("fa-arrow-up-right-from-square")}</a></article>
          <article class="ace-footer-card"><span class="ace-footer-card-icon">${icon("fa-envelope-open-text")}</span><h3>Email the portal team</h3><p>Include the page name and what happened. Please avoid sending sensitive account credentials.</p><a class="ace-footer-card-action" href="mailto:info@aceusf.org?subject=ACE-USF%20Portal%20support">Email info@aceusf.org ${icon("fa-arrow-up-right-from-square")}</a></article>
        </div>
      </section>
      <section class="ace-footer-view" data-footer-view="privacy" hidden>
        <article class="ace-footer-copy">
          <div class="ace-footer-callout"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i><span>This notice explains the intended handling of information in the ACE-USF portal. The administrator should keep it aligned with the services and data practices actually enabled on the site.</span></div>
          <p><strong>Last updated: October 18, 2026</strong></p>
          <h3>Information you provide</h3><p>Depending on which features you use, the portal may process account and profile details, campus or fellowship information, messages, support reports, meeting access requests, and advice or testimony submissions. Do not submit passwords, verification codes, or information you do not want shared with the relevant fellowship administrators.</p>
          <h3>How information is used</h3><p>Information is used to provide the portal features you request, support fellowship coordination, review access requests, respond to support issues, and maintain the service. A request or submission may be visible to administrators responsible for that feature.</p>
          <h3>Storage and third-party services</h3><p>The portal uses Firebase services for sign-in and data features and Telegram for bot communications. Those providers process information under their own terms and privacy notices. Data may remain in these services until the portal administrator removes it or the provider’s retention controls apply.</p>
          <h3>Your choices and questions</h3><p>Share only information needed for a feature. To ask about correcting or removing portal information, contact the administrator using the support bot or email link. The portal team should verify your identity before changing account records.</p>
          <p class="ace-footer-legal-note">This page is a plain-language portal notice, not a substitute for an organization-approved privacy policy. Confirm the actual retention, access, and deletion practices before treating it as the final official policy.</p>
        </article>
      </section>
      <section class="ace-footer-view" data-footer-view="terms" hidden>
        <article class="ace-footer-copy">
          <div class="ace-footer-callout"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i><span>Use the portal respectfully and follow the access rules shown inside each room. Restricted spaces require administrator approval.</span></div>
          <p><strong>Last updated: October 18, 2026</strong></p>
          <h3>Using the portal</h3><p>Use accurate information, protect your sign-in credentials, and use the portal for fellowship, learning, and support purposes. Do not impersonate another person, disrupt services, misuse contact information, or upload content you do not have permission to share.</p>
          <h3>Meetings and submitted content</h3><p>Submitting a meeting request does not grant access; wait for the administrator’s decision. Do not attempt to enter a restricted meeting without approval. Advice, audio, testimony, and other submissions may be reviewed by administrators before they are published or shared.</p>
          <h3>Content and service availability</h3><p>Users remain responsible for content they submit and must respect the rights and privacy of others. Portal information and campus listings can change; verify time-sensitive details with the relevant fellowship. The portal may be updated or temporarily unavailable as it is maintained.</p>
          <h3>Questions</h3><p>Contact the portal team through the ACE-USF Assistant or the email link in Connect With Us.</p>
          <p class="ace-footer-legal-note">This is a starter usage notice for the portal. Have the responsible ACE-USF leadership review and approve the final terms before presenting them as binding organizational terms.</p>
        </article>
      </section>
    </div>
  </div>`;

const style = document.createElement("style");
style.textContent = styles;
document.head.append(style);
document.body.append(dialog);

const titleByView = {
  campuses: ["Campus Networks", "Find institutions listed across Ethiopia and continue to the live campus directory."],
  connect: ["Connect With Us", "Official channels and support options for the ACE-USF community."],
  contact: ["Contact Admin", "Choose a support channel and tell the team what you need."],
  privacy: ["Privacy Policy", "How portal information is intended to be handled."],
  terms: ["Terms of Service", "A clear guide for using portal features and community spaces."]
};

function renderCampusResults() {
  const results = dialog.querySelector("[data-campus-results]");
  const count = dialog.querySelector("[data-campus-count]");
  if (!results || !count) return;
  const query = (dialog.querySelector("[data-campus-search]")?.value || "").trim().toLocaleLowerCase();
  const region = dialog.querySelector("[data-campus-region]")?.value || "";
  const matches = ethiopianInstitutions.filter(item =>
    (!region || item.region === region) &&
    `${item.name} ${item.region} ${item.type}`.toLocaleLowerCase().includes(query)
  );
  count.textContent = `${matches.length} institution${matches.length === 1 ? "" : "s"} listed`;
  results.innerHTML = matches.length ? matches.map(item => `
    <article class="ace-footer-card">
      <span class="ace-footer-card-icon">${icon(item.type === "Private" ? "fa-building-columns" : "fa-graduation-cap")}</span>
      <h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.region)}</p>
      <div class="ace-footer-card-meta"><span class="ace-footer-pill">${icon("fa-building")} ${escapeHTML(item.type || "Institution")}</span></div>
      <button type="button" class="ace-footer-secondary" data-campus-open-directory>View campus network ${icon("fa-arrow-right")}</button>
    </article>`).join("") : `<div class="ace-footer-empty">${icon("fa-magnifying-glass mb-2 text-lg")}<br>No listed institutions match. Try another search or select a different region.</div>`;
}

function openView(view, opener) {
  if (!titleByView[view]) return;
  const [title, subtitle] = titleByView[view];
  dialog.querySelector("#ace-footer-title").textContent = title;
  dialog.querySelector("#ace-footer-subtitle").textContent = subtitle;
  dialog.querySelectorAll("[data-footer-view]").forEach(panel => { panel.hidden = panel.dataset.footerView !== view; });
  dialog.dataset.view = view;
  if (view === "campuses") renderCampusResults();
  if (!dialog.open) {
    dialog.showModal();
    dialog.dataset.returnFocus = opener?.id || "";
  }
  dialog.querySelector("[data-footer-close]")?.focus();
}

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
  if (event.target.closest("[data-footer-close]")) dialog.close();
  if (event.target.closest("[data-campus-open-directory]")) {
    dialog.close();
    document.getElementById("nav-campus-network")?.click();
  }
});
dialog.addEventListener("close", () => {
  const returnId = dialog.dataset.returnFocus;
  if (returnId) document.getElementById(returnId)?.focus();
  else document.querySelector(`[data-footer-room="${dialog.dataset.view}"]`)?.focus();
});
dialog.querySelector("[data-campus-search]")?.addEventListener("input", renderCampusResults);
dialog.querySelector("[data-campus-region]")?.addEventListener("change", renderCampusResults);

document.addEventListener("click", event => {
  const trigger = event.target.closest("[data-footer-room]");
  if (!trigger) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openView(trigger.dataset.footerRoom, trigger);
});
