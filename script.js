/* =========================================================
   EventHub — Event Management System
   Vanilla JS, localStorage-backed, no build step required.
   ========================================================= */

const STORAGE_KEY = "eventhub_events_v1";
const THEME_KEY = "eventhub_theme_v1";

/* ---------- State ---------- */
let events = [];
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

const themeToggle = document.getElementById("themeToggle");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
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
    },
    {
      id: crypto.randomUUID(),
      title: "Intro to React Workshop",
      category: "Workshop",
      date: inDays(14),
      time: "10:00",
      location: "Online — Zoom",
      description: "Hands-on workshop covering React fundamentals: components, props, state, and hooks.",
      image: "",
      maxAttendees: 100,
      attendees: 62,
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

    const card = document.createElement("article");
    card.className = "event-card";
    card.innerHTML = `
      <div class="event-thumb" style="${ev.image ? `background-image:url('${escapeAttr(ev.image)}')` : ""}">
        ${!ev.image ? categoryEmoji(ev.category) : ""}
        <span class="event-badge ${isPast ? "past" : "upcoming"}">${isPast ? "Past" : "Upcoming"}</span>
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
              ? `<button class="btn btn-primary btn-sm" data-action="rsvp" data-id="${ev.id}" ${isFull ? "disabled" : ""}>${isFull ? "Full" : "RSVP"}</button>`
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
  if (ev.maxAttendees && Number(ev.attendees || 0) >= Number(ev.maxAttendees)) {
    showToast("This event is already full.", "error");
    return;
  }
  ev.attendees = Number(ev.attendees || 0) + 1;
  saveEvents();
  render();
  showToast(`RSVP confirmed for "${ev.title}"!`, "success");
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
    document.getElementById("description").value = ev.description || "";
    document.getElementById("image").value = ev.image || "";
    document.getElementById("maxAttendees").value = ev.maxAttendees || "";
  } else {
    formTitle.textContent = "Create New Event";
  }
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
    description: document.getElementById("description").value.trim(),
    image: document.getElementById("image").value.trim(),
    maxAttendees: document.getElementById("maxAttendees").value
      ? Number(document.getElementById("maxAttendees").value)
      : null,
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
   DETAILS MODAL
   ========================================================= */
function openDetails(id) {
  const ev = events.find((x) => x.id === id);
  if (!ev) return;
  detailsTitle.textContent = ev.title;
  const now = new Date();
  const isPast = new Date(`${ev.date}T${ev.time || "00:00"}`) < now;

  detailsBody.innerHTML = `
    ${ev.image ? `<div class="event-thumb" style="background-image:url('${escapeAttr(ev.image)}'); height:180px; border-radius: var(--radius-sm); margin-bottom: 14px;"></div>` : ""}
    <div class="details-row"><span class="details-label">Category</span><span>${escapeHtml(ev.category)}</span></div>
    <div class="details-row"><span class="details-label">Date</span><span>${formatDate(ev.date)}</span></div>
    <div class="details-row"><span class="details-label">Time</span><span>${formatTime(ev.time)}</span></div>
    <div class="details-row"><span class="details-label">Location</span><span>${escapeHtml(ev.location)}</span></div>
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
   IMPORT / EXPORT
   ========================================================= */
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `eventhub-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Events exported.", "success");
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      const existingIds = new Set(events.map((ev) => ev.id));
      const merged = [...events];
      imported.forEach((ev) => {
        if (ev && ev.id && !existingIds.has(ev.id)) {
          merged.push(ev);
        }
      });
      events = merged;
      saveEvents();
      render();
      showToast(`Imported ${imported.length} event(s).`, "success");
    } catch (err) {
      showToast("Import failed — invalid JSON file.", "error");
    }
  };
  reader.readAsText(file);
  importInput.value = "";
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
  }
});

/* =========================================================
   INIT
   ========================================================= */
function init() {
  initTheme();
  loadEvents();
  render();
}

init();
