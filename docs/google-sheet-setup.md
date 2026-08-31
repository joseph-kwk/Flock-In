# 📊 Flock In — Precise Google Sheet Database Setup Guide

Follow this exact blueprint to create your **Flock In Database** spreadsheet in Google Sheets.

---

## 1. Create Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com) and create a **New Blank Spreadsheet**.
2. Set the spreadsheet title to: **`Flock In Database`**.

---

## 2. Create the 4 Required Tabs (Worksheets)

Make sure tab names match **EXACTLY** (case-sensitive):

```text
Tabs: [ Students ]  [ Meetings ]  [ Attendance ]  [ Settings ]
```

---

### 🟢 Tab 1: `Students` (Master Roster)
This tab holds your list of active people. Students search & select their name from this list.

#### Row 1 (Header Columns):
- **Cell `A1`**: `Student ID`
- **Cell `B1`**: `Name`
- **Cell `C1`**: `Active`

#### Sample Data (Rows 2–9):
| Row | Cell A (Student ID) | Cell B (Name) | Cell C (Active) |
| :--- | :--- | :--- | :--- |
| **Row 2** | `STU-001` | Caleb Johnson | `TRUE` |
| **Row 3** | `STU-002` | Hannah Abbott | `TRUE` |
| **Row 4** | `STU-003` | Ethan Williams | `TRUE` |
| **Row 5** | `STU-004` | Grace Davis | `TRUE` |
| **Row 6** | `STU-005` | Noah Martinez | `TRUE` |
| **Row 7** | `STU-006` | Sophia Taylor | `TRUE` |
| **Row 8** | `STU-007` | Benjamin Clark | `TRUE` |
| **Row 9** | `STU-008` | Olivia Rodriguez | `TRUE` |

> 📌 **Rules:**
> - `Student ID` must be unique (e.g. `STU-001`, `STU-002`).
> - `Active` must be `TRUE` for the person to show up on the check-in page. Set to `FALSE` if someone leaves.

---

### 🟣 Tab 2: `Meetings` (Gathering Sessions)
This tab controls current and past gathering sessions.

#### Row 1 (Header Columns):
- **Cell `A1`**: `Meeting ID`
- **Cell `B1`**: `Date`
- **Cell `C1`**: `Start`
- **Cell `D1`**: `End`
- **Cell `E1`**: `Status`

#### Sample Data (Row 2):
| Row | Cell A (Meeting ID) | Cell B (Date) | Cell C (Start) | Cell D (End) | Cell E (Status) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Row 2** | `MTG-20260831` | `2026-08-31` | `11:00 AM` | `12:00 PM` | `OPEN` |

> 📌 **Rules:**
> - `Status` must be set to `OPEN` for check-in to accept responses.
> - Setting `Status` to `CLOSED` or clicking **Pause Check-In** in Admin pauses check-ins.

---

### 🔵 Tab 3: `Attendance` (Check-In Logs)
This tab automatically receives check-in records.

#### Row 1 (Header Columns):
- **Cell `A1`**: `Meeting ID`
- **Cell `B1`**: `Student ID`
- **Cell `C1`**: `Name`
- **Cell `D1`**: `Check-In Time`

*(Leave rows 2+ blank! The system automatically appends a new row when someone checks in).*

---

### ⚙️ Tab 4: `Settings` (Optional Configuration)

#### Row 1 (Header Columns):
- **Cell `A1`**: `Key`
- **Cell `B1`**: `Value`

#### Sample Data (Rows 2–3):
| Row | Cell A (Key) | Cell B (Value) |
| :--- | :--- | :--- |
| **Row 2** | `ClassName` | Flock In Gathering |
| **Row 3** | `Timezone` | America/Chicago |

---

## 3. How Attendance Numbers Are Calculated

The system computes real-time stats with 100% accuracy:
- **Total Roster Count** = Count of all rows in `Students` sheet where `Active` = `TRUE`.
- **Checked In Count** = Count of unique `Student ID`s recorded in `Attendance` sheet for the active `Meeting ID`.
- **Not Checked In Count** = `Total Roster Count` minus `Checked In Count`.

---

## 4. Deploying Apps Script Web App API

1. In your spreadsheet, click **Extensions > Apps Script**.
2. Rename project to **`Flock In API`**.
3. Create 5 files matching [`apps-script/`](../apps-script/):
   - `Code.gs`
   - `config.gs`
   - `students.gs`
   - `meetings.gs`
   - `attendance.gs`
4. Click **Deploy > New deployment**:
   - **Type:** `Web app`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
5. Copy the **Web App URL** and paste it into [`frontend/js/api.js`](../frontend/js/api.js):
   ```javascript
   export const API_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
   ```
