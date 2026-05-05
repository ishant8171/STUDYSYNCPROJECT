// ============================================================
//  performance.js  (uses shared: api.js, data.js, toast.js)
// ============================================================

// ===== Auth Guard =====
authGuard();

// ===== Helpers =====
function $r(id) { return document.getElementById(id); }

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ===== Navbar =====
(function bindNav() {
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
})();

function isUnitComplete(lectureArr) {
  if (!Array.isArray(lectureArr)) return Boolean(lectureArr);
  return lectureArr.every(Boolean);
}

// ===== Load Data via APIs =====
async function loadPerformanceData() {
  try {
    const [userRes, subjRes, tasksRes] = await Promise.all([
      apiFetch("/api/auth/me"),
      apiFetch("/api/subjects"),
      apiFetch("/api/tasks")
    ]);

    const profile      = userRes.user;
    const progressData = subjRes.subjects;
    const allTasks     = tasksRes.tasks;

    const todos        = allTasks.filter(t => !t.isDeadline);
    const deadlines    = allTasks.filter(t => t.isDeadline);

    $r("semText").textContent = profile.semester || "1";

    // ===== Stat Cards =====
    let totalUnitsDone = 0;
    progressData.forEach(subj => {
      subj.units.forEach(u => { if (isUnitComplete(u)) totalUnitsDone++; });
    });
    $r("statUnits").textContent      = totalUnitsDone;
    $r("statTasksDone").textContent  = todos.filter(t => t.isDone).length;
    $r("statTasksSub").textContent   = "of " + todos.length + " total";
    $r("statDeadlines").textContent  = deadlines.filter(d => !d.isDone).length;
    $r("statStreak").textContent     = profile.studyStreak || 0;

    // ===== Chart 1: Subject Progress =====
    const subjectNames = progressData.map(s => s.name);
    const subjectUnits = progressData.map(s => s.units.filter(isUnitComplete).length);

    const canvas = $r("subjectChart");
    if (window.subjChartInstance) window.subjChartInstance.destroy();
    window.subjChartInstance = new Chart(canvas, {
      type: "bar",
      data: {
        labels:   subjectNames,
        datasets: [{
          label:           "Units Completed",
          data:            subjectUnits,
          backgroundColor: "rgba(37,99,235,0.75)",
          borderRadius:    8,
          borderSkipped:   false
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min:   0,
            max:   UNITS_PER_SUBJECT,
            ticks: { stepSize: 1, font: { family: "Inter", weight: "600" } },
            grid:  { color: "rgba(0,0,0,0.06)" }
          },
          x: {
            ticks: { font: { family: "Inter", size: 11, weight: "700" }, maxRotation: 40, autoSkip: false },
            grid:  { display: false }
          }
        },
        plugins: {
          legend:  { display: false },
          tooltip: { callbacks: { label: ctx => " " + ctx.raw + " / " + UNITS_PER_SUBJECT + " units" } }
        }
      }
    });

    // ===== Chart 2: To-Do Donut =====
    const todoDone    = todos.filter(t =>  t.isDone).length;
    const todoPending = todos.filter(t => !t.isDone).length;

    const donut = $r("todoChart");
    if (window.todoChartInstance) window.todoChartInstance.destroy();
    window.todoChartInstance = new Chart(donut, {
      type: "doughnut",
      data: {
        labels:   ["Done", "Pending"],
        datasets: [{
          data:            [todoDone || 0, todoPending || 0],
          backgroundColor: ["#22c55e", "#e2e8f5"],
          borderWidth:     0,
          hoverOffset:     6
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        cutout:  "68%",
        plugins: {
          legend:  { position: "bottom", labels: { font: { family: "Inter", weight: "700", size: 13 }, padding: 16 } },
          tooltip: { callbacks: { label: ctx => " " + ctx.raw + " task" + (ctx.raw !== 1 ? "s" : "") } }
        }
      }
    });

    // ===== Deadline Table =====
    const dlTable = $r("deadlineTable");
    $r("deadlineBadge").textContent = deadlines.length;

    const sortedDeadlines = [...deadlines].sort((a, b) => {
      if (a.isComingSoon && !b.isComingSoon) return 1;
      if (!a.isComingSoon && b.isComingSoon) return -1;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });

    dlTable.innerHTML = "";
    if (sortedDeadlines.length === 0) {
      dlTable.innerHTML = '<p class="dl-empty">No deadlines added yet.</p>';
    } else {
      const today = todayISO();
      sortedDeadlines.forEach(d => {
        const row       = document.createElement("div");
        row.className   = "dl-row";
        let badgeClass  = "normal";
        let badgeText   = d.dueDate || "No date";

        if (d.isComingSoon) {
          badgeClass = "coming"; badgeText = "Coming Soon";
        } else if (d.dueDate && d.dueDate <= today) {
          badgeClass = "soon"; badgeText = d.dueDate === today ? "Today!" : "Overdue";
        }

        row.innerHTML = `
          <div class="dl-info">
            <span class="dl-title">${d.type} &bull; ${d.subject}</span>
            <span class="dl-meta">${d.notes || "—"}</span>
          </div>
          <span class="dl-badge ${badgeClass}">${badgeText}</span>
        `;
        dlTable.appendChild(row);
      });
    }

  } catch (err) {
    showToast("Failed to load performance data.", "error");
    console.error(err);
  }
}

// ===== Init =====
loadPerformanceData();
