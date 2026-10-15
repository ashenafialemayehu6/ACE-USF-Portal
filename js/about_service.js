// ACE-USF About section content and renderer.
// Keep official wording and values in ABOUT_CONTENT so they are easy to review and update.
const ABOUT_CONTENT = {
  values: [
    { icon: "fa-cross", title: "Faith in God", text: "Keeping our relationship with God and Christian faith at the center of our lives." },
    { icon: "fa-book-bible", title: "Biblical Foundation", text: "Seeking to understand Scripture and live according to our Apostolic Christian beliefs." },
    { icon: "fa-people-group", title: "Love and Fellowship", text: "Building relationships through love, unity, respect, and mutual encouragement." },
    { icon: "fa-scale-balanced", title: "Integrity", text: "Practicing honesty, responsibility, humility, and consistency in our actions." },
    { icon: "fa-hand-holding-heart", title: "Service", text: "Using our time, knowledge, abilities, and opportunities to serve others." },
    { icon: "fa-seedling", title: "Growth and Learning", text: "Encouraging spiritual development, intellectual growth, discipline, and lifelong learning." },
    { icon: "fa-heart", title: "Compassion", text: "Treating people with kindness, understanding, and respect." },
    { icon: "fa-people-arrows-left-right", title: "Unity in Diversity", text: "Welcoming students across academic disciplines and backgrounds into a respectful fellowship." }
  ],
  foundations: [
    { icon: "fa-book-open", title: "Scripture", text: "Growing in understanding of the Bible and its place in Christian life." },
    { icon: "fa-hands-praying", title: "Prayer", text: "Making room for prayer, reflection, and dependence on God." },
    { icon: "fa-person-rays", title: "Character", text: "Seeking to reflect faith through integrity, humility, love, and compassion." }
  ],
  studentLife: [
    { icon: "fa-cross", title: "Faith", text: "Grow spiritually and deepen understanding of Christian beliefs." },
    { icon: "fa-graduation-cap", title: "Education", text: "Pursue knowledge, curiosity, academic effort, and lifelong learning." },
    { icon: "fa-seedling", title: "Character", text: "Develop discipline, honesty, responsibility, humility, and compassion." },
    { icon: "fa-handshake-angle", title: "Service", text: "Use knowledge and abilities to contribute positively to society." }
  ],
  opportunities: [
    { icon: "fa-hands-praying", title: "Prayer and spiritual growth" },
    { icon: "fa-book-bible", title: "Bible study and scriptural learning" },
    { icon: "fa-people-group", title: "Fellowship and mutual encouragement" },
    { icon: "fa-comments", title: "Faith-based discussions" },
    { icon: "fa-user-graduate", title: "Student support and encouragement" },
    { icon: "fa-compass", title: "Leadership and personal development" },
    { icon: "fa-hand-holding-heart", title: "Community service and compassionate action" },
    { icon: "fa-globe", title: "Interdepartmental and interuniversity fellowship" }
  ]
};

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

function renderIconCard(item, style = "") {
  return `<article class="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg ${style}">
    <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-lg text-teal-800 transition group-hover:bg-teal-800 group-hover:text-amber-300" aria-hidden="true"><i class="fa-solid ${escapeHtml(item.icon)}"></i></div>
    <h3 class="text-sm font-extrabold text-slate-900">${escapeHtml(item.title)}</h3>
    ${item.text ? `<p class="mt-2 text-sm leading-6 text-slate-600">${escapeHtml(item.text)}</p>` : ""}
  </article>`;
}

export function renderAboutSection(targetId = "app-dashboard") {
  const target = document.getElementById(targetId);
  if (!target) {
    console.warn("ACE-USF About section: target container was not found.");
    return;
  }

  target.innerHTML = `
    <div id="ace-about-page" role="region" aria-label="About ACE-USF" class="w-full space-y-7 pb-8 lg:col-span-12">
      <section aria-labelledby="about-hero-title" class="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14 lg:px-14">
        <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_20%,rgba(13,148,136,.32),transparent_44%),radial-gradient(ellipse_at_90%_85%,rgba(245,158,11,.18),transparent_38%)]"></div>
        <div class="absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full border border-white/10"></div><div class="absolute -right-5 -top-12 -z-10 h-56 w-56 rounded-full border border-white/10"></div>
        <div class="grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
          <div class="max-w-3xl">
            <p class="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.18em] text-teal-100"><i class="fa-solid fa-cross text-amber-300" aria-hidden="true"></i> Apostolic Church of Ethiopia University Students Fellowship</p>
            <h1 id="about-hero-title" class="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">About <span class="text-amber-300">ACE-USF</span></h1>
            <p class="mt-5 max-w-2xl text-lg font-semibold leading-8 text-teal-50 sm:text-xl">United in Christ. Growing in Faith. Transforming Campus Life.</p>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">ACE-USF is a student-centered Christian fellowship focused on faith, spiritual growth, fellowship, encouragement, and service. We seek to help students grow spiritually, strengthen relationships, pursue their studies, and live out their faith throughout university life.</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a href="#campus-network" class="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-slate-950"><i class="fa-solid fa-compass" aria-hidden="true"></i> Explore the campus network</a>
              <a href="#about-mission" class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">Discover our purpose <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a>
            </div>
          </div>
          <div class="mx-auto grid w-full max-w-md grid-cols-2 gap-3" aria-label="Four themes of ACE-USF">
            <div class="flex min-h-36 flex-col justify-between rounded-3xl border border-white/10 bg-white/[.07] p-5 backdrop-blur-sm"><i class="fa-solid fa-cross text-2xl text-amber-300" aria-hidden="true"></i><span class="text-sm font-bold">Faith</span></div>
            <div class="mt-8 flex min-h-36 flex-col justify-between rounded-3xl border border-white/10 bg-teal-500/15 p-5 backdrop-blur-sm"><i class="fa-solid fa-book-open text-2xl text-teal-200" aria-hidden="true"></i><span class="text-sm font-bold">Learning</span></div>
            <div class="-mt-8 flex min-h-36 flex-col justify-between rounded-3xl border border-white/10 bg-amber-400/10 p-5 backdrop-blur-sm"><i class="fa-solid fa-people-group text-2xl text-amber-200" aria-hidden="true"></i><span class="text-sm font-bold">Fellowship</span></div>
            <div class="flex min-h-36 flex-col justify-between rounded-3xl border border-white/10 bg-white/[.07] p-5 backdrop-blur-sm"><i class="fa-solid fa-hand-holding-heart text-2xl text-teal-200" aria-hidden="true"></i><span class="text-sm font-bold">Service</span></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-who-title" class="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
        <div><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-800">Our identity</p><h2 id="about-who-title" class="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Who we are</h2></div>
        <div class="space-y-4 text-sm leading-7 text-slate-600 sm:text-base"><p>ACE-USF brings university students together through Christian faith, spiritual development, fellowship, mutual encouragement, and service. It is a space for students to connect, strengthen their faith, encourage one another through university life, and consider their responsibility to their communities.</p><p>We seek to connect spiritual growth with everyday student life—helping students approach their studies, relationships, personal development, and future responsibilities with faith, integrity, compassion, and purpose.</p></div>
      </section>

      <section id="about-mission" class="grid gap-5 lg:grid-cols-2">
        <article class="relative overflow-hidden rounded-3xl bg-teal-900 p-7 text-white shadow-lg sm:p-9"><div class="absolute -right-10 -top-14 h-44 w-44 rounded-full border-[22px] border-white/5" aria-hidden="true"></div><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-200">Why we exist</p><h2 class="mt-3 text-2xl font-black">Our mission</h2><p class="relative mt-5 text-base font-medium leading-8 text-teal-50">Our mission is to encourage university students to grow in their Christian faith, strengthen their relationship with God, build meaningful fellowship with one another, and live with integrity, compassion, and a spirit of service throughout their university journey.</p></article>
        <article class="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-teal-50 p-7 shadow-sm sm:p-9"><div class="absolute -right-12 -bottom-16 h-52 w-52 rounded-full border-[24px] border-teal-900/5" aria-hidden="true"></div><p class="text-[11px] font-black uppercase tracking-[.18em] text-amber-800">The future we hope to build</p><h2 class="mt-3 text-2xl font-black text-slate-950">Our vision</h2><p class="relative mt-5 text-base font-medium leading-8 text-slate-700">To see university students growing in faith, united in Christian fellowship, strengthened in character, and equipped to make a meaningful and positive difference in their campuses, communities, and future professions.</p></article>
      </section>

      <section aria-labelledby="about-values-title" class="rounded-3xl bg-slate-100/80 p-6 sm:p-8"><div class="mb-6 max-w-2xl"><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-800">What guides us</p><h2 id="about-values-title" class="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Our core values</h2><p class="mt-2 text-sm leading-6 text-slate-600">These proposed values are a starting point and can be edited to reflect the fellowship’s officially agreed wording.</p></div><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${ABOUT_CONTENT.values.map(item => renderIconCard(item)).join("")}</div></section>

      <section class="overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm"><div class="grid lg:grid-cols-[.8fr_1.2fr]"><div class="bg-gradient-to-br from-slate-900 via-teal-950 to-teal-900 p-7 text-white sm:p-9"><p class="text-[11px] font-black uppercase tracking-[.18em] text-amber-300">Our faith and foundation</p><h2 class="mt-3 text-2xl font-black">Christ at the center of student life</h2><p class="mt-4 text-sm leading-7 text-teal-50">Our fellowship seeks to place Jesus Christ at the center of student life, encouraging students to grow in their understanding of Scripture, develop a life of prayer, strengthen their Christian character, and support one another in faith.</p></div><div class="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">${ABOUT_CONTENT.foundations.map(item => renderIconCard(item, "border-teal-100")).join("")}</div></div></section>

      <section aria-labelledby="about-community-title" class="grid items-center gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[.8fr_1.2fr]"><div><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-800">People and belonging</p><h2 id="about-community-title" class="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">A fellowship beyond the classroom</h2></div><div class="space-y-4 text-sm leading-7 text-slate-600 sm:text-base"><p>University life is more than lectures, examinations, and academic achievements. It is also a season of growth, discovery, challenges, and preparation for the future.</p><p>ACE-USF seeks to provide a welcoming environment where students can encourage one another, grow in faith, build meaningful relationships, and pursue their university journeys with a deeper sense of purpose.</p></div></section>

      <section aria-labelledby="about-student-life-title" class="rounded-3xl bg-gradient-to-br from-teal-50 to-white p-6 sm:p-8"><div class="mb-6"><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-800">Faith and academic purpose</p><h2 id="about-student-life-title" class="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Growing in every part of student life</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Faith, education, character, and service can complement one another. Learning can also prepare us to contribute thoughtfully to the lives of others.</p></div><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${ABOUT_CONTENT.studentLife.map(item => renderIconCard(item, "bg-white/90")).join("")}</div></section>

      <section aria-labelledby="about-opportunities-title" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-800">Ways students may connect</p><h2 id="about-opportunities-title" class="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">Areas of fellowship and growth</h2></div><p class="max-w-md text-xs leading-5 text-slate-500">These are areas of interest, not a published schedule or a promise that each is currently offered.</p></div><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">${ABOUT_CONTENT.opportunities.map(item => `<div class="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><i class="fa-solid ${escapeHtml(item.icon)} mt-0.5 text-teal-800" aria-hidden="true"></i><p class="text-sm font-bold leading-5 text-slate-700">${escapeHtml(item.title)}</p></div>`).join("")}</div></section>

      <section class="grid items-center gap-5 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 lg:grid-cols-[1fr_auto]"><div><p class="text-[11px] font-black uppercase tracking-[.18em] text-amber-800">Participation and responsibility</p><h2 class="mt-2 text-2xl font-black text-slate-950">Growing together through service and leadership</h2><p class="mt-3 max-w-3xl text-sm leading-7 text-slate-700">A strong fellowship depends on people who encourage one another, take responsibility, serve faithfully, and contribute their abilities. Explore the leaders and campus contacts listed in the Fellowship Leaders Network.</p></div><a href="#hubs-section" class="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-700"><i class="fa-solid fa-user-group" aria-hidden="true"></i> Meet fellowship leaders</a></section>

      <section aria-labelledby="about-digital-title" class="rounded-3xl bg-slate-950 p-6 text-white shadow-lg sm:p-8"><div class="mb-6 max-w-2xl"><p class="text-[11px] font-black uppercase tracking-[.18em] text-amber-300">Our digital fellowship</p><h2 id="about-digital-title" class="mt-2 text-2xl font-black sm:text-3xl">Faith, fellowship, and learning—connected</h2><p class="mt-2 text-sm leading-6 text-slate-300">This website is intended to make fellowship information and digital resources more accessible to students.</p></div><div class="grid gap-4 sm:grid-cols-3"><a href="#apostolic-library" class="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"><i class="fa-solid fa-book-bible text-xl text-amber-300" aria-hidden="true"></i><h3 class="mt-3 font-extrabold">Apostolic Digital Library</h3><p class="mt-1 text-xs leading-5 text-slate-300">Open the library rooms and search resources.</p><span class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber-200">Explore library <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1" aria-hidden="true"></i></span></a><a href="#campus-network" class="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"><i class="fa-solid fa-network-wired text-xl text-teal-200" aria-hidden="true"></i><h3 class="mt-3 font-extrabold">Campus Network</h3><p class="mt-1 text-xs leading-5 text-slate-300">Explore the campus network section.</p><span class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal-100">Visit network <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1" aria-hidden="true"></i></span></a><a href="#hubs-section" class="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"><i class="fa-solid fa-people-group text-xl text-amber-200" aria-hidden="true"></i><h3 class="mt-3 font-extrabold">Fellowship Leaders Network</h3><p class="mt-1 text-xs leading-5 text-slate-300">Find the leaders and campus contacts available on the site.</p><span class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber-100">Meet leaders <i class="fa-solid fa-arrow-right transition group-hover:translate-x-1" aria-hidden="true"></i></span></a></div></section>

      <section class="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[.8fr_1.2fr]"><div><p class="text-[11px] font-black uppercase tracking-[.18em] text-teal-800">Our commitment to students</p><h2 class="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">A place to grow, connect, and serve</h2></div><p class="text-sm leading-7 text-slate-600 sm:text-base">We believe university life offers opportunities not only to gain knowledge but also to develop character, strengthen relationships, grow spiritually, and discover meaningful ways to serve others. ACE-USF seeks to encourage an environment where students can support one another, pursue spiritual growth, learn together, and approach their responsibilities with integrity and compassion.</p></section>

      <section class="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-teal-900 via-slate-900 to-blue-950 px-6 py-9 text-center text-white shadow-xl sm:px-10 sm:py-12"><div class="relative mx-auto max-w-3xl"><p class="text-[11px] font-black uppercase tracking-[.18em] text-amber-300">Your university journey</p><h2 class="mt-3 text-2xl font-black sm:text-4xl">Your university journey can be more meaningful together.</h2><p class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-teal-50">Whether you are beginning university, continuing your studies, exploring your faith, or looking for a community of Christian students, we invite you to learn more about ACE-USF and discover opportunities to grow, connect, and serve.</p><div class="mt-7 flex flex-wrap justify-center gap-3"><a href="#home" id="about-explore-home" class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white"><i class="fa-solid fa-house" aria-hidden="true"></i> Explore ACE-USF</a><button type="button" data-about-action="join" class="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"><i class="fa-solid fa-user-plus" aria-hidden="true"></i> Join / sign in</button><a href="mailto:info@aceusf.org" class="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"><i class="fa-solid fa-envelope" aria-hidden="true"></i> Contact</a></div></div></section>
      <p class="px-1 text-center text-[11px] leading-5 text-slate-500">ACE-USF’s mission, vision, and values here are proposed wording for review. Please confirm the final text with the fellowship before treating it as official.</p>
    </div>`;
  target.querySelector("#about-explore-home")?.addEventListener("click", event => {
    event.preventDefault();
    document.getElementById("nav-home")?.click();
  });
}
