# 🏗️ Flock In — System Architecture & API Contract

This document outlines the architecture, data models, and API specification for **Flock In**.

---

## 1. System Context

```text
  ┌────────────────────────┐
  │  Student Mobile Phone  │ (Scans permanent QR code)
  └───────────┬────────────┘
              │ HTTPS GET / POST
              ▼
  ┌────────────────────────┐
  │   Flock In Frontend    │ (HTML / CSS / JS SPA)
  │ (Firebase/GitHub Pages)│
  └───────────┬────────────┘
              │ JSON over HTTPS
              ▼
  ┌────────────────────────┐
  │   Google Apps Script   │ (API Layer & Business Logic)
  │      (Code.gs)         │
  └───────────┬────────────┘
              │ Google Apps Script API
              ▼
  ┌────────────────────────┐
  │     Google Sheets      │ (Students, Meetings, Attendance, Settings)
  └────────────────────────┘
```

---

## 2. Google Sheet Data Schemas

### `Students` Tab
| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `Student ID` | String (Unique) | Primary key for student | `STU-001` |
| `Name` | String | Display name | `Caleb Johnson` |
| `Active` | Boolean | Roster inclusion flag | `TRUE` |

### `Meetings` Tab
| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `Meeting ID` | String (Unique) | Session identifier | `MTG-20260831` |
| `Date` | String | ISO / standard date string | `2026-08-31` |
| `Start` | String | Start time | `11:00 AM` |
| `End` | String | End time | `12:00 PM` |
| `Status` | String | Session status (`OPEN` / `CLOSED`) | `OPEN` |

### `Attendance` Tab
| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `Meeting ID` | String | Foreign key to `Meetings` | `MTG-20260831` |
| `Student ID` | String | Foreign key to `Students` | `STU-001` |
| `Name` | String | Historical student name snapshot | `Caleb Johnson` |
| `Check-In Time`| String | Timestamp recorded by Apps Script | `11:04:12 AM` |

### `Settings` Tab
| Key | Value | Description |
| :--- | :--- | :--- |
| `ClassName` | Sunday School Flock | Header branding text |
| `Timezone` | America/Chicago | Class timezone |

---

## 3. API Contract (Google Apps Script Web App)

The API accepts requests via standard HTTP `GET` and `POST` parameters (`action` parameter).

### GET `?action=getStudents`
Returns list of active students.
**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "STU-001", "name": "Caleb Johnson", "active": true },
    { "id": "STU-002", "name": "Hannah Abbott", "active": true }
  ]
}
```

### GET `?action=getCurrentMeeting`
Returns active class meeting details.
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "MTG-20260831",
    "date": "2026-08-31",
    "start": "11:00 AM",
    "end": "12:00 PM",
    "status": "OPEN"
  }
}
```

### POST `checkIn` (Payload / Form URL Encoded)
Payload: `{ "action": "checkIn", "studentId": "STU-001", "meetingId": "MTG-20260831" }`  
**Response (Success):**
```json
{
  "success": true,
  "message": "Welcome to the flock!",
  "alreadyCheckedIn": false,
  "timestamp": "11:04:15 AM"
}
```
**Response (Already Checked In):**
```json
{
  "success": true,
  "message": "You're already checked in!",
  "alreadyCheckedIn": true,
  "timestamp": "11:04:15 AM"
}
```

### GET `?action=getAttendanceSummary`
Returns full admin dashboard summary.
**Response:**
```json
{
  "success": true,
  "meeting": { "id": "MTG-20260831", "status": "OPEN" },
  "stats": {
    "total": 27,
    "present": 22,
    "missing": 5,
    "percentage": 81
  },
  "present": [
    { "id": "STU-001", "name": "Caleb Johnson", "time": "11:04:15 AM" }
  ],
  "missing": [
    { "id": "STU-005", "name": "David Smith" }
  ]
}
```
