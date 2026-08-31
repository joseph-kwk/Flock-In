/**
 * Flock In - Student Check-In Module (With Instant Name Confirmation & Fellowship Greeting)
 */

import { getStudents, getCurrentMeeting, checkIn, getAttendanceSummary } from "./api.js";

let allStudents = [];
let checkedInStudentIds = new Set();
let currentMeeting = null;
const STORAGE_KEY_CHECKED_IN = "flock_in_checked_in_session";

export async function initCheckInPage() {
  const searchInput = document.getElementById("student-search");
  const clearBtn = document.getElementById("clear-search");

  // Check if this device is already checked in
  const savedSession = getSavedCheckIn();
  if (savedSession) {
    renderLockedScreen(savedSession.name, savedSession.time);
    return;
  }

  try {
    currentMeeting = await getCurrentMeeting();
    renderMeetingInfo(currentMeeting);

    allStudents = await getStudents();
    
    // Fetch present student IDs to disable cards for already checked-in students
    try {
      const summary = await getAttendanceSummary();
      if (summary && summary.present) {
        summary.present.forEach(p => checkedInStudentIds.add(p.id));
      }
    } catch (e) {}

    renderStudents(allStudents);
  } catch (err) {
    console.error("Initialization error:", err);
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = query.length > 0 ? "flex" : "none";

      const filtered = allStudents.filter(s => s.name.toLowerCase().includes(query));
      renderStudents(filtered);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.style.display = "none";
      renderStudents(allStudents);
      searchInput.focus();
    });
  }
}

function getSavedCheckIn() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHECKED_IN);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCheckIn(name, time) {
  try {
    localStorage.setItem(STORAGE_KEY_CHECKED_IN, JSON.stringify({ name, time }));
  } catch (e) {}
}

function clearSavedCheckIn() {
  try {
    localStorage.removeItem(STORAGE_KEY_CHECKED_IN);
  } catch (e) {}
}

function renderMeetingInfo(meeting) {
  const infoEl = document.getElementById("meeting-info");
  const dotEl = document.getElementById("status-dot");

  if (!meeting || meeting.status !== "OPEN") {
    if (infoEl) infoEl.textContent = "Check-in Closed";
    if (dotEl) dotEl.classList.add("closed");
  } else {
    if (infoEl) infoEl.textContent = `Open Now`;
    if (dotEl) dotEl.classList.remove("closed");
  }
}

function renderStudents(list) {
  const container = document.getElementById("student-list");
  if (!container) return;
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>🔍 No matching names found.</p>
      </div>
    `;
    return;
  }

  list.forEach(student => {
    const isAlreadyCheckedIn = checkedInStudentIds.has(student.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `student-card ${isAlreadyCheckedIn ? 'checked-in' : ''}`;
    card.setAttribute("role", "listitem");
    
    if (isAlreadyCheckedIn) {
      card.disabled = true;
      card.innerHTML = `
        <span>${escapeHtml(student.name)}</span>
        <span class="tap-badge">Checked In ✓</span>
      `;
    } else {
      card.innerHTML = `
        <span>${escapeHtml(student.name)}</span>
        <span class="tap-badge">Tap to Check In</span>
      `;

      card.addEventListener("click", () => {
        promptConfirmation(student);
      });
    }

    container.appendChild(card);
  });
}

function promptConfirmation(student) {
  const container = document.getElementById("checkin-container");
  if (!container) return;

  container.innerHTML = `
    <div class="confirm-card">
      <p class="confirm-title">Check in as:</p>
      <h2 class="confirm-name">${escapeHtml(student.name)}</h2>
      <div class="confirm-actions">
        <button type="button" class="btn-confirm-cancel" id="confirm-no-btn">Cancel</button>
        <button type="button" class="btn-confirm-yes" id="confirm-yes-btn">✓ Yes, Check In</button>
      </div>
    </div>
  `;

  document.getElementById("confirm-no-btn").addEventListener("click", () => {
    restoreSearchList();
  });

  document.getElementById("confirm-yes-btn").addEventListener("click", () => {
    executeCheckIn(student);
  });
}

function restoreSearchList() {
  const container = document.getElementById("checkin-container");
  if (!container) return;

  container.innerHTML = `
    <section class="checkin-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          type="search" 
          id="student-search" 
          placeholder="Search your name..." 
          autocomplete="off"
          aria-label="Search name"
        >
        <button type="button" class="clear-btn" id="clear-search" aria-label="Clear search">✕</button>
      </div>

      <div id="student-list" role="list"></div>
    </section>
  `;

  initCheckInPage();
}

async function executeCheckIn(student) {
  if (!currentMeeting || currentMeeting.status !== "OPEN") {
    alert("Check-in is currently paused.");
    restoreSearchList();
    return;
  }

  try {
    triggerConfetti();
    
    const result = await checkIn(student.id, currentMeeting.id);

    if (!result.success && result.error) {
      alert(result.error);
      restoreSearchList();
      return;
    }

    const checkInTime = result.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    saveCheckIn(student.name, checkInTime);
    renderLockedScreen(student.name, checkInTime);

  } catch (err) {
    console.error("Check-in failed:", err);
    alert("Failed to submit check-in. Please try again!");
    restoreSearchList();
  }
}

function renderLockedScreen(studentName, checkInTime) {
  const container = document.getElementById("checkin-container");
  if (!container) return;

  container.innerHTML = `
    <div class="checkedin-locked-card">
      <h2 class="locked-title">You're In, <span class="locked-name">${escapeHtml(studentName)}</span>!</h2>
      <div class="locked-badge">
        <span>Checked In ✓</span>
        <span style="opacity:0.6;">•</span>
        <span>${checkInTime || 'Just Now'}</span>
      </div>
      <p class="locked-note">We're glad you're here! Enjoy our time in fellowship!</p>
      <button type="button" class="change-name-btn" id="change-name-btn">Not ${escapeHtml(studentName)}? Change selection</button>
    </div>
  `;

  document.getElementById("change-name-btn").addEventListener("click", () => {
    clearSavedCheckIn();
    restoreSearchList();
  });
}

function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#8B5CF6', '#A78BFA', '#10B981', '#F59E0B', '#FFFFFF']
    });
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
