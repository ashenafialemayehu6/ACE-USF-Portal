// ACE-USF Student Forum room
// Accessible, responsive discussion UI with local browser storage.

const STORAGE_KEY = "ace-usf-student-forum-v1";
const CATEGORIES = ["All conversations", "Testimony", "Prayer request", "Campus advice", "Fellowship news", "Encouragement"];

let callbacks = {};
let dashboardSnapshot = [];
let returnFocusTarget = null;
let currentRoom = null;
let activeCategory = "All conversations";
let searchQuery = "";
let replyTargetId = null;
let userPosts = loadUserPosts();
let samplePosts = createSamplePosts();

export function setupStudentForumRoom(options = {}) {
  callbacks = options;
  const room = document.getElementById("student-forum-room-view");
  if (!room || room.dataset.studentForumReady === "true") return;
  room.dataset.studentForumReady = "true";

  document.addEventListener("click", handlePortalClick, true);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isStudentForumRoomOpen()) closeStudentForumRoom();
  });
  window.addEventListener("aceusf-auth-changed", refreshComposerForAuth);
}

function handlePortalClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (target.closest("#student-forum-room-close")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeStudentForumRoom();
    return;
  }

  const trigger = target.closest('a[data-open-student-forum], a[href="#forum-section"]');
  if (trigger) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openStudentForumRoom(trigger);
    return;
  }

  // Other portal navigation closes the room first, then continues to its handler.
  if (isStudentForumRoomOpen() && target.closest("a")) {
    closeStudentForumRoom();
  }
}

function openStudentForumRoom(trigger) {
  const room = document.getElementById("student-forum-room-view");
  const roomSlot = document.getElementById("student-forum-home-slot");
  const roomContent = document.getElementById("student-forum-room-content");
  const dashboard = document.getElementById("app-dashboard");
  if (!room || !roomSlot || !roomContent || !dashboard || isStudentForumRoomOpen()) return;

  returnFocusTarget = trigger instanceof HTMLElement ? trigger : document.activeElement;
  dashboardSnapshot = [...dashboard.childNodes];
  dashboard.replaceChildren(room);
  room.classList.remove("hidden");
  room.setAttribute("aria-hidden", "false");

  buildForumRoom();
  roomContent.replaceChildren(currentRoom.page);
  renderFeed();
  callbacks.onOpen?.();
  document.getElementById("student-forum-room-close")?.focus();

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  room.scrollIntoView({ behavior, block: "start" });
}

export function closeStudentForumRoom() {
  const room = document.getElementById("student-forum-room-view");
  const roomSlot = document.getElementById("student-forum-home-slot");
  const roomContent = document.getElementById("student-forum-room-content");
  const dashboard = document.getElementById("app-dashboard");
  if (!room || !roomSlot || !roomContent || !dashboard || !isStudentForumRoomOpen()) return;

  roomContent.replaceChildren();
  room.classList.add("hidden");
  room.setAttribute("aria-hidden", "true");
  dashboard.replaceChildren(...dashboardSnapshot);
  roomSlot.append(room);

  dashboardSnapshot = [];
  currentRoom = null;
  replyTargetId = null;
  if (returnFocusTarget instanceof HTMLElement) returnFocusTarget.focus();
  returnFocusTarget = null;
  callbacks.onClose?.();
}

export function isStudentForumRoomOpen() {
  return document.getElementById("student-forum-room-view")?.classList.contains("hidden") === false;
}

