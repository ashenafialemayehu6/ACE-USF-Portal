/**
 * js/privacy_service.js
 * Interactive Accordion Privacy Policy & Data Protection Service
 */

const PRIVACY_ITEMS = [
  {
    id: "item-1",
    number: "01",
    title: "Information We Collect",
    icon: "fa-user-shield",
    summary: "Personal student details, university affiliation, and authentication tokens.",
    content: `
      <p class="mb-3">To provide seamless access to campus networks, peer mentorship, and resource sharing, the ACE-USF Portal collects minimal necessary information upon registration:</p>
      <ul class="list-disc list-inside space-y-2 text-slate-600 pl-2">
        <li><strong>Student Identity:</strong> Full name, official university/college name, campus branch, and academic department.</li>
        <li><strong>Contact Credentials:</strong> Primary email address and optional phone contact for fellowship urgent updates or prayer chains.</li>
        <li><strong>Session Logs:</strong> Account credentials managed securely via Firebase Authentication tokens.</li>
      </ul>
    `
  },
  {
    id: "item-2",
    number: "02",
    title: "How Your Data Is Used",
    icon: "fa-diagram-project",
    summary: "Internal fellowship coordination, academic mentorship, and campus communications.",
    content: `
      <p class="mb-3">We strictly prioritize user confidentiality. Your information is <strong>never sold, rented, or distributed</strong> to third-party advertisers or external organizations.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div class="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100">
          <h5 class="font-bold text-teal-900 text-xs mb-1 uppercase tracking-wider">Campus Directory</h5>
          <p class="text-xs text-slate-600">Enabling local fellowship leaders to verify and welcome new Apostolic students on campus.</p>
        </div>
        <div class="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100">
          <h5 class="font-bold text-teal-900 text-xs mb-1 uppercase tracking-wider">Academic Mentorship</h5>
          <p class="text-xs text-slate-600">Matching senior students with junior peers within matching departments or faculties.</p>
        </div>
      </div>
    `
  },
  {
    id: "item-3",
    number: "03",
    title: "Data Security & Infrastructure Protection",
    icon: "fa-lock",
    summary: "HTTPS encryption, Firebase Security Rules, and safe execution standards.",
    content: `
      <p class="mb-3">All portal traffic is protected using industry-standard SSL/TLS encryption. Furthermore, sensitive user sessions are protected using defensive architectural guards (<code>safeExecute</code> wrappers and Firebase Firestore security rule sets) to prevent unauthorized profile access.</p>
    `
  },
  {
    id: "item-4",
    number: "04",
    title: "Spiritual & Prayer Request Confidentiality",
    icon: "fa-hands-praying",
    summary: "Strict privacy safeguards for personal prayer submissions and counselling notes.",
    content: `
      <p class="mb-3">We recognize the sensitive nature of prayer requests and spiritual counselling inquiries. Any prayer request marked as <strong>"Private / Leadership Only"</strong> is restricted strictly to designated campus elders and national spiritual advisors.</p>
    `
  },
  {
    id: "item-5",
    number: "05",
    title: "Your Rights & Account Control",
    icon: "fa-sliders",
    summary: "Update your profile, modify campus choices, or request complete account erasure.",
    content: `
      <p class="mb-3">You retain full authority over your personal information inside the portal. You can edit your university department or request full deletion of your user record by contacting the National Secretariat digital team.</p>
    `
  }
];

export function renderPrivacySection(containerId = "main-content") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <!-- Top Anchor for Smooth Scroll -->
    <div id="privacy-section-top" class="scroll-mt-8"></div>

    <!-- Hero Header -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 md:p-12 text-white shadow-2xl mb-8 border border-slate-800">
      <div class="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10 max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
          <i class="fa-solid fa-shield-halved text-amber-400"></i> Trust & Compliance
        </div>

        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <p class="text-slate-300 text-sm md:text-base leading-relaxed">
          Click on any policy section below to reveal detailed information regarding data protection, student privacy rights, and security standards.
        </p>
      </div>
    </div>

    <!-- Accordion List Container -->
    <div class="space-y-4 max-w-4xl mx-auto mb-12">
      ${PRIVACY_ITEMS.map((item) => `
        <div class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:border-teal-300 transition-all duration-200">
          
          <!-- Accordion Header Button with Direct Inline Toggle Function -->
          <button 
            type="button"
            onclick="
              const panel = document.getElementById('${item.id}');
              const arrow = this.querySelector('.accordion-arrow');
              const isVisible = panel.style.display === 'block';
              
              // Close all other panels first
              document.querySelectorAll('[id^=\\'item-\\']').forEach(p => p.style.display = 'none');
              document.querySelectorAll('.accordion-arrow').forEach(a => {
                a.style.transform = 'rotate(0deg)';
                a.classList.remove('bg-teal-600', 'text-white');
                a.classList.add('bg-slate-100', 'text-slate-500');
              });

              // Toggle current panel
              if (!isVisible) {
                panel.style.display = 'block';
                arrow.style.transform = 'rotate(180deg)';
                arrow.classList.add('bg-teal-600', 'text-white');
                arrow.classList.remove('bg-slate-100', 'text-slate-500');
              }
            "
            class="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition cursor-pointer select-none"
          >
            <div class="flex items-center gap-4 pr-4">
              <span class="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-xs shrink-0 border border-teal-100">
                <i class="fa-solid ${item.icon}"></i>
              </span>
              <div>
                <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span class="text-teal-600 text-xs font-extrabold">#${item.number}</span>${item.title}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">${item.summary}</p>
              </div>
            </div>

            <!-- Expand / Collapse Arrow Icon -->
            <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 transition-transform duration-300 accordion-arrow">
              <i class="fa-solid fa-chevron-down text-xs"></i>
            </div>
          </button>

          <!-- Collapsible Content Panel (Explicitly hidden by default) -->
          <div id="${item.id}" style="display: none;" class="border-t border-slate-100 bg-slate-50/50 p-6 text-sm text-slate-600 leading-relaxed">
            ${item.content}
          </div>

        </div>
      `).join('')}
    </div>
  `;

  // Scroll smoothly to top of view
  setTimeout(() => {
    const topAnchor = document.getElementById("privacy-section-top");
    if (topAnchor) topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}