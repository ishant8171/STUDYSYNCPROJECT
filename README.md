# StudySync — BCA Minor Project

A study tracking web app for BCA students. Track subjects, units, lectures, to-dos, deadlines, timetable, and performance in one place.

---

## Project Structure

```
StudySync/
├── frontend/
│   ├── index.html               ← Entry point (redirects to login)
│   ├── css/                     ← Stylesheets
│   ├── assets/                  ← Logo and images
│   ├── js/
│   │   ├── data.js              ← Shared constants (SEMESTER_SUBJECTS, keys)
│   │   ├── storage.js           ← Shared localStorage helpers
│   │   ├── toast.js             ← Shared toast notifications
│   │   ├── auth.js              ← Login / Register logic
│   │   ├── dashboard.js
│   │   ├── subjects.js
│   │   ├── planner.js
│   │   ├── timetable.js
│   │   └── performance.js
│   └── pages/
│       ├── auth/                ← login.html, register.html
│       ├── dashboard/
│       ├── subjects/
│       ├── planner/
│       ├── timetable/
│       └── performance/
└── backend/
    ├── server.js                ← Express + MongoDB setup
    ├── package.json
    ├── .env.example             ← Copy to .env before running
    └── routes/
        └── auth.js              ← /api/register and /api/login
```

---

## How to Run

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or above
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (default port 27017)

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env       # Edit .env if your MongoDB URL is different
npm start
```

Server will start at: `http://localhost:5000`

### 3. Frontend

Open `frontend/index.html` in your browser (or use a local server like VS Code Live Server).

> The frontend uses `localStorage` for most data (progress, todos, deadlines, timetable).
> Only **login and registration** communicate with the backend.

---

## Features

| Feature | Description |
|---|---|
| Auth | Register / Login with ERP ID + hashed password (bcryptjs) |
| Subjects | Track lectures per unit (8 lectures × 5 units per subject) |
| Auto To-Do | Completing a unit auto-adds a revision task |
| Auto Reminders | Assignment reminders auto-added at 2 and 4 units completed |
| Planner | Add and manage study tasks and exam deadlines |
| Timetable | Weekly schedule — today's classes auto-appear in To-Do |
| Performance | Charts for subject progress and task completion |
| Streak | Daily study streak tracker |

---

## Notes

- This is a prototype. User data (except credentials) is stored in `localStorage`.
- The `.env` file is excluded from version control — never commit real credentials to GitHub.