function buildForumRoom() {
  const page = makeElement("div", "space-y-5 sm:space-y-6");

  const hero = makeElement("section", "relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-950 px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9");
  hero.setAttribute("aria-labelledby", "forum-welcome-title");
  const glow = makeElement("div", "pointer-events-none absolute -right-12 -top-12 -z-10 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl");
  glow.setAttribute("aria-hidden", "true");
  const glowTwo = makeElement("div", "pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl");
  glowTwo.setAttribute("aria-hidden", "true");
  hero.append(glow, glowTwo);

  const heroInner = makeElement("div", "relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end");
  const heroCopy = makeElement("div", "max-w-3xl");
  heroCopy.append(
    makeEyebrow("A welcoming space across campuses", "fa-solid fa-sparkles"),
    makeText("h3", "mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl", "Faith, friendship, and student life—together."),
    makeText("p", "mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base", "Share a testimony, ask for prayer, exchange campus wisdom, and encourage fellow students in a thoughtful community shaped by faith.")
  );

  const heroActions = makeElement("div", "flex flex-wrap items-center gap-3");
  const writeButton = makeButton("Write a post", "rounded-xl bg-amber-400 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white", "fa-solid fa-pen-to-square");
  writeButton.addEventListener("click", () => {
    const composer = currentRoom?.composer;
    if (!isSignedIn()) {
      callbacks.openSignIn?.();
      return;
    }
    composer?.scrollIntoView({ behavior: "smooth", block: "center" });
    composer?.querySelector("textarea")?.focus({ preventScroll: true });
  });
  heroActions.append(writeButton);
  heroInner.append(heroCopy, heroActions);
  hero.append(heroInner);

  const stats = makeElement("div", "grid grid-cols-2 gap-3 sm:grid-cols-4");
  const statsPosts = makeStatCard("0", "Conversations", "fa-regular fa-comments", "text-teal-800", "bg-teal-50");
  const statsTopics = makeStatCard(String(CATEGORIES.length - 1), "Ways to connect", "fa-solid fa-shapes", "text-indigo-800", "bg-indigo-50");
  const statsCampus = makeStatCard(getCurrentUser()?.campus || "All campuses", "Your community", "fa-solid fa-location-dot", "text-amber-800", "bg-amber-50");
  const statsStatus = makeStatCard(isSignedIn() ? "Member" : "Welcome", "Your place here", "fa-solid fa-heart", "text-rose-800", "bg-rose-50");
  stats.append(statsPosts.card, statsTopics.card, statsCampus.card, statsStatus.card);

  const columns = makeElement("div", "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]");
  const mainColumn = makeElement("div", "min-w-0 space-y-5");
  const composer = buildComposer();
  const discussionPanel = buildDiscussionPanel();
  mainColumn.append(composer, discussionPanel.panel);

  const sideColumn = makeElement("aside", "space-y-4");
  sideColumn.setAttribute("aria-label", "Forum information");
  sideColumn.append(buildCommunityCard(), buildGuidelinesCard(), buildLocalStorageNote());
  columns.append(mainColumn, sideColumn);
  page.append(hero, stats, columns);

  currentRoom = {
    page,
    postsCount: statsPosts.value,
    campusValue: statsCampus.value,
    statusValue: statsStatus.value,
    composer,
    ...discussionPanel
  };
  refreshStats();
  return currentRoom;
}

