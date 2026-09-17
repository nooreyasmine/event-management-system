/* =========================================================
   EventHub — Event Management System
   Vanilla JS, localStorage-backed, no build step required.
   ========================================================= */

const STORAGE_KEY = "eventhub_events_v1";
const THEME_KEY = "eventhub_theme_v1";
const REG_KEY = "eventhub_registrations_v1";
const USERS_KEY = "eventhub_users_v1";
const SESSION_KEY = "eventhub_session_v1";

/* ---------- State ---------- */
let events = [];
let registrations = []; // { eventId, name, email, joinedAt }
let users = []; // { name, email, password } — demo only, plain text, browser-local
let currentUser = null; // { name, email } | null
let currentView = "grid";
let deleteTargetId = null;

/* ---------- DOM refs ---------- */
const eventsContainer = document.getElementById("eventsContainer");
const emptyState = document.getElementById("emptyState");

const statTotal = document.getElementById("statTotal");
const statUpcoming = document.getElementById("statUpcoming");
const statPast = document.getElementById("statPast");
const statAttendees = document.getElementById("statAttendees");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const sortOrder = document.getElementById("sortOrder");
const gridViewBtn = document.getElementById("gridViewBtn");
const listViewBtn = document.getElementById("listViewBtn");

const formModal = document.getElementById("formModal");
const eventForm = document.getElementById("eventForm");
const formTitle = document.getElementById("formTitle");
const openFormBtn = document.getElementById("openFormBtn");
const emptyCreateBtn = document.getElementById("emptyCreateBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");

const detailsModal = document.getElementById("detailsModal");
const detailsTitle = document.getElementById("detailsTitle");
const detailsBody = document.getElementById("detailsBody");
const closeDetailsBtn = document.getElementById("closeDetailsBtn");

const confirmModal = document.getElementById("confirmModal");
const closeConfirmBtn = document.getElementById("closeConfirmBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const eventTypeSelect = document.getElementById("eventType");
const priceField = document.getElementById("priceField");
const priceInput = document.getElementById("price");

const paymentModal = document.getElementById("paymentModal");
const paymentForm = document.getElementById("paymentForm");
const paySummaryTitle = document.getElementById("paySummaryTitle");
const paySummaryAmount = document.getElementById("paySummaryAmount");
const payEventId = document.getElementById("payEventId");
const closePaymentBtn = document.getElementById("closePaymentBtn");
const cancelPaymentBtn = document.getElementById("cancelPaymentBtn");

const joinModal = document.getElementById("joinModal");
const joinForm = document.getElementById("joinForm");
const joinEventTitle = document.getElementById("joinEventTitle");
const joinEventId = document.getElementById("joinEventId");
const joinNameInput = document.getElementById("joinName");
const closeJoinBtn = document.getElementById("closeJoinBtn");
const cancelJoinBtn = document.getElementById("cancelJoinBtn");

const myEventsBtn = document.getElementById("myEventsBtn");
const myEventsModal = document.getElementById("myEventsModal");
const closeMyEventsBtn = document.getElementById("closeMyEventsBtn");
const myUpcomingTabBtn = document.getElementById("myUpcomingTabBtn");
const myPastTabBtn = document.getElementById("myPastTabBtn");
const myUpcomingList = document.getElementById("myUpcomingList");
const myPastList = document.getElementById("myPastList");

const authButtons = document.getElementById("authButtons");
const userMenu = document.getElementById("userMenu");
const userNameDisplay = document.getElementById("userNameDisplay");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const closeLoginBtn = document.getElementById("closeLoginBtn");
const cancelLoginBtn = document.getElementById("cancelLoginBtn");
const goToSignup = document.getElementById("goToSignup");

const signupModal = document.getElementById("signupModal");
const signupForm = document.getElementById("signupForm");
const closeSignupBtn = document.getElementById("closeSignupBtn");
const cancelSignupBtn = document.getElementById("cancelSignupBtn");
const goToLogin = document.getElementById("goToLogin");

const themeToggle = document.getElementById("themeToggle");
const toastContainer = document.getElementById("toastContainer");

/* =========================================================
   PERSISTENCE
   ========================================================= */
function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    events = raw ? JSON.parse(raw) : seedEvents();
    if (!raw) saveEvents();
  } catch (e) {
    console.error("Failed to load events:", e);
    events = [];
  }
}

function saveEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Failed to save events:", e);
    showToast("Couldn't save — storage may be full.", "error");
  }
}

function loadRegistrations() {
  try {
    const raw = localStorage.getItem(REG_KEY);
    registrations = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load registrations:", e);
    registrations = [];
  }
}

function saveRegistrations() {
  try {
    localStorage.setItem(REG_KEY, JSON.stringify(registrations));
  } catch (e) {
    console.error("Failed to save registrations:", e);
  }
}

function addRegistration(eventId, name, email) {
  // One registration per event per account — update name if re-joined.
  const existing = registrations.find((r) => r.eventId === eventId && r.email === email);
  if (existing) {
    existing.name = name;
    existing.joinedAt = new Date().toISOString();
  } else {
    registrations.push({ eventId, name, email, joinedAt: new Date().toISOString() });
  }
  saveRegistrations();
}

/* =========================================================
   AUTH — demo signup/login (browser-local, no real backend)
   ========================================================= */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    users = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load users:", e);
    users = [];
  }
}

function saveUsers() {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save users:", e);
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    currentUser = null;
  }
}

function saveSession(user) {
  currentUser = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
}

function updateAuthUI() {
  if (currentUser) {
    authButtons.hidden = true;
    userMenu.hidden = false;
    userNameDisplay.textContent = `👤 ${currentUser.name}`;
  } else {
    authButtons.hidden = false;
    userMenu.hidden = true;
  }
}

/* ----- Login modal ----- */
function openLoginModal() {
  loginForm.reset();
  clearAuthErrors(loginForm);
  loginModal.hidden = false;
  document.getElementById("loginEmail").focus();
}
function closeLoginModal() {
  loginModal.hidden = true;
}
loginBtn.addEventListener("click", openLoginModal);
closeLoginBtn.addEventListener("click", closeLoginModal);
cancelLoginBtn.addEventListener("click", closeLoginModal);
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) closeLoginModal();
});
goToSignup.addEventListener("click", (e) => {
  e.preventDefault();
  closeLoginModal();
  openSignupModal();
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearAuthErrors(loginForm);
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  let valid = true;

  if (!email) {
    document.getElementById("err-loginEmail").textContent = "Email is required.";
    valid = false;
  }
  if (!password) {
    document.getElementById("err-loginPassword").textContent = "Password is required.";
    valid = false;
  }
  if (!valid) return;

  const user = users.find((u) => u.email === email);
  if (!user || user.password !== password) {
    document.getElementById("err-loginPassword").textContent = "Invalid email or password.";
    return;
  }

  saveSession({ name: user.name, email: user.email });
  updateAuthUI();
  closeLoginModal();
  render();
  showToast(`Welcome back, ${user.name}!`, "success");
});

/* ----- Signup modal ----- */
function openSignupModal() {
  signupForm.reset();
  clearAuthErrors(signupForm);
  signupModal.hidden = false;
  document.getElementById("signupName").focus();
}
function closeSignupModal() {
  signupModal.hidden = true;
}
signupBtn.addEventListener("click", openSignupModal);
closeSignupBtn.addEventListener("click", closeSignupModal);
cancelSignupBtn.addEventListener("click", closeSignupModal);
signupModal.addEventListener("click", (e) => {
  if (e.target === signupModal) closeSignupModal();
});
goToLogin.addEventListener("click", (e) => {
  e.preventDefault();
  closeSignupModal();
  openLoginModal();
});

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearAuthErrors(signupForm);
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;
  let valid = true;

  if (!name) {
    document.getElementById("err-signupName").textContent = "Name is required.";
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("err-signupEmail").textContent = "Enter a valid email.";
    valid = false;
  } else if (users.some((u) => u.email === email)) {
    document.getElementById("err-signupEmail").textContent = "An account with this email already exists.";
    valid = false;
  }
  if (password.length < 6) {
    document.getElementById("err-signupPassword").textContent = "Use at least 6 characters.";
    valid = false;
  }
  if (confirmPassword !== password) {
    document.getElementById("err-signupConfirmPassword").textContent = "Passwords don't match.";
    valid = false;
  }
  if (!valid) return;

  const user = { name, email, password };
  users.push(user);
  saveUsers();
  saveSession({ name, email });
  updateAuthUI();
  closeSignupModal();
  render();
  showToast(`Account created — welcome, ${name}!`, "success");
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  updateAuthUI();
  render();
  showToast("Logged out.", "success");
});

