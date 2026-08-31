/**
 * Flock In - Administrator Dashboard Module
 * Toast notifications, in-page confirm dialogs, back link on login modal
 */

import { getAttendanceSummary, toggleMeetingStatus, checkIn, undoCheckIn, addStudent, deleteStudent } from "./api.js";

const ADMIN_PASSWORD = "D-ship@26";
let summaryData = null;
let currentTab = "all";
let filterQuery = "";
let selectedDate = new Date().toISOString().split("T")[0];

// =========================================================
// Toast Notification System
// =========================================================
function showToast(message, type = "info", duration = 3200) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-notification ${type}`;
  // Force reflow so animation re-triggers
  void toast.offsetWidth;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// =========================================================
// In-Page Confirm Dialog (replaces window.confirm)
// =========================================================
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const msgEl = document.getElementById("confirm-dialog-msg");
    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    if (!modal || !msgEl || !okBtn || !cancelBtn) {
      resolve(window.confirm(message));
      return;
    }
    msgEl.textContent = message;
    modal.style.display = "flex";

    const cleanup = () => {
      modal.style.display = "none";
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// =========================================================
// Password Protection
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  setupPasswordProtection();
});

function setupPasswordProtection() {
  const pwdOverlay = document.getElementById("pwd-overlay");
  const pwdInput = document.getElementById("admin-pwd-input");
  const submitBtn = document.getElementById("pwd-submit-btn");
  const errorMsg = document.getElementById("pwd-error");

  const attemptUnlock = () => {
    const val = pwdInput.value.trim();
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem("flock_admin_authenticated", "true");
      if (pwdOverlay) pwdOverlay.style.display = "none";
      if (errorMsg) errorMsg.style.display = "none";
      initAdminDashboard();
    } else {
      if (errorMsg) errorMsg.style.display = "block";
      if (pwdInput) {
        pwdInput.value = "";
        pwdInput.focus();
      }
    }
  };

  if (submitBtn) submitBtn.addEventListener("click", attemptUnlock);
  if (pwdInput) {
    pwdInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") attemptUnlock();
    });
  }

  if (sessionStorage.getItem("flock_admin_authenticated") === "true") {
    if (pwdOverlay) pwdOverlay.style.display = "none";
    initAdminDashboard();
  } else {
    if (pwdOverlay) pwdOverlay.style.display = "flex";
  }
}

// =========================================================
// Admin Dashboard Init
// =========================================================
async function initAdminDashboard() {
  const refreshBtn = document.getElementById("refresh-btn");
  const toggleBtn = document.getElementById("toggle-meeting-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const addPersonBtn = document.getElementById("add-person-btn");
  const searchInput = document.getElementById("admin-search");
  const dateFilterInput = document.getElementById("admin-date-filter");
  const tabBtns = document.querySelectorAll(".tab-btn");

  // Add Person Modal
  const addModal = document.getElementById("add-person-modal");
  const firstNameInput = document.getElementById("first-name-input");
  const lastNameInput = document.getElementById("last-name-input");
  const savePersonBtn = document.getElementById("save-add-person-btn");
  const cancelPersonBtn = document.getElementById("cancel-add-person-btn");

  if (addPersonBtn) {
    addPersonBtn.onclick = () => {
      if (firstNameInput) firstNameInput.value = "";
      if (lastNameInput) lastNameInput.value = "";
      if (addModal) addModal.style.display = "flex";
      if (firstNameInput) firstNameInput.focus();
    };
  }

  if (cancelPersonBtn) {
    cancelPersonBtn.onclick = () => {
      if (addModal) addModal.style.display = "none";
    };
  }

  if (savePersonBtn) {
    savePersonBtn.onclick = async () => {
      const first = firstNameInput ? firstNameInput.value.trim() : "";
      const last = lastNameInput ? lastNameInput.value.trim() : "";

      if (!first || !last) {
        showToast("Please enter both First Name and Last Name.", "error");
        return;
      }

      const fullName = `${first} ${last}`;

      // Disable button while saving
      savePersonBtn.disabled = true;
      savePersonBtn.textContent = "Adding...";

      try {
        const result = await addStudent(fullName);
        if (result && result.success) {
          if (addModal) addModal.style.display = "none";
          showToast(`✓ ${fullName} added to roster!`, "success");
          await loadDashboardData();
        } else {
          showToast(result.error || "Failed to add person.", "error");
        }
      } catch (e) {
        showToast("Something went wrong. Please try again.", "error");
      } finally {
        savePersonBtn.disabled = false;
        savePersonBtn.textContent = "Add to Roster ✓";
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("flock_admin_authenticated");
      const pwdOverlay = document.getElementById("pwd-overlay");
      const pwdInput = document.getElementById("admin-pwd-input");
      const errorMsg = document.getElementById("pwd-error");
      if (pwdInput) pwdInput.value = "";
      if (errorMsg) errorMsg.style.display = "none";
      if (pwdOverlay) pwdOverlay.style.display = "flex";
    };
  }

  if (dateFilterInput) {
    dateFilterInput.value = selectedDate;
    dateFilterInput.onchange = (e) => {
      selectedDate = e.target.value;
      loadDashboardData();
    };
  }

  if (refreshBtn) refreshBtn.onclick = loadDashboardData;

  if (toggleBtn) {
    toggleBtn.onclick = async () => {
      if (!summaryData) return;
      const isCurrentlyOpen = summaryData.meeting.status === "OPEN";
      const nextStatus = isCurrentlyOpen ? "CLOSED" : "OPEN";
      const confirmMsg = isCurrentlyOpen ? "Pause check-ins for this session?" : "Re-open check-ins?";
      const confirmed = await showConfirm(confirmMsg);
      if (confirmed) {
        await toggleMeetingStatus(nextStatus);
        await loadDashboardData();
        showToast(isCurrentlyOpen ? "Check-in paused." : "Check-in is open!", isCurrentlyOpen ? "info" : "success");
      }
    };
  }

  if (searchInput) {
    searchInput.oninput = (e) => {
      filterQuery = e.target.value.trim().toLowerCase();
      renderRosterList();
    };
  }

  tabBtns.forEach(btn => {
    btn.onclick = (e) => {
      tabBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentTab = e.target.dataset.tab;
      renderRosterList();
    };
  });

  await loadDashboardData();
}

// =========================================================
// Data Loading
// =========================================================
async function loadDashboardData() {
  try {
    const data = await getAttendanceSummary(selectedDate);
    summaryData = data;
    renderHeaderAndStats(data);
    renderRosterList();
  } catch (err) {
    console.error("Admin data load error:", err);
    showToast("Failed to load data. Check your connection.", "error");
  }
}

function renderHeaderAndStats(data) {
  const sessionTitle = document.getElementById("admin-session-title");
  const toggleBtn = document.getElementById("toggle-meeting-btn");

  const meeting = data.meeting;
  if (sessionTitle) {
    sessionTitle.textContent = `Gathering: ${selectedDate || meeting.date} • ${meeting.status}`;
  }

  if (toggleBtn) {
    if (meeting.status === "OPEN") {
      toggleBtn.textContent = "🔒 Pause Check-In";
      toggleBtn.style.background = "rgba(239, 68, 68, 0.25)";
    } else {
      toggleBtn.textContent = "🔓 Open Check-In";
      toggleBtn.style.background = "rgba(16, 185, 129, 0.25)";
    }
  }

  const statPresent = document.getElementById("stat-present");
  const statMissing = document.getElementById("stat-missing");
  if (statPresent) statPresent.textContent = data.stats.present;
  if (statMissing) statMissing.textContent = data.stats.missing;
}

// =========================================================
// Roster Rendering
// =========================================================
function renderRosterList() {
  const container = document.getElementById("admin-roster-list");
  if (!container || !summaryData) return;

  container.innerHTML = "";

  let rows = [];
  summaryData.present.forEach(p => {
    rows.push({ id: p.id, name: p.name, status: "Checked In", time: p.time });
  });
  summaryData.missing.forEach(m => {
    rows.push({ id: m.id, name: m.name, status: "Not Checked In", time: "" });
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));

  if (currentTab === "present") rows = rows.filter(r => r.status === "Checked In");
  if (currentTab === "missing") rows = rows.filter(r => r.status === "Not Checked In");

  if (filterQuery) {
    rows = rows.filter(r => r.name.toLowerCase().includes(filterQuery) || r.id.toLowerCase().includes(filterQuery));
  }

  if (rows.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 24px;">No matching records found.</p>`;
    return;
  }

  rows.forEach(r => {
    const card = document.createElement("div");
    card.className = "admin-row-card";
    const isPresent = r.status === "Checked In";
    const formattedTime = cleanTime(r.time);

    if (isPresent) {
      card.innerHTML = `
        <div class="admin-row-name">${escapeHtml(r.name)}</div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${formattedTime}</span>
          <span class="badge present">Checked In</span>
          <button type="button" class="btn-admin-undo" data-id="${r.id}" title="Undo check-in">Undo</button>
          <button type="button" class="btn-admin-delete" data-id="${r.id}" title="Remove from roster">🗑️</button>
        </div>
      `;

      card.querySelector(".btn-admin-undo").addEventListener("click", async () => {
        const ok = await showConfirm(`Remove check-in for ${r.name}?`);
        if (ok) {
          await undoCheckIn(r.id, summaryData.meeting.id);
          showToast(`Check-in removed for ${r.name}.`, "info");
          await loadDashboardData();
        }
      });
    } else {
      card.innerHTML = `
        <div class="admin-row-name">${escapeHtml(r.name)}</div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn-admin-checkin" data-id="${r.id}">+ Check In</button>
          <span class="badge missing">Not Checked In</span>
          <button type="button" class="btn-admin-delete" data-id="${r.id}" title="Remove from roster">🗑️</button>
        </div>
      `;

      card.querySelector(".btn-admin-checkin").addEventListener("click", async () => {
        const ok = await showConfirm(`Check in ${r.name} manually?`);
        if (ok) {
          await checkIn(r.id, summaryData.meeting.id);
          showToast(`${r.name} checked in!`, "success");
          await loadDashboardData();
        }
      });
    }

    card.querySelector(".btn-admin-delete").addEventListener("click", async () => {
      const ok = await showConfirm(`Remove ${r.name} from roster permanently?`);
      if (ok) {
        await deleteStudent(r.id);
        showToast(`${r.name} removed from roster.`, "info");
        await loadDashboardData();
      }
    });

    container.appendChild(card);
  });
}

// =========================================================
// Helpers
// =========================================================
function cleanTime(timeStr) {
  if (!timeStr) return "";
  const str = String(timeStr).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime()) && (str.includes("GMT") || str.includes("T") || str.includes("1899"))) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  const match = str.match(/\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\b/);
  return match ? match[1] : str;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