function buildComposer() {
  const card = makeElement("section", "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6");
  card.id = "forum-composer-card";
  card.setAttribute("aria-labelledby", "forum-composer-title");
  const user = getCurrentUser();

  if (!user) {
    card.classList.add("border-teal-100", "bg-gradient-to-br", "from-white", "to-teal-50");
    card.append(
      makeText("p", "text-[10px] font-black uppercase tracking-[.17em] text-teal-800", "Join the conversation"),
      makeText("h4", "mt-1 text-lg font-extrabold text-slate-900", "Your voice belongs here."),
      makeText("p", "mt-2 text-xs leading-5 text-slate-600", "Sign in to share a testimony, prayer request, or helpful campus advice with fellow students." )
    );
    const button = makeButton("Sign in to post", "mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700", "fa-solid fa-arrow-right-to-bracket");
    button.addEventListener("click", () => callbacks.openSignIn?.());
    card.append(button);
    return card;
  }

  const heading = makeElement("div", "mb-4 flex items-start gap-3");
  heading.append(
    makeIconTile("fa-solid fa-pen-to-square", "bg-amber-100 text-amber-800"),
    makeElement("div", "min-w-0")
  );
  const headingCopy = heading.lastElementChild;
  headingCopy.append(
    makeText("h4", "text-base font-extrabold text-slate-900", "Start a conversation"),
    makeText("p", "mt-1 text-[11px] leading-5 text-slate-500", "A few sincere words can make another student's day brighter.")
  );
  card.append(heading);

  const form = makeElement("form", "space-y-3");
  form.noValidate = true;
  const message = makeElement("textarea", "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10");
  message.id = "forum-compose-message";
  message.maxLength = 600;
  message.required = true;
  message.setAttribute("aria-label", "Write your forum post");
  message.placeholder = "Share an encouragement, testimony, prayer request, or practical campus tip…";

  const row = makeElement("div", "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between");
  const category = makeElement("select", "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 sm:w-auto");
  category.setAttribute("aria-label", "Choose a post topic");
  ["Encouragement", "Testimony", "Prayer request", "Campus advice", "Fellowship news"].forEach(name => {
    const option = makeElement("option", "", name);
    option.value = name;
    category.append(option);
  });
  const actions = makeElement("div", "flex items-center justify-between gap-3 sm:justify-end");
  const count = makeText("span", "text-[10px] font-medium text-slate-400", "0 / 600");
  count.setAttribute("aria-live", "polite");
  const submit = makeButton("Publish post", "inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500", "fa-solid fa-paper-plane");
  submit.type = "submit";
  actions.append(count, submit);
  row.append(category, actions);

  const error = makeText("p", "hidden text-xs font-semibold text-rose-700");
  error.setAttribute("role", "alert");
  message.addEventListener("input", () => { count.textContent = `${message.value.length} / 600`; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = message.value.trim();
    if (!text) {
      error.textContent = "Write a message before publishing.";
      error.classList.remove("hidden");
      message.focus();
      return;
    }
    error.classList.add("hidden");
    const member = getCurrentUser();
    if (!member) {
      callbacks.openSignIn?.();
      return;
    }
    userPosts.unshift({
      id: makeId(), author: member.displayName || "ACE-USF Member", campus: member.campus || "ACE-USF campus community",
      category: category.value, content: text, createdAt: Date.now(), likes: 0, likedByMe: false, replies: [], sample: false
    });
    saveUserPosts();
    message.value = "";
    count.textContent = "0 / 600";
    activeCategory = "All conversations";
    renderFeed();
    refreshStats();
    currentRoom.feedPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  form.append(message, row, error);
  card.append(form, makeText("p", "mt-3 text-[10px] leading-4 text-slate-400", "Please avoid sharing private details about yourself or another person."));
  return card;
}

function buildDiscussionPanel() {
  const panel = makeElement("section", "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm");
  panel.setAttribute("aria-labelledby", "forum-discussions-title");
  const top = makeElement("div", "border-b border-slate-100 p-5 sm:p-6");
  const titleRow = makeElement("div", "flex flex-wrap items-start justify-between gap-3");
  const copy = makeElement("div", "min-w-0");
  copy.append(
    makeText("p", "text-[10px] font-black uppercase tracking-[.17em] text-teal-700", "Across the fellowship"),
    makeText("h4", "mt-1 text-lg font-extrabold text-slate-900", "Campus conversations")
  );
  copy.lastElementChild.id = "forum-discussions-title";
  const count = makeText("span", "rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-900", "0 posts");
  count.setAttribute("aria-live", "polite");
  titleRow.append(copy, count);

  const searchWrap = makeElement("label", "relative mt-4 block");
  const searchIcon = makeElement("i", "fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400");
  searchIcon.setAttribute("aria-hidden", "true");
  const search = makeElement("input", "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10");
  search.type = "search";
  search.placeholder = "Search stories, topics, or campus names";
  search.setAttribute("aria-label", "Search forum discussions");
  search.addEventListener("input", () => { searchQuery = search.value.trim().toLowerCase(); renderFeed(); });
  searchWrap.append(searchIcon, search);

  const filters = makeElement("div", "mt-4 flex gap-2 overflow-x-auto pb-1");
  filters.setAttribute("role", "group");
  filters.setAttribute("aria-label", "Filter conversations by topic");
  const feed = makeElement("div", "space-y-3 p-4 sm:p-5");
  feed.setAttribute("aria-live", "polite");
  const feedStatus = makeText("p", "sr-only", "");
  feedStatus.setAttribute("aria-live", "polite");
  top.append(titleRow, searchWrap, filters);
  panel.append(top, feed, feedStatus);

  return { panel, feedPanel: panel, feed, filters, count, search, feedStatus };
}

function buildCommunityCard() {
  const card = makeElement("section", "rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 shadow-sm");
  card.append(
    makeText("p", "text-[10px] font-black uppercase tracking-[.16em] text-indigo-700", "A community across campuses"),
    makeText("h4", "mt-2 text-base font-extrabold text-slate-900", "You are not walking alone."),
    makeText("p", "mt-2 text-xs leading-5 text-slate-600", "Meet students who understand university life and want to encourage one another in faith, learning, and service.")
  );
  const tags = makeElement("div", "mt-4 flex flex-wrap gap-2");
  ["Faith", "Learning", "Fellowship"].forEach((tag, index) => {
    const color = ["bg-teal-100 text-teal-900", "bg-amber-100 text-amber-900", "bg-purple-100 text-purple-900"][index];
    tags.append(makeText("span", `rounded-full px-2.5 py-1 text-[9px] font-bold ${color}`, tag));
  });
  card.append(tags);
  return card;
}

function buildGuidelinesCard() {
  const card = makeElement("section", "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm");
  card.setAttribute("aria-labelledby", "forum-guidelines-title");
  card.append(
    makeText("p", "text-[10px] font-black uppercase tracking-[.16em] text-teal-700", "Our shared values"),
    makeText("h4", "mt-1 text-sm font-extrabold text-slate-900", "Make this a good place to be")
  );
  card.lastElementChild.id = "forum-guidelines-title";
  const items = [
    ["fa-solid fa-heart", "Encourage with kindness"],
    ["fa-solid fa-ear-listen", "Listen with respect"],
    ["fa-solid fa-shield-halved", "Protect one another's privacy"]
  ];
  const list = makeElement("ul", "mt-4 space-y-3");
  items.forEach(([icon, label]) => {
    const item = makeElement("li", "flex items-center gap-2.5 text-[11px] font-medium text-slate-600");
    item.append(makeIconTile(icon, "h-7 w-7 rounded-lg bg-slate-50 text-teal-800"), document.createTextNode(label));
    list.append(item);
  });
  card.append(list);
  return card;
}

function buildLocalStorageNote() {
  const card = makeElement("aside", "rounded-xl border border-amber-200 bg-amber-50/80 p-4");
  card.append(
    makeText("p", "flex items-center gap-2 text-[10px] font-extrabold text-amber-950", "Local forum preview", "fa-solid fa-circle-info"),
    makeText("p", "mt-2 text-[10px] leading-4 text-amber-950/80", "This forum preview saves posts in this browser. A connected shared service is needed for posts to appear on other users' devices.")
  );
  return card;
}

function renderFeed() {
  if (!currentRoom) return;
  currentRoom.filters.replaceChildren();
  CATEGORIES.forEach(category => {
    const active = activeCategory === category;
    const button = makeElement("button", `shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${active ? "bg-teal-800 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`, category);
    button.type = "button";
    button.setAttribute("aria-pressed", String(active));
    button.addEventListener("click", () => { activeCategory = category; renderFeed(); });
    currentRoom.filters.append(button);
  });

  const visible = getAllPosts().filter(post => {
    const categoryMatches = activeCategory === "All conversations" || post.category.toLowerCase() === activeCategory.toLowerCase();
    const text = `${post.author} ${post.campus} ${post.category} ${post.content}`.toLowerCase();
    return categoryMatches && (!searchQuery || text.includes(searchQuery));
  });
  currentRoom.count.textContent = `${visible.length} ${visible.length === 1 ? "post" : "posts"}`;
  currentRoom.feedStatus.textContent = `${visible.length} ${visible.length === 1 ? "conversation" : "conversations"} shown`;
  currentRoom.feed.replaceChildren();

  if (!visible.length) {
    const empty = makeElement("div", "rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center");
    empty.append(
      makeIconTile("fa-regular fa-comments", "mx-auto h-12 w-12 rounded-2xl bg-white text-slate-400 shadow-sm"),
      makeText("h5", "mt-3 text-sm font-extrabold text-slate-800", "No conversations found"),
      makeText("p", "mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500", "Try another topic or search term. You can start a conversation to get things going.")
    );
    currentRoom.feed.append(empty);
    return;
  }
  visible.forEach(post => currentRoom.feed.append(buildPostCard(post)));
}

function buildPostCard(post) {
  const card = makeElement("article", "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md sm:p-5");
  const header = makeElement("div", "flex items-start justify-between gap-3");
  const person = makeElement("div", "flex min-w-0 items-center gap-3");
  const avatar = makeText("span", "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-800 to-indigo-900 text-sm font-black text-white shadow-sm", initials(post.author));
  avatar.setAttribute("aria-hidden", "true");
  const identity = makeElement("div", "min-w-0");
  identity.append(
    makeText("h5", "truncate text-xs font-extrabold text-slate-900", post.author),
    makeText("p", "mt-0.5 truncate text-[10px] text-slate-500", post.campus || "ACE-USF community")
  );
  person.append(avatar, identity);

  const topic = makeElement("span", "shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold text-indigo-800", post.category);
  header.append(person, topic);
  card.append(header);
  if (post.sample) card.append(makeText("p", "mt-3 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500", "Community sample"));
  card.append(makeText("p", "mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700", post.content));

  const footer = makeElement("div", "mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3");
  footer.append(makeText("span", "text-[10px] text-slate-400", formatPostDate(post.createdAt)));
  const actions = makeElement("div", "flex items-center gap-2");
  const likeButton = makeButton(`${post.likes || 0}  ${post.likedByMe ? "Liked" : "Like"}`, `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${post.likedByMe ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-rose-50 hover:text-rose-700"}`, post.likedByMe ? "fa-solid fa-heart" : "fa-regular fa-heart");
  likeButton.type = "button";
  likeButton.setAttribute("aria-pressed", String(Boolean(post.likedByMe)));
  likeButton.addEventListener("click", () => {
    const found = getAllPosts().find(item => item.id === post.id);
    if (!found) return;
    found.likedByMe = !found.likedByMe;
    found.likes = Math.max(0, (found.likes || 0) + (found.likedByMe ? 1 : -1));
    if (!found.sample) saveUserPosts();
    renderFeed();
  });
  const replyButton = makeButton(`${(post.replies || []).length}  Reply`, "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold text-slate-500 transition hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400", "fa-regular fa-comment");
  replyButton.type = "button";
  replyButton.addEventListener("click", () => {
    if (!isSignedIn()) {
      callbacks.openSignIn?.();
      return;
    }
    replyTargetId = replyTargetId === post.id ? null : post.id;
    renderFeed();
    if (replyTargetId) currentRoom.feed.querySelector(`#reply-input-${cssSafeId(post.id)}`)?.focus();
  });
  actions.append(likeButton, replyButton);
  footer.append(actions);
  card.append(footer);

  if (post.replies?.length) {
    const replies = makeElement("div", "mt-3 space-y-2 border-l-2 border-teal-100 pl-3");
    post.replies.slice(-3).forEach(reply => {
      const replyBox = makeElement("div", "rounded-xl bg-slate-50 px-3 py-2");
      replyBox.append(makeText("p", "text-[10px] font-bold text-slate-700", reply.author), makeText("p", "mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-600", reply.content));
      replies.append(replyBox);
    });
    card.append(replies);
  }

  if (replyTargetId === post.id) card.append(buildReplyForm(post));
  return card;
}

function buildReplyForm(post) {
  const form = makeElement("form", "mt-3 flex items-start gap-2");
  const input = makeElement("input", "min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10");
  input.id = `reply-input-${cssSafeId(post.id)}`;
  input.maxLength = 240;
  input.placeholder = "Write a kind, helpful reply…";
  input.setAttribute("aria-label", "Write a reply");
  const submit = makeButton("Reply", "rounded-xl bg-slate-900 px-3 py-2.5 text-[10px] font-bold text-white transition hover:bg-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500", "fa-solid fa-reply");
  submit.type = "submit";
  form.append(input, submit);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value.trim();
    const member = getCurrentUser();
    const found = getAllPosts().find(item => item.id === post.id);
    if (!text || !member || !found) return;
    found.replies ||= [];
    found.replies.push({ author: member.displayName || "ACE-USF Member", content: text, createdAt: Date.now() });
    if (!found.sample) saveUserPosts();
    replyTargetId = null;
    renderFeed();
  });
  return form;
}