function clearAuthErrors(form) {
  form.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
}

function seedEvents() {
  const today = new Date();
  const inDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  };
  return [
    {
      id: crypto.randomUUID(),
      title: "Frontend Developer Meetup",
      category: "Meetup",
      date: inDays(7),
      time: "18:00",
      location: "Tech Hub, Vijayawada",
      description: "A casual meetup for frontend developers to share projects, learn React tips, and network.",
      image: "",
      maxAttendees: 40,
      attendees: 18,
      isPaid: false,
      price: 0,
    },
    {
      id: crypto.randomUUID(),
      title: "Intro to React Workshop",
      category: "Workshop",
      date: inDays(14),
      time: "10:00",
      location: "Online — Zoom",
      meetingLink: "https://zoom.us/j/1234567890",
      description: "Hands-on workshop covering React fundamentals: components, props, state, and hooks.",
      image: "",
      maxAttendees: 100,
      attendees: 62,
      isPaid: true,
      price: 499,
    },
    {
      id: crypto.randomUUID(),
      title: "Portfolio Review Session",
      category: "Webinar",
      date: inDays(-10),
      time: "16:00",
      location: "Online — Google Meet",
      description: "Get feedback on your developer portfolio from industry professionals.",
      image: "",
      maxAttendees: 30,
      attendees: 30,
      isPaid: false,
      price: 0,
    },
  ];
}

/* =========================================================
   RENDERING
   ========================================================= */
function render() {
  const filtered = getFilteredSortedEvents();
  renderStats();
  renderEvents(filtered);
}

function renderStats() {
  const now = new Date();
  const upcoming = events.filter((e) => new Date(`${e.date}T${e.time || "00:00"}`) >= now);
  const past = events.length - upcoming.length;
  const totalAttendees = events.reduce((sum, e) => sum + (Number(e.attendees) || 0), 0);

  statTotal.textContent = events.length;
  statUpcoming.textContent = upcoming.length;
  statPast.textContent = past;
  statAttendees.textContent = totalAttendees;
}

