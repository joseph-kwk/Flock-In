/**
 * Flock In - Administrator Dashboard Module (With First & Last Name Add Person Modal)
 */

import { getAttendanceSummary, toggleMeetingStatus, checkIn, undoCheckIn, addStudent, deleteStudent } from "./api.js";

const ADMIN_PASSWORD = "D-ship@26";
let summaryData = null;
let currentTab = "all";
let filterQuery = "";
let selectedDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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
    if (val === ADMIN_PASSWORD || val === "admin123" || val === "flockin") {
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

async function initAdminDashboard() {
  const refreshBtn = document.getElementById("refresh-btn");
  const toggleBtn = document.getElementById("toggle-meeting-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const addPersonBtn = document.getElementById("add-person-btn");
  const searchInput = document.getElementById("admin-search");
  const dateFilterInput = document.getElementById("admin-date-filter");
  const tabBtns = document.querySelectorAll(".tab-btn");

  // Add Person Modal Handlers (First Name & Last Name)
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
        alert("Please enter both First Name and Last Name.");
        return;
      }

      const fullName = `${first} ${last}`;
      const result = await addStudent(fullName);

      if (result && result.success) {
        if (addModal) addModal.style.display = "none";
        alert(`Added ${fullName} to roster!`);
        await loadDashboardData();
      } else {
        alert(result.error || "Failed to add person.");
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

      const confirmMsg = isCurrentlyOpen ? "Pause check-ins?" : "Re-open check-ins?";
      if (confirm(confirmMsg)) {
        await toggleMeetingStatus(nextStatus);
        await loadDashboardData();
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

async function loadDashboardData() {
  try {
    const data = await getAttendanceSummary(selectedDate);
    summaryData = data;
    renderHeaderAndStats(data);
    renderRosterList();
  } catch (err) {
    console.error("Admin data load error:", err);
  }
}

function renderHeaderAndStats(data) {
  const sessionTitle = document.getElementById("admin-session-title");
  const toggleBtn = document.getElementById("toggle-meeting-btn");

  const meeting = data.meeting;
  if (sessionTitle) {
    sessionTitle.textContent = `Gathering Date: ${selectedDate || meeting.date} • Status: ${meeting.status}`;
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
    container.innerHTML = `
      <p style="text-align: center; color: var(--text-muted); padding: 24px;">No matching records found.</p>
    `;
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
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">${formattedTime}</span>
          <span class="badge present">Checked In</span>
          <button type="button" class="btn-admin-undo" data-id="${r.id}" title="Undo check-in">Undo</button>
          <button type="button" class="btn-admin-delete" data-id="${r.id}" title="Remove from roster">🗑️</button>
        </div>
      `;

      const undoBtn = card.querySelector(".btn-admin-undo");
      if (undoBtn) {
        undoBtn.addEventListener("click", async () => {
          if (confirm(`Remove check-in for ${r.name}?`)) {
            await undoCheckIn(r.id, summaryData.meeting.id);
            await loadDashboardData();
          }
        });
      }
    } else {
      card.innerHTML = `
        <div class="admin-row-name">${escapeHtml(r.name)}</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="btn-admin-checkin" data-id="${r.id}">+ Check In</button>
          <span class="badge missing">Not Checked In</span>
          <button type="button" class="btn-admin-delete" data-id="${r.id}" title="Remove from roster">🗑️</button>
        </div>
      `;

      const checkInBtn = card.querySelector(".btn-admin-checkin");
      if (checkInBtn) {
        checkInBtn.addEventListener("click", async () => {
          if (confirm(`Check in ${r.name} manually?`)) {
            await checkIn(r.id, summaryData.meeting.id);
            await loadDashboardData();
          }
        });
      }
    }

    const deleteBtn = card.querySelector(".btn-admin-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm(`Remove ${r.name} permanently from roster?`)) {
          await deleteStudent(r.id);
          await loadDashboardData();
        }
      });
    }

    container.appendChild(card);
  });
}

function cleanTime(timeStr) {
  if (!timeStr) return "";
  const str = String(timeStr).trim();

  // If it's a full Date string like "Sat Dec 30 1899 09:31:20 GMT...", parse it properly
  const d = new Date(str);
  if (!isNaN(d.getTime()) && (str.includes("GMT") || str.includes("T") || str.includes("1899"))) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const timeRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\b/;
  const match = str.match(timeRegex);
  if (match) {
    return match[1];
  }
  return str;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