function makeStatCard(value, label, icon, iconColor, iconBg) {
  const card = makeElement("div", "flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4");
  const iconTile = makeIconTile(icon, `h-10 w-10 shrink-0 rounded-xl ${iconBg} ${iconColor}`);
  const copy = makeElement("div", "min-w-0");
  const valueNode = makeText("p", "truncate text-sm font-black text-slate-900", value);
  valueNode.title = value;
  copy.append(valueNode, makeText("p", "mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500", label));
  card.append(iconTile, copy);
  return { card, value: valueNode };
}

function refreshStats() {
  if (!currentRoom) return;
  const count = getAllPosts().length;
  currentRoom.postsCount.textContent = String(count);
  const campus = getCurrentUser()?.campus || "All campuses";
  currentRoom.campusValue.textContent = campus;
  currentRoom.campusValue.title = campus;
  currentRoom.statusValue.textContent = isSignedIn() ? "Member" : "Welcome";
}

function refreshComposerForAuth() {
  if (!currentRoom || !isStudentForumRoomOpen()) return;
  if (!currentRoom.composer?.isConnected) return;
  const replacement = buildComposer();
  currentRoom.composer.replaceWith(replacement);
  currentRoom.composer = replacement;
  refreshStats();
}

function makeEyebrow(label, icon) {
  const node = makeText("p", "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-teal-100", label);
  node.prepend(makeElement("i", `${icon} text-amber-300`));
  return node;
}