function getFilteredSortedEvents() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const status = statusFilter.value;
  const now = new Date();

  let list = events.filter((e) => {
    const matchesQuery =
      !query ||
      e.title.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query);
    const matchesCategory = category === "all" || e.category === category;
    const isUpcoming = new Date(`${e.date}T${e.time || "00:00"}`) >= now;
    const matchesStatus =
      status === "all" || (status === "upcoming" ? isUpcoming : !isUpcoming);
    return matchesQuery && matchesCategory && matchesStatus;
  });

  list.sort((a, b) => {
    if (sortOrder.value === "date-asc") {
      return new Date(`${a.date}T${a.time || "00:00"}`) - new Date(`${b.date}T${b.time || "00:00"}`);
    }
    if (sortOrder.value === "date-desc") {
      return new Date(`${b.date}T${b.time || "00:00"}`) - new Date(`${a.date}T${a.time || "00:00"}`);
    }
    if (sortOrder.value === "title-asc") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return list;
}

function renderEvents(list) {
  eventsContainer.innerHTML = "";

  if (list.length === 0) {
    emptyState.hidden = false;
    eventsContainer.hidden = true;
    return;
  }
  emptyState.hidden = true;
  eventsContainer.hidden = false;

  const now = new Date();
  const frag = document.createDocumentFragment();

  list.forEach((ev) => {
    const isPast = new Date(`${ev.date}T${ev.time || "00:00"}`) < now;
    const pct = ev.maxAttendees
      ? Math.min(100, Math.round((Number(ev.attendees || 0) / Number(ev.maxAttendees)) * 100))
      : 0;
    const isFull = ev.maxAttendees && Number(ev.attendees || 0) >= Number(ev.maxAttendees);
    const isRegistered = currentUser && registrations.some((r) => r.eventId === ev.id && r.email === currentUser.email);

    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-thumb" style="${ev.image ? `background-image:url('${escapeAttr(ev.image)}')` : ""}">
        ${!ev.image ? categoryEmoji(ev.category) : ""}
        <span class="event-badge ${isPast ? "past" : "upcoming"}">${isPast ? "Past" : "Upcoming"}</span>
        <span class="price-badge ${ev.isPaid ? "paid" : "free"}">${ev.isPaid ? "₹" + Number(ev.price || 0).toLocaleString("en-IN") : "Free"}</span>
      </div>
      <div class="event-body">
        <span class="event-category">${escapeHtml(ev.category)}</span>
        <h3 class="event-title">${escapeHtml(ev.title)}</h3>
        <div class="event-meta">
          <span>📅 ${formatDate(ev.date)}${ev.time ? " • " + formatTime(ev.time) : ""}</span>
          <span>📍 ${escapeHtml(ev.location)}</span>
          ${
            ev.maxAttendees
              ? `<span>👥 ${ev.attendees || 0} / ${ev.maxAttendees} attending</span>`
              : `<span>👥 ${ev.attendees || 0} attending</span>`
          }
        </div>
        ${
          ev.maxAttendees
            ? `<div class="attendee-bar"><div class="attendee-bar-fill" style="width:${pct}%"></div></div>`
            : ""
        }
        <div class="event-actions">
          <button class="btn btn-ghost btn-sm" data-action="view" data-id="${ev.id}">View</button>
          ${
            !isPast
              ? isRegistered
                ? `<button class="btn btn-ghost btn-sm" disabled>✅ Attending</button>`
                : `<button class="btn btn-primary btn-sm" data-action="rsvp" data-id="${ev.id}" ${isFull ? "disabled" : ""}>${isFull ? "Full" : ev.isPaid ? "Buy Ticket · ₹" + Number(ev.price || 0).toLocaleString("en-IN") : "Join Event"}</button>`
              : ""
          }
          ${
            !isPast && isRegistered && ev.meetingLink
              ? `<a class="btn btn-primary btn-sm" href="${escapeAttr(ev.meetingLink)}" target="_blank" rel="noopener noreferrer">🔗 Join Meeting</a>`
              : ""
          }
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${ev.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${ev.id}">Delete</button>
        </div>
      </div>
    `;
    frag.appendChild(card);
  });

  eventsContainer.appendChild(frag);
}

function categoryEmoji(category) {
  const map = {
    Conference: "🎤",
    Workshop: "🛠️",
    Meetup: "🤝",
    Webinar: "💻",
    Party: "🎉",
    Other: "📌",
  };
  return map[category] || "📌";
}

/* =========================================================
   EVENT CARD ACTIONS (delegated)
   ========================================================= */
eventsContainer.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "view") openDetails(id);
  if (action === "edit") openForm(id);
  if (action === "delete") openConfirmDelete(id);
  if (action === "rsvp") rsvpToEvent(id);
});

function rsvpToEvent(id) {
  const ev = events.find((x) => x.id === id);
  if (!ev) return;
  if (!currentUser) {
    showToast("Please log in to join events.", "error");
    openLoginModal();
    return;
  }
  if (registrations.some((r) => r.eventId === id && r.email === currentUser.email)) {
    showToast("You're already attending this event.", "success");
    return;
  }
  if (ev.maxAttendees && Number(ev.attendees || 0) >= Number(ev.maxAttendees)) {
    showToast("This event is already full.", "error");
    return;
  }
  if (ev.isPaid) {
    openPaymentModal(ev);
    return;
  }
  openJoinModal(ev);
}

function confirmAttendance(ev, name, opts = {}) {
  ev.attendees = Number(ev.attendees || 0) + 1;
  saveEvents();
  if (name && currentUser) addRegistration(ev.id, name, currentUser.email);
  render();
  if (!opts.silent) {
    showToast(`You're confirmed for "${ev.title}"!`, "success");
  }
}

/* =========================================================
   FORM MODAL — CREATE / EDIT
   ========================================================= */
function openForm(id = null) {
  eventForm.reset();
  clearErrors();
  document.getElementById("eventId").value = "";

  if (id) {
    const ev = events.find((x) => x.id === id);
    if (!ev) return;
    formTitle.textContent = "Edit Event";
    document.getElementById("eventId").value = ev.id;
    document.getElementById("title").value = ev.title;
    document.getElementById("category").value = ev.category;
    document.getElementById("date").value = ev.date;
    document.getElementById("time").value = ev.time;
    document.getElementById("location").value = ev.location;
    document.getElementById("meetingLink").value = ev.meetingLink || "";
    document.getElementById("description").value = ev.description || "";
    document.getElementById("image").value = ev.image || "";
    document.getElementById("maxAttendees").value = ev.maxAttendees || "";
    eventTypeSelect.value = ev.isPaid ? "paid" : "free";
    priceInput.value = ev.isPaid ? ev.price || "" : "";
  } else {
    formTitle.textContent = "Create New Event";
    eventTypeSelect.value = "free";
  }
  togglePriceField();
  formModal.hidden = false;
  document.getElementById("title").focus();
}

function closeForm() {
  formModal.hidden = true;
}

openFormBtn.addEventListener("click", () => openForm());
emptyCreateBtn.addEventListener("click", () => openForm());
closeFormBtn.addEventListener("click", closeForm);
cancelFormBtn.addEventListener("click", closeForm);
formModal.addEventListener("click", (e) => {
  if (e.target === formModal) closeForm();
});

function togglePriceField() {
  const isPaid = eventTypeSelect.value === "paid";
  priceField.hidden = !isPaid;
  if (!isPaid) priceInput.value = "";
}

eventTypeSelect.addEventListener("change", togglePriceField);

function clearErrors() {
  document.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
}

function validateForm() {
  clearErrors();
  let valid = true;
  const title = document.getElementById("title").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const location = document.getElementById("location").value.trim();

  if (!title) {
    document.getElementById("err-title").textContent = "Title is required.";
    valid = false;
  }
  if (!date) {
    document.getElementById("err-date").textContent = "Date is required.";
    valid = false;
  }
  if (!time) {
    document.getElementById("err-time").textContent = "Time is required.";
    valid = false;
  }
  if (!location) {
    document.getElementById("err-location").textContent = "Location is required.";
    valid = false;
  }
  const meetingLink = document.getElementById("meetingLink").value.trim();
  if (meetingLink && !/^https?:\/\/.+/i.test(meetingLink)) {
    document.getElementById("err-meetingLink").textContent = "Enter a valid link starting with http:// or https://";
    valid = false;
  }
  if (eventTypeSelect.value === "paid") {
    const price = Number(priceInput.value);
    if (!price || price <= 0) {
      document.getElementById("err-price").textContent = "Enter a valid price.";
      valid = false;
    }
  }
  return valid;
}

eventForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const id = document.getElementById("eventId").value;
  const payload = {
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    location: document.getElementById("location").value.trim(),
    meetingLink: document.getElementById("meetingLink").value.trim(),
    description: document.getElementById("description").value.trim(),
    image: document.getElementById("image").value.trim(),
    maxAttendees: document.getElementById("maxAttendees").value
      ? Number(document.getElementById("maxAttendees").value)
      : null,
    isPaid: eventTypeSelect.value === "paid",
    price: eventTypeSelect.value === "paid" ? Number(priceInput.value) : 0,
  };

  if (id) {
    const idx = events.findIndex((x) => x.id === id);
    if (idx > -1) {
      events[idx] = { ...events[idx], ...payload };
      showToast("Event updated successfully.", "success");
    }
  } else {
    events.push({ id: crypto.randomUUID(), attendees: 0, ...payload });
    showToast("Event created successfully.", "success");
  }

  saveEvents();
  closeForm();
  render();
});

/* =========================================================
   JOIN EVENT — NAME PROMPT (for free events)
   ========================================================= */
function openJoinModal(ev) {
  joinForm.reset();
  clearJoinErrors();
  joinEventId.value = ev.id;
  joinEventTitle.textContent = `Joining "${ev.title}"`;
  joinNameInput.value = currentUser ? currentUser.name : "";
  joinModal.hidden = false;
  joinNameInput.focus();
}

function closeJoinModal() {
  joinModal.hidden = true;
}

closeJoinBtn.addEventListener("click", closeJoinModal);
cancelJoinBtn.addEventListener("click", closeJoinModal);
joinModal.addEventListener("click", (e) => {
  if (e.target === joinModal) closeJoinModal();
});

function clearJoinErrors() {
  joinForm.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
}

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearJoinErrors();
  const name = joinNameInput.value.trim();
  if (!name) {
    document.getElementById("err-joinName").textContent = "Your name is required.";
    return;
  }
  const ev = events.find((x) => x.id === joinEventId.value);
  if (!ev) return;
  closeJoinModal();
  confirmAttendance(ev, name);
});

