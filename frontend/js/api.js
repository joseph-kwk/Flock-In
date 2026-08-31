/**
 * 🐑 Flock In - API Connector Module
 * Set your Google Apps Script Web App URL below once deployed.
 * If empty or placeholder, it automatically runs in Mock / Demo Mode!
 */

export const API_URL = "https://script.google.com/macros/s/AKfycbyTb3nMAr4PlIrY0MGmUt6YIr1YsSwL4E8816r5zl6M1k56MVGxJCOZ7m34zOw9QQ40/exec"; // e.g., "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

// Mock Data Store for offline testing (synced with localStorage)
function getMockData() {
  const defaultData = {
    meeting: {
      id: "MTG-20260831",
      date: "2026-08-31",
      start: "11:00 AM",
      end: "12:00 PM",
      status: "OPEN"
    },
    students: [
      { id: "STU-001", name: "Caleb Johnson", active: true },
      { id: "STU-002", name: "Hannah Abbott", active: true },
      { id: "STU-003", name: "Ethan Williams", active: true },
      { id: "STU-004", name: "Grace Davis", active: true },
      { id: "STU-005", name: "Noah Martinez", active: true },
      { id: "STU-006", name: "Sophia Taylor", active: true },
      { id: "STU-007", name: "Benjamin Clark", active: true },
      { id: "STU-008", name: "Olivia Rodriguez", active: true }
    ],
    attendance: {
      "STU-001": "11:04:12 AM"
    }
  };

  try {
    const saved = localStorage.getItem("flock_in_demo_data");
    if (saved) return JSON.parse(saved);
  } catch (e) { }

  return defaultData;
}

function saveMockData(data) {
  try {
    localStorage.setItem("flock_in_demo_data", JSON.stringify(data));
  } catch (e) { }
}

const MOCK_DATA = getMockData();

function isMockMode() {
  return !API_URL || API_URL.includes("YOUR_APPS_SCRIPT") || API_URL.trim() === "";
}

export async function getStudents() {
  if (isMockMode()) {
    console.log("[Flock In Demo Mode] Returning mock student roster.");
    return getMockData().students;
  }

  const response = await fetch(`${API_URL}?action=getStudents`);
  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Failed to load students.");
  return json.data;
}

export async function getCurrentMeeting() {
  if (isMockMode()) {
    return getMockData().meeting;
  }

  const response = await fetch(`${API_URL}?action=getCurrentMeeting`);
  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Failed to load meeting.");
  return json.data;
}

export async function checkIn(studentId, meetingId) {
  if (isMockMode()) {
    const freshData = getMockData();
    const student = freshData.students.find(s => s.id === studentId);
    if (!student) throw new Error("Student not found.");

    if (freshData.meeting.status !== "OPEN") {
      return {
        success: false,
        error: "Check-in is currently CLOSED for this session."
      };
    }

    if (freshData.attendance[studentId]) {
      return {
        success: true,
        alreadyCheckedIn: true,
        message: "You're already checked in!",
        timestamp: freshData.attendance[studentId],
        studentName: student.name
      };
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    freshData.attendance[studentId] = now;
    saveMockData(freshData);

    return {
      success: true,
      alreadyCheckedIn: false,
      message: "You're in! Welcome to the flock.",
      timestamp: now,
      studentName: student.name
    };
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "checkIn",
      studentId,
      meetingId
    })
  });

  const json = await response.json();
  if (!json.success && json.error) throw new Error(json.error);
  return json;
}

export async function getAttendanceSummary(dateFilter) {
  if (isMockMode()) {
    const freshData = getMockData();
    const total = freshData.students.length;
    const presentList = [];
    const missingList = [];

    freshData.students.forEach(s => {
      if (freshData.attendance[s.id]) {
        presentList.push({ id: s.id, name: s.name, time: freshData.attendance[s.id] });
      } else {
        missingList.push({ id: s.id, name: s.name });
      }
    });

    const presentCount = presentList.length;
    const missingCount = missingList.length;

    return {
      success: true,
      meeting: freshData.meeting,
      stats: {
        total,
        present: presentCount,
        missing: missingCount,
        percentage: total > 0 ? Math.round((presentCount / total) * 100) : 0
      },
      present: presentList,
      missing: missingList
    };
  }

  const url = dateFilter
    ? `${API_URL}?action=getAttendanceSummary&date=${encodeURIComponent(dateFilter)}`
    : `${API_URL}?action=getAttendanceSummary`;

  const response = await fetch(url);
  const json = await response.json();
  if (!json.success) throw new Error(json.error || "Failed to load summary.");
  if (json.present && Array.isArray(json.present)) {
    json.present.forEach(p => {
      p.time = formatTimestampClean(p.time);
    });
  }
  return json;
}

function formatTimestampClean(raw) {
  if (!raw) return "";
  const str = String(raw).trim();
  const timeMatch = str.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/i);
  if (timeMatch) return timeMatch[1].trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return str;
}

export async function undoCheckIn(studentId, meetingId) {
  if (isMockMode()) {
    const freshData = getMockData();
    delete freshData.attendance[studentId];
    saveMockData(freshData);
    return { success: true, studentId };
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "undoCheckIn", studentId, meetingId })
  });

  return await response.json();
}

export async function addStudent(name) {
  if (isMockMode()) {
    const freshData = getMockData();
    const nextNum = freshData.students.length + 1;
    const newId = `STU-${nextNum < 10 ? '00' : nextNum < 100 ? '0' : ''}${nextNum}`;
    const newStudent = { id: newId, name: name.trim(), active: true };
    freshData.students.push(newStudent);
    saveMockData(freshData);
    return { success: true, student: newStudent };
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "addStudent", name })
  });

  return await response.json();
}

export async function deleteStudent(studentId) {
  if (isMockMode()) {
    const freshData = getMockData();
    freshData.students = freshData.students.filter(s => s.id !== studentId);
    delete freshData.attendance[studentId];
    saveMockData(freshData);
    return { success: true, studentId };
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "deleteStudent", studentId })
  });

  return await response.json();
}

export async function toggleMeetingStatus(newStatus) {
  if (isMockMode()) {
    MOCK_DATA.meeting.status = newStatus;
    saveMockData(MOCK_DATA);
    return { success: true, status: newStatus };
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "toggleMeetingStatus", status: newStatus })
  });

  return await response.json();
}
