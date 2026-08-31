# 🐑 Flock In

> **Check in. Be present. Belong.**
> A lightweight, mobile-first QR-based class attendance system for Christian classes, small groups, and youth gatherings.

---

## 📱 How It Works

```
Scan QR Code  ──>  Find Your Name  ──>  Tap  ──>  ✓ Checked In!
```

Students scan a permanent classroom QR code, search or find their name from a pre-populated roster, and check in with a single tap — taking less than 10 seconds with zero password or account login friction.

---

## 🛠️ Stack Architecture

- **Frontend:** HTML5, Modern Vanilla CSS, ES Modules JavaScript
- **Backend / API:** Google Apps Script (`Code.gs`)
- **Database:** Google Sheets (`Students`, `Meetings`, `Attendance`, `Settings`)
- **Hosting:** Firebase Hosting, GitHub Pages, or any static web host
- **QR:** Single permanent classroom QR code

---

## 📂 Project Structure

```text
flock-in/
├── README.md                     # Project overview and quickstart
├── .gitignore                    # Git ignore configuration
├── frontend/                     # Student & Admin web interface
│   ├── index.html                # Student mobile check-in page
│   ├── admin.html                # Administrator dashboard
│   ├── css/
│   │   ├── main.css              # Student UI design system & animations
│   │   └── admin.css             # Dashboard analytics styling
│   ├── js/
│   │   ├── api.js                # API layer (Apps Script connector & offline mock)
│   │   ├── checkin.js            # Check-in workflow & search logic
│   │   ├── admin.js              # Admin dashboard behavior
│   │   └── app.js                # Entry point
│   └── assets/
│       └── logo/
│           └── flock-in.svg      # Flock In sheep logo SVG
├── apps-script/                  # Backend code for Google Apps Script
│   ├── Code.gs                   # Web App API endpoints (doGet, doPost)
│   ├── config.gs                 # Sheet configuration & helpers
│   ├── students.gs               # Student roster query functions
│   ├── meetings.gs               # Class meeting session management
│   └── attendance.gs             # Check-in business logic & stats
└── docs/                         # Technical documentation
    ├── PRD.md                    # Product Requirements Document
    ├── architecture.md           # API contract & data flow docs
    └── google-sheet-setup.md     # Step-by-step Google Sheet & Apps Script setup
```

---

## ⚡ Quickstart

1. **Set Up Google Sheet & Apps Script:**
   Follow the step-by-step guide in [`docs/google-sheet-setup.md`](docs/google-sheet-setup.md) to create your spreadsheet and deploy the backend API.

2. **Configure API URL:**
   Open `frontend/js/api.js` and set `API_URL` to your deployed Apps Script Web App URL:
   ```javascript
   export const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";
   ```

3. **Run Locally:**
   Open `frontend/index.html` in your web browser, or serve it using any HTTP server (e.g., VS Code Live Server, `npx serve frontend`).

4. **Print Classroom QR Code:**
   Generate a permanent QR code pointing to your hosted check-in page URL and place it at your classroom entrance!

---

## 📄 License

Created with care for community and fellowship. Open for modification and non-commercial use.