/* =========================================================
   DETAILS MODAL
   ========================================================= */
function openDetails(id) {
  const ev = events.find((x) => x.id === id);
  if (!ev) return;
  detailsTitle.textContent = ev.title;
  const now = new Date();
  const isPast = new Date(`${ev.date}T${ev.time || "00:00"}`) < now;
  const isRegistered = currentUser && registrations.some((r) => r.eventId === ev.id && r.email === currentUser.email);

  let meetingLinkRow = "";
  if (ev.meetingLink) {
    if (isRegistered) {
      meetingLinkRow = `<div class="details-row"><span class="details-label">Meeting Link</span><span><a href="${escapeAttr(ev.meetingLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ev.meetingLink)}</a></span></div>`;
    } else if (!isPast) {
      meetingLinkRow = `<div class="details-row"><span class="details-label">Meeting Link</span><span class="details-locked">🔒 Visible after you join</span></div>`;
    }
  }

  detailsBody.innerHTML = `
    ${ev.image ? `<div class="event-thumb" style="background-image:url('${escapeAttr(ev.image)}'); height:180px; border-radius: var(--radius-sm); margin-bottom: 14px;"></div>` : ""}
    <div class="details-row"><span class="details-label">Category</span><span>${escapeHtml(ev.category)}</span></div>
    <div class="details-row"><span class="details-label">Price</span><span>${ev.isPaid ? "₹" + Number(ev.price || 0).toLocaleString("en-IN") : "Free"}</span></div>
    <div class="details-row"><span class="details-label">Date</span><span>${formatDate(ev.date)}</span></div>
    <div class="details-row"><span class="details-label">Time</span><span>${formatTime(ev.time)}</span></div>
    <div class="details-row"><span class="details-label">Location</span><span>${escapeHtml(ev.location)}</span></div>
    ${meetingLinkRow}
    <div class="details-row"><span class="details-label">Status</span><span>${isPast ? "Past event" : "Upcoming"}</span></div>
    <div class="details-row"><span class="details-label">Attendees</span><span>${ev.attendees || 0}${ev.maxAttendees ? " / " + ev.maxAttendees : ""}</span></div>
    ${ev.description ? `<div class="details-row"><span class="details-label">About</span><span>${escapeHtml(ev.description)}</span></div>` : ""}
  `;
  detailsModal.hidden = false;
}

