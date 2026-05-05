// ============================================================
//  dashboard.js  (uses shared: api.js, data.js, toast.js)
// ============================================================

// ===== Auth Guard =====
authGuard();

// ===== Helpers =====
function $r(id) { return document.getElementById(id); }

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateParts(dateObj) {
  return {
    dayName:   dateObj.toLocaleDateString("en-IN", { weekday: "long" }),
    dayNum:    dateObj.toLocaleDateString("en-IN", { day: "2-digit" }),
    monthYear: dateObj.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  };
}

function isUnitComplete(u) {
  if (Array.isArray(u)) return u.every(Boolean);
  return Boolean(u);
}

function subjectPercent(units) {
  if (!units || units.length === 0) return 0;
  const done = units.filter(isUnitComplete).length;
  return Math.round((done / units.length) * 100);
}

function overallPercent(progressArr) {
  let done = 0, total = 0;
  for (const s of progressArr) {
    if (!s.units) continue;
    total += s.units.length;
    done  += s.units.filter(isUnitComplete).length;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function statusFromPercent(p) {
  if (p >= 70) return { label: "Good",               hint: "Great work — keep the momentum!" };
  if (p >= 40) return { label: "Average",             hint: "You're on track. Try completing 1 more unit this week." };
  return          { label: "Needs Improvement",     hint: "Start with small targets: complete 1 unit in 2 days." };
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ===== Global State =====
let dashboardData = {
  user: null,
  subjects: [],
  todos: [],
  deadlines: [],
  timetable: []
};

// ===== Render: Student =====
function renderStudent(user) {
  $r("studentName").textContent     = user && user.name     ? user.name     : "—";
  $r("studentCourse").textContent   = user && user.course   ? user.course   : "—";
  $r("studentErp").textContent      = user && user.erp      ? user.erp      : "—";
  $r("studentSemester").textContent = user && user.semester ? user.semester : "—";
}

// ===== Render: Today =====
function renderToday() {
  const { dayName, dayNum, monthYear } = formatDateParts(new Date());
  $r("todayDay").textContent       = dayName;
  $r("todayDate").textContent      = dayNum;
  $r("todayMonthYear").textContent = monthYear;
}

// ===== Render: Subjects + Overall =====
function renderSubjectsAndOverall(subjects) {
  const grid = $r("subjectGrid");
  grid.innerHTML = "";

  if (subjects.length === 0) {
    grid.innerHTML = '<p class="muted">No subjects added. Go to Subjects page to initialize.</p>';
  } else {
    subjects.forEach(subj => {
      const percent   = subjectPercent(subj.units);
      const doneUnits = subj.units ? subj.units.filter(isUnitComplete).length : 0;

      const card       = document.createElement("div");
      card.className   = "card subject-card";
      card.innerHTML   = `
        <div class="subject-top">
          <h3>${subj.name}</h3>
          <span><strong>${percent}%</strong></span>
        </div>
        <div class="progress-bar">
          <div class="fill" style="width:${clamp(percent,0,100)}%"></div>
        </div>
        <p class="muted">${doneUnits}/5 units completed</p>
      `;
      grid.appendChild(card);
    });
  }

  const overall = overallPercent(subjects);
  $r("overallPercent").textContent  = overall + "%";
  $r("overallFill").style.width     = clamp(overall, 0, 100) + "%";
  const status = statusFromPercent(overall);
  $r("overallStatus").textContent   = status.label;
  $r("overallHint").textContent     = status.hint;
}

// ===== Render: Todos =====
function renderTodos(todos) {
  const today     = todayISO();
  const todayList = todos.filter(t => (t.dueDate || today) === today);

  $r("todoCount").textContent = todayList.length + " task" + (todayList.length === 1 ? "" : "s");

  const list = $r("todoList");
  list.innerHTML = "";

  if (todayList.length === 0) {
    const li      = document.createElement("li");
    li.className  = "muted";
    li.textContent = "No tasks for today. Add tasks from Planner.";
    list.appendChild(li);
    return;
  }

  todayList.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>
        <strong>${t.subject}</strong> &bull; ${t.type}
        ${t.unit     ? " &bull; Unit " + t.unit         : ""}
        ${t.duration ? " &bull; " + t.duration + " min" : ""}
      </span>
      <span class="muted">${t.isDone ? "Done ✅" : "Pending"}</span>
    `;
    list.appendChild(li);
  });
}

// ===== Render: Deadlines =====
function renderDeadlines(deadlines) {
  deadlines.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  $r("deadlineCount").textContent = deadlines.length + " item" + (deadlines.length === 1 ? "" : "s");

  const list = $r("deadlineList");
  list.innerHTML = "";

  if (deadlines.length === 0) {
    const li      = document.createElement("li");
    li.className  = "muted";
    li.textContent = "No deadlines added. Add deadlines from Planner.";
    list.appendChild(li);
    return;
  }

  deadlines.slice(0, 6).forEach(d => {
    const li    = document.createElement("li");
    const pretty = new Date((d.dueDate || todayISO()) + "T00:00:00")
      .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    li.innerHTML = `
      <span><strong>${d.type}</strong> &bull; ${d.subject}</span>
      <span class="muted">${pretty}</span>
    `;
    list.appendChild(li);
  });
}

// ===== Streak =====
function renderStreak(user) {
  $r("streakCount").textContent  = user.studyStreak || 0;
  $r("lastStudied").textContent  = user.lastStudiedDate || "—";
}

async function markTodayStudied() {
  const btn = $r("markStudiedBtn");
  if (btn) btn.disabled = true;
  try {
    const data = await apiFetch("/api/auth/streak", { method: "PUT" });
    dashboardData.user.studyStreak = data.streak;
    dashboardData.user.lastStudiedDate = data.lastStudiedDate;
    renderStreak(dashboardData.user);
    showToast("Marked as studied for today ✅", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ===== Timetable auto-todo =====
async function injectTimetableTodos(slots, todos) {
  const dayNames  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = dayNames[new Date().getDay()];
  const todayDate = todayISO();
  
  const todaySlots = slots.filter(s => s.day === todayName);
  if (todaySlots.length === 0) return;

  let added = false;
  for (const s of todaySlots) {
    const already = todos.some(
      t => t.subject === s.subject && t.type === "Lecture" && t.dueDate === todayDate && !t.isDone
    );
    if (!already) {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          subject: s.subject,
          type: "Lecture",
          duration: 60,
          dueDate: todayDate,
          isDone: false,
          isDeadline: false
        })
      });
      added = true;
    }
  }

  if (added) {
    // Re-fetch todos
    const tasksRes = await apiFetch("/api/tasks");
    dashboardData.todos = tasksRes.tasks.filter(t => !t.isDeadline);
    renderTodos(dashboardData.todos);
  }
}

// ===== Nav + Events =====
function bindEvents() {
  const navToggle = $r("navToggle");
  const navMenu   = $r("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", e => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const logoutBtn = $r("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const markBtn = $r("markStudiedBtn");
  if (markBtn) markBtn.addEventListener("click", markTodayStudied);

  const reminderBtn = $r("setReminderBtn");
  if (reminderBtn) {
    reminderBtn.addEventListener("click", () => {
      showToast("Reminder settings will be added in Planner (prototype).", "info");
    });
  }
}

// ===== Init =====
async function initDashboard() {
  try {
    const [userRes, subjRes, tasksRes, ttRes] = await Promise.all([
      apiFetch("/api/auth/me"),
      apiFetch("/api/subjects"),
      apiFetch("/api/tasks"),
      apiFetch("/api/timetable")
    ]);

    dashboardData.user = userRes.user;
    dashboardData.subjects = subjRes.subjects;
    dashboardData.todos = tasksRes.tasks.filter(t => !t.isDeadline);
    dashboardData.deadlines = tasksRes.tasks.filter(t => t.isDeadline);
    dashboardData.timetable = ttRes.slots;

    // Render Data
    renderStudent(dashboardData.user);
    renderToday();
    renderSubjectsAndOverall(dashboardData.subjects);
    renderTodos(dashboardData.todos);
    renderDeadlines(dashboardData.deadlines);
    renderStreak(dashboardData.user);

    // Bind events
    bindEvents();

    // Check timetable
    await injectTimetableTodos(dashboardData.timetable, dashboardData.todos);
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    showToast("Failed to load dashboard data", "error");
  }
}

initDashboard();
