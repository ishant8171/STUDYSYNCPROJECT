// ============================================================
//  subjects.js  (uses shared: api.js, data.js, toast.js)
// ============================================================

// ===== Auth Guard =====
authGuard();

function $r(id) { return document.getElementById(id); }

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ===== Navbar =====
function bindNav() {
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
}

// ===== Progress Helpers =====
function isUnitComplete(lectureArr) {
  return lectureArr.every(Boolean);
}

function subjectPercent(units) {
  if (!units || units.length === 0) return 0;
  return Math.round(units.filter(isUnitComplete).length / UNITS_PER_SUBJECT * 100);
}

// ===== State =====
let allSubjects = [];

async function loadSubjects() {
  try {
    const userRes = await apiFetch("/api/auth/me");
    $r("semText").textContent = userRes.user.semester || "—";
    const semester = userRes.user.semester;
    const semSubjects = SEMESTER_SUBJECTS[semester] || [];
    
    const dataRes = await apiFetch("/api/subjects");
    allSubjects = dataRes.subjects;

    // Initialization check - if subjects are missing in DB, create them
    if (allSubjects.length < semSubjects.length) {
      const existingSlugs = new Set(allSubjects.map(s => s.slug));
      for (const s of semSubjects) {
        if (!existingSlugs.has(s.slug)) {
          const emptyUnits = Array.from({ length: UNITS_PER_SUBJECT }, () => Array(LECTURES_PER_UNIT).fill(false));
          await apiFetch("/api/subjects", {
            method: "POST",
            body: JSON.stringify({ slug: s.slug, name: s.name, semester, units: emptyUnits })
          });
        }
      }
      // re-fetch after init
      const refreshed = await apiFetch("/api/subjects");
      allSubjects = refreshed.subjects;
    }
    
    renderSubjects();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===== Auto Add Features =====
async function autoAddTodo(subjectName, unitNumber) {
  try {
    const tasksRes = await apiFetch("/api/tasks");
    const already = tasksRes.tasks.some(
      t => t.subject === subjectName && t.unit === unitNumber && t.type === "Revision" && !t.isDone && !t.isDeadline
    );
    if (already) return;

    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject: subjectName, type: "Revision", unit: unitNumber,
        duration: 60, dueDate: todayISO(), isDone: false, isDeadline: false
      })
    });
    showToast('Auto-added: Revise "' + subjectName + '" Unit ' + unitNumber + ' to your To-Do list.', "info");
  } catch(e) { console.error(e); }
}

async function autoAddAssignmentReminder(subjectName, assignmentNumber) {
  try {
    const tasksRes = await apiFetch("/api/tasks?isDeadline=true");
    const already = tasksRes.tasks.some(
      d => d.subject === subjectName && d.type === "Assignment"
        && d.notes && d.notes.includes("Assignment " + assignmentNumber)
    );
    if (already) return;

    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        type: "Assignment", subject: subjectName, dueDate: "", 
        notes: "Assignment " + assignmentNumber + " — set date once teacher assigns AUTO",
        isComingSoon: true, isDeadline: true
      })
    });
    showToast('Reminder: Assignment ' + assignmentNumber + ' for "' + subjectName + '" added to Deadlines.', "info");
  } catch(e) { console.error(e); }
}

// ===== Render Subjects =====
function renderSubjects() {
  $r("subjectCount").textContent = allSubjects.length + " subject" + (allSubjects.length !== 1 ? "s" : "");

  const grid = $r("subjectsGrid");
  grid.innerHTML = "";

  allSubjects.forEach((subj, subjIdx) => {
    const percent   = subjectPercent(subj.units);
    const doneUnits = subj.units.filter(isUnitComplete).length;

    const unitsHTML = subj.units.map((lectureArr, uIdx) => {
      const unitDone     = isUnitComplete(lectureArr);
      const doneLectures = lectureArr.filter(Boolean).length;

      const lecturesHTML = lectureArr.map((checked, lIdx) => `
        <label class="lecture-check">
          <input type="checkbox"
            data-slug="${subj.slug}"
            data-subj-idx="${subjIdx}"
            data-unit="${uIdx}"
            data-lecture="${lIdx}"
            ${checked ? "checked" : ""}>
          L${lIdx + 1}
        </label>
      `).join("");

      return `
        <div class="unit-block ${unitDone ? "unit-done" : ""}" data-unit-idx="${uIdx}">
          <div class="unit-header">
            <span class="unit-label">Unit ${uIdx + 1}</span>
            <span class="unit-progress-label">${doneLectures}/${LECTURES_PER_UNIT} lectures ${unitDone ? "✅" : ""}</span>
          </div>
          <div class="unit-mini-bar">
            <div class="unit-mini-fill" style="width:${Math.round(doneLectures/LECTURES_PER_UNIT*100)}%"></div>
          </div>
          <div class="lectures-grid">${lecturesHTML}</div>
        </div>
      `;
    }).join("");

    const card     = document.createElement("div");
    card.className = "card subject-card";
    card.innerHTML = `
      <div class="subject-top">
        <h3 class="subject-name">${subj.name}</h3>
        <span class="percent">${percent}%</span>
      </div>
      <div class="progress-bar">
        <div class="fill" style="width:${clamp(percent,0,100)}%"></div>
      </div>
      <p class="muted" style="margin:0 0 10px;">${doneUnits}/${UNITS_PER_SUBJECT} units completed</p>
      <div class="units-container">${unitsHTML}</div>
    `;
    grid.appendChild(card);
  });
}

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

$r("subjectsGrid").addEventListener("change", async e => {
  const input = e.target;
  if (!input.matches('input[type="checkbox"]')) return;

  const slug     = input.getAttribute("data-slug");
  const subjIdx  = Number(input.getAttribute("data-subj-idx"));
  const uIdx     = Number(input.getAttribute("data-unit"));
  const lIdx     = Number(input.getAttribute("data-lecture"));
  const isChecked = input.checked;

  try {
    await apiFetch("/api/subjects/" + slug + "/unit", {
      method: "PUT",
      body: JSON.stringify({ unitIndex: uIdx, lectureIndex: lIdx, isDone: isChecked })
    });
    
    // Update local state and check auto-adds
    allSubjects[subjIdx].units[uIdx][lIdx] = isChecked;
    const subj = allSubjects[subjIdx];
    const wasJustDone = isUnitComplete(subj.units[uIdx]);
    const completedUnits = subj.units.filter(isUnitComplete).length;

    if (wasJustDone) await autoAddTodo(subj.name, uIdx + 1);
    if (completedUnits === 2) await autoAddAssignmentReminder(subj.name, 1);
    if (completedUnits === 4) await autoAddAssignmentReminder(subj.name, 2);

    renderSubjects();
  } catch (err) {
    showToast(err.message, "error");
    input.checked = !isChecked; // revert on fail
  }
});

// ===== Init =====
(function init() {
  bindNav();
  loadSubjects();
})();