closeDetailsBtn.addEventListener("click", () => (detailsModal.hidden = true));
detailsModal.addEventListener("click", (e) => {
  if (e.target === detailsModal) detailsModal.hidden = true;
});

/* =========================================================
   DELETE CONFIRMATION
   ========================================================= */
function openConfirmDelete(id) {
  deleteTargetId = id;
  confirmModal.hidden = false;
}

function closeConfirm() {
  confirmModal.hidden = true;
  deleteTargetId = null;
}

closeConfirmBtn.addEventListener("click", closeConfirm);
cancelDeleteBtn.addEventListener("click", closeConfirm);
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirm();
});

confirmDeleteBtn.addEventListener("click", () => {
  if (!deleteTargetId) return;
  events = events.filter((x) => x.id !== deleteTargetId);
  saveEvents();
  closeConfirm();
  render();
  showToast("Event deleted.", "success");
});

/* =========================================================
   DEMO PAYMENT / CHECKOUT (simulated — no real transaction)
   ========================================================= */
function openPaymentModal(ev) {
  paymentForm.reset();
  clearPaymentErrors();
  payEventId.value = ev.id;
  paySummaryTitle.textContent = ev.title;
  paySummaryAmount.textContent = "₹" + Number(ev.price || 0).toLocaleString("en-IN");
  document.getElementById("payName").value = currentUser ? currentUser.name : "";
  paymentModal.hidden = false;
  document.getElementById("payName").focus();
}

