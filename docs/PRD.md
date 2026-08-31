# 🐑 Flock In — Product Requirements Document (PRD)

## 1. Product Vision
Flock In is a mobile-first, zero-login attendance web application designed for Christian classes and small group gatherings. Students check in by scanning a permanent classroom QR code, searching for their name, and tapping to confirm attendance.

**Core Slogan:** *"Check in. Be present. Belong."*  
**Check-In Confirmation:** *"You're in! 🐑 Welcome to the flock."*

---

## 2. Target Persona & UX Goals
- **Student Experience:** Scan QR → Find name → Tap → Confirmed (under 10 seconds). No usernames, passwords, or typing errors.
- **Admin/Teacher Experience:** Live view of present vs. missing students, automatic check-in timestamps, 11:50 AM missing-student summary, and historical export.

---

## 3. Scope & Non-Goals

### Core Features (Version 1 MVP)
- Pre-populated roster search (case-insensitive name filtering).
- Single-tap check-in with Student ID & Meeting ID verification.
- Duplicate check-in prevention with informative state ("You're already checked in at 11:04 AM!").
- Meeting session status validation (OPEN / CLOSED).
- Admin dashboard displaying real-time counts, present student timestamps, missing student roster, and manual check-in toggle.
- Mobile-first, vibrant glassmorphism design with responsive support for smartphones and tablets.

### Non-Goals (Version 1)
- Student user accounts or passwords.
- Native mobile app store downloads (iOS/Android).
- SQL database setup (Google Sheets serves as data store).
- GPS or facial recognition tracking.

---

## 4. Feature Specifications

### 4.1 Student Check-In Interface (`index.html`)
1. **Header:** Flock In sheep logo, welcoming headline, active class meeting date badge.
2. **Search Input:** Fast real-time name filter with instant clear button.
3. **Student Cards:** Large touchable cards with clear student names.
4. **Status Toast / Feedback Modal:**
   - **Success:** Green gradient card + sheep emoji celebration + timestamp.
   - **Already Checked In:** Friendly blue card showing existing check-in time.
   - **Closed Meeting:** Clear alert informing students check-in is currently closed.

### 4.2 Administrator Dashboard (`admin.html`)
1. **Stats Summary Grid:** Present count, missing count, total roster, percentage present.
2. **Meeting Controls:** Switch current active meeting or toggle check-in status (OPEN / CLOSED).
3. **11:50 AM Follow-Up Panel:** Highlighted list of missing students to assist class leaders.
4. **Attendance Roster Table:** Searchable list of all students with check-in timestamps and status badges.

---

## 5. Security & Data Integrity
- Roster information contains display names and internal Student IDs (`STU-001`).
- Write operations validate active meeting state and prevent duplicate rows in Google Sheets.
- Google Sheet credentials are held securely by Google Apps Script; no service account keys or sheet tokens are exposed client-side.