function makeIconTile(icon, classes) {
  const tile = makeElement("span", `inline-flex shrink-0 items-center justify-center ${classes}`);
  const glyph = makeElement("i", icon);
  glyph.setAttribute("aria-hidden", "true");
  tile.append(glyph);
  return tile;
}

function makeButton(label, classes, icon = "") {
  const button = makeElement("button", classes);
  button.type = "button";
  if (icon) {
    const glyph = makeElement("i", `${icon} mr-1.5`);
    glyph.setAttribute("aria-hidden", "true");
    button.append(glyph);
  }
  button.append(document.createTextNode(label));
  return button;
}

function makeText(tag, classes, text = "", icon = "") {
  const node = makeElement(tag, classes);
  if (icon) {
    const glyph = makeElement("i", `${icon} mr-2`);
    glyph.setAttribute("aria-hidden", "true");
    node.append(glyph);
  }
  node.append(document.createTextNode(text));
  return node;
}

function makeElement(tag, classes = "") {
  const node = document.createElement(tag);
  if (classes) node.className = classes;
  return node;
}

function getCurrentUser() {
  return callbacks.getCurrentUser?.() || null;
}

function isSignedIn() {
  return Boolean(callbacks.isSignedIn?.() || getCurrentUser());
}

function getAllPosts() {
  return [...userPosts, ...samplePosts].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

function createSamplePosts() {
  const now = Date.now();
  return [
    { id: "sample-welcome", author: "ACE-USF Community", campus: "All campuses", category: "Fellowship news", content: "Welcome to the Student Forum—a place to encourage one another, share campus fellowship updates, and grow together in faith. What is one good thing happening in your campus community this week?", createdAt: now - 1000 * 60 * 24, likes: 4, likedByMe: false, replies: [], sample: true },
    { id: "sample-testimony", author: "Campus fellowship member", campus: "Student life", category: "Testimony", content: "Exam season felt overwhelming, but setting aside time to pray and study with friends helped me keep going. Grateful for the people who encouraged me.", createdAt: now - 1000 * 60 * 60 * 5, likes: 7, likedByMe: false, replies: [], sample: true },
    { id: "sample-advice", author: "Fellow student", campus: "Campus advice", category: "Campus advice", content: "A small tip that helped me: plan study blocks with short breaks, then leave a little time in the week for fellowship and rest. What helps you stay balanced?", createdAt: now - 1000 * 60 * 60 * 19, likes: 3, likedByMe: false, replies: [], sample: true }
  ];
}

function loadUserPosts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(post => post && typeof post.content === "string" && typeof post.id === "string") : [];
  } catch {
    return [];
  }
}

function saveUserPosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPosts));
  } catch (error) {
    console.warn("Forum posts could not be saved in this browser:", error);
  }
}

function formatPostDate(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function initials(name = "ACE-USF") {
  return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "A";
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cssSafeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}