function closePaymentModal() {
  paymentModal.hidden = true;
}

closePaymentBtn.addEventListener("click", closePaymentModal);
cancelPaymentBtn.addEventListener("click", closePaymentModal);
paymentModal.addEventListener("click", (e) => {
  if (e.target === paymentModal) closePaymentModal();
});

function clearPaymentErrors() {
  paymentForm.querySelectorAll(".error-text").forEach((el) => (el.textContent = ""));
}

// Auto-format card number as 1234 5678 9012 3456
document.getElementById("payCard").addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});

// Auto-format expiry as MM/YY
document.getElementById("payExpiry").addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) digits = digits.slice(0, 2) + "/" + digits.slice(2);
  e.target.value = digits;
});

document.getElementById("payCvv").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
});

function validatePaymentForm() {
  clearPaymentErrors();
  let valid = true;

  const name = document.getElementById("payName").value.trim();
  const card = document.getElementById("payCard").value.replace(/\s/g, "");
  const expiry = document.getElementById("payExpiry").value.trim();
  const cvv = document.getElementById("payCvv").value.trim();

  if (!name) {
    document.getElementById("err-payName").textContent = "Name is required.";
    valid = false;
  }
  if (!/^\d{16}$/.test(card)) {
    document.getElementById("err-payCard").textContent = "Enter a 16-digit card number.";
    valid = false;
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    document.getElementById("err-payExpiry").textContent = "Use MM/YY format.";
    valid = false;
  }
  if (!/^\d{3}$/.test(cvv)) {
    document.getElementById("err-payCvv").textContent = "Enter a 3-digit CVV.";
    valid = false;
  }
  return valid;
}

paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validatePaymentForm()) return;

  const payBtn = document.getElementById("payNowBtn");
  payBtn.disabled = true;
  payBtn.textContent = "Processing…";

  // Simulated processing delay — no real payment gateway is called.
  setTimeout(() => {
    const ev = events.find((x) => x.id === payEventId.value);
    const name = document.getElementById("payName").value.trim();
    payBtn.disabled = false;
    payBtn.textContent = "Pay & Join";
    closePaymentModal();
    if (ev) {
      confirmAttendance(ev, name, { silent: true });
      showToast(`Payment successful (demo) — ₹${Number(ev.price || 0).toLocaleString("en-IN")} for "${ev.title}".`, "success");
    }
  }, 900);
});

/* =========================================================
   MY EVENTS — events this browser is attending (upcoming) or
   has attended (past), based on local registrations
   ========================================================= */
function openMyEventsModal() {
  if (!currentUser) {
    showToast("Please log in to view your events.", "error");
    openLoginModal();
    return;
  }
  renderMyEventsList();
  myEventsModal.hidden = false;
}

function closeMyEventsModal() {
  myEventsModal.hidden = true;
}

myEventsBtn.addEventListener("click", openMyEventsModal);
closeMyEventsBtn.addEventListener("click", closeMyEventsModal);
myEventsModal.addEventListener("click", (e) => {
  if (e.target === myEventsModal) closeMyEventsModal();
});

myUpcomingTabBtn.addEventListener("click", () => switchMyEventsTab("upcoming"));
myPastTabBtn.addEventListener("click", () => switchMyEventsTab("past"));

function switchMyEventsTab(tab) {
  myUpcomingTabBtn.classList.toggle("active", tab === "upcoming");
  myPastTabBtn.classList.toggle("active", tab === "past");
  myUpcomingList.hidden = tab !== "upcoming";
  myPastList.hidden = tab !== "past";
}

function renderMyEventsList() {
  if (!currentUser) return;
  const now = new Date();
  const myEvents = registrations
    .filter((r) => r.email === currentUser.email)
    .map((r) => ({ reg: r, ev: events.find((e) => e.id === r.eventId) }))
    .filter((x) => x.ev);

  // Upcoming: events the user has joined that haven't happened yet.
  const upcoming = myEvents.filter((x) => new Date(`${x.ev.date}T${x.ev.time || "00:00"}`) >= now);
  // Past: events the user has joined that have already taken place.
  const past = myEvents.filter((x) => new Date(`${x.ev.date}T${x.ev.time || "00:00"}`) < now);

  // Soonest upcoming first, most recently completed first
  upcoming.sort((a, b) => new Date(`${a.ev.date}T${a.ev.time || "00:00"}`) - new Date(`${b.ev.date}T${b.ev.time || "00:00"}`));
  past.sort((a, b) => new Date(`${b.ev.date}T${b.ev.time || "00:00"}`) - new Date(`${a.ev.date}T${a.ev.time || "00:00"}`));

  myUpcomingList.innerHTML = upcoming.length
    ? upcoming.map((x) => myEventRowHtml(x.ev, x.reg, false)).join("")
    : `<p class="my-events-empty">You're not attending any upcoming events yet.</p>`;

  myPastList.innerHTML = past.length
    ? past.map((x) => myEventRowHtml(x.ev, x.reg, true)).join("")
    : `<p class="my-events-empty">No completed events yet.</p>`;

  switchMyEventsTab("upcoming");
}

function myEventRowHtml(ev, reg, isPast) {
  return `
    <div class="my-event-row">
      <div>
        <div class="mev-title">${escapeHtml(ev.title)}</div>
        <div class="mev-meta">📅 ${formatDate(ev.date)}${ev.time ? " • " + formatTime(ev.time) : ""} · 📍 ${escapeHtml(ev.location)}</div>
        <div class="mev-meta">Registered as ${escapeHtml(reg.name)}${ev.isPaid ? " · ₹" + Number(ev.price || 0).toLocaleString("en-IN") : " · Free"}</div>
      </div>
      <span class="mev-status ${isPast ? "past" : "upcoming"}">${isPast ? "Completed" : "Attending"}</span>
    </div>
  `;
}

/* =========================================================
   SEARCH / FILTER / SORT / VIEW
   ========================================================= */
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
statusFilter.addEventListener("change", render);
sortOrder.addEventListener("change", render);

gridViewBtn.addEventListener("click", () => setView("grid"));
listViewBtn.addEventListener("click", () => setView("list"));

function setView(view) {
  currentView = view;
  eventsContainer.classList.toggle("list-view", view === "list");
  gridViewBtn.classList.toggle("active", view === "grid");
  listViewBtn.classList.toggle("active", view === "list");
}

/* =========================================================
   THEME TOGGLE
   ========================================================= */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* =========================================================
   TOASTS
   ========================================================= */
function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* =========================================================
   UTILITIES
   ========================================================= */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str ?? "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* Keyboard: close modals with Escape */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!formModal.hidden) closeForm();
    if (!detailsModal.hidden) detailsModal.hidden = true;
    if (!confirmModal.hidden) closeConfirm();
    if (!joinModal.hidden) closeJoinModal();
    if (!paymentModal.hidden) closePaymentModal();
    if (!myEventsModal.hidden) closeMyEventsModal();
    if (!loginModal.hidden) closeLoginModal();
    if (!signupModal.hidden) closeSignupModal();
  }
});

/* =========================================================
   INIT
   ========================================================= */
function init() {
  initTheme();
  loadEvents();
  loadRegistrations();
  loadUsers();
  loadSession();
  updateAuthUI();
  render();
}

init();
