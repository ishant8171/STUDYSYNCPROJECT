// ============================================================
//  planner.js  (uses shared: api.js, data.js, toast.js)
// ============================================================

// ===== Auth Guard =====
authGuard();

// ===== Helpers =====
function $r(id) { return document.getElementById(id); }

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ===== Navbar & Global Header =====
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

  $r("todayText").innerText = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
  
  // Set Semester and populate subjects
  apiFetch("/api/auth/me").then(data => {
    $r("semText").innerText = data.user.semester || "—";
    const sem = data.user.semester;
    const subjects = SEMESTER_SUBJECTS[sem] || [];
    
    ["todoSubject", "deadlineSubject"].forEach(id => {
      const el = $r(id);
      if (!el) return;
      el.innerHTML = '<option value="">Select Subject</option>';
      subjects.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.name;
        el.appendChild(opt);
      });
    });
  }).catch(() => {
    $r("semText").innerText = "—";
  });

  $r("todoDate").value = todayISO();
})();

// ===== State =====
let allTodos = [];
let allDeadlines = [];

// ===== TODOS =====
const todoForm     = $r("todoForm");
const todoListEl   = $r("todoList");
const todoBadge    = $r("todoBadge");
const clearTodoBtn = $r("clearTodoBtn");

async function loadTodos() {
  try {
    const data = await apiFetch("/api/tasks?isDeadline=false");
    allTodos = data.tasks.filter(t => !t.isDeadline);
    renderTodos();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderTodos() {
  todoBadge.innerText = String(allTodos.length);
  todoListEl.innerHTML = "";

  if (allTodos.length === 0) {
    todoListEl.innerHTML = '<li class="empty">No tasks added yet.</li>';
    return;
  }

  const sorted = [...allTodos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sorted.forEach(t => {
    const li = document.createElement("li");
    li.className = "item";
    const autoTag = t.autoAdded // legacy prop
      ? '<span style="background:#dbeafe;color:#1e40af;padding:2px 7px;border-radius:6px;font-size:0.8rem;margin-right:5px;">AUTO</span>'
      : "";

    li.innerHTML = `
      <div class="item-top">
        <div>
          <p class="item-title">${autoTag}${t.subject} &bull; ${t.type}</p>
          <p class="item-meta">${t.unit ? "Unit " + t.unit : "Unit —"} &bull; ${t.duration ? t.duration + " min" : "—"} &bull; ${t.dueDate || "—"}</p>
        </div>
        <span class="item-meta">${t.isDone ? "Done ✅" : "Pending"}</span>
      </div>
      <div class="item-actions">
        <button class="small-btn done" data-action="toggle" data-id="${t._id}">${t.isDone ? "Mark Pending" : "Mark Done"}</button>
        <button class="small-btn danger" data-action="delete" data-id="${t._id}">Delete</button>
      </div>
    `;
    todoListEl.appendChild(li);
  });
}

todoForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const subject     = $r("todoSubject").value.trim();
  const type        = $r("todoType").value;
  const unitVal     = $r("todoUnit").value;
  const durationVal = $r("todoDuration").value;
  const date        = $r("todoDate").value || todayISO();

  if (!subject) { showToast("Please enter a subject.", "error"); return; }

  let unit = null, duration = null;
  if (unitVal) {
    unit = Number(unitVal);
    if (unit < 1 || unit > 5) { showToast("Unit must be between 1 and 5.", "error"); return; }
  }
  if (durationVal) {
    duration = Number(durationVal);
    if (duration < 5 || duration > 600) { showToast("Duration should be between 5 and 600 minutes.", "error"); return; }
  }

  const btn = todoForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Adding…";

  try {
    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject, type, unit, duration, dueDate: date, isDone: false, isDeadline: false
      })
    });
    todoForm.reset();
    $r("todoType").value = "Revision";
    $r("todoDate").value = todayISO();
    showToast("Task added.", "success");
    loadTodos();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add Task";
  }
});

todoListEl.addEventListener("click", async function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const id     = btn.getAttribute("data-id");

  if (action === "delete") {
    try {
      await apiFetch("/api/tasks/" + id, { method: "DELETE" });
      loadTodos();
    } catch(err) {
      showToast(err.message, "error");
    }
  }
  if (action === "toggle") {
    const t = allTodos.find(x => x._id === id);
    if (!t) return;
    try {
      await apiFetch("/api/tasks/" + id, { 
        method: "PUT", 
        body: JSON.stringify({ isDone: !t.isDone }) 
      });
      loadTodos();
    } catch(err) {
      showToast(err.message, "error");
    }
  }
});

clearTodoBtn.addEventListener("click", async function () {
  if (!confirm("Clear all tasks? This cannot be undone.")) return;
  try {
    await apiFetch("/api/tasks?isDeadline=false", { method: "DELETE" });
    loadTodos();
  } catch(err) {
    showToast(err.message, "error");
  }
});

// ===== DEADLINES =====
const deadlineForm     = $r("deadlineForm");
const deadlineListEl   = $r("deadlineList");
const deadlineBadge    = $r("deadlineBadge");
const clearDeadlineBtn = $r("clearDeadlineBtn");

async function loadDeadlines() {
  try {
    const data = await apiFetch("/api/tasks?isDeadline=true");
    allDeadlines = data.tasks.filter(t => t.isDeadline);
    renderDeadlines();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function renderDeadlines() {
  deadlineBadge.innerText = String(allDeadlines.length);
  deadlineListEl.innerHTML = "";

  if (allDeadlines.length === 0) {
    deadlineListEl.innerHTML = '<li class="empty">No deadlines added yet.</li>';
    return;
  }

  const sorted = [...allDeadlines].sort((a, b) => {
    if (a.isComingSoon && !b.isComingSoon) return 1;
    if (!a.isComingSoon && b.isComingSoon) return -1;
    return (a.dueDate || "").localeCompare(b.dueDate || "");
  });

  sorted.forEach(d => {
    const li = document.createElement("li");
    li.className = "item";

    if (d.isComingSoon) {
      li.innerHTML = `
        <div class="item-top">
          <div>
            <p class="item-title">
              <span style="background:#fff3cd;color:#856404;padding:2px 8px;border-radius:6px;font-size:0.82rem;margin-right:6px;">AUTO</span>
              ${d.type} &bull; ${d.subject}
            </p>
            <p class="item-meta">📌 ${d.notes}</p>
          </div>
          <button class="small-btn danger" data-action="delete" data-id="${d._id}">Delete</button>
        </div>
        <div class="item-actions" style="align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px;">
          <label style="font-weight:700;font-size:0.88rem;color:#28435c;">Set Date:</label>
          <input type="date" class="coming-soon-date" data-id="${d._id}" style="padding:7px 10px;border:1px solid rgba(10,36,64,0.2);border-radius:10px;font-weight:600;background:#fff;" />
          <button class="small-btn done" data-action="confirm-date" data-id="${d._id}">Confirm Date</button>
        </div>
      `;
    } else {
      const autoTag = d.notes && d.notes.includes("AUTO") // proxy for isAutoReminder
        ? '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:6px;font-size:0.82rem;margin-right:6px;">AUTO</span>'
        : "";
      li.innerHTML = `
        <div class="item-top">
          <div>
            <p class="item-title">${autoTag}${d.type} &bull; ${d.subject}</p>
            <p class="item-meta">${d.dueDate}${d.notes ? " &bull; " + d.notes : ""}</p>
          </div>
          <button class="small-btn danger" data-action="delete" data-id="${d._id}">Delete</button>
        </div>
      `;
    }
    deadlineListEl.appendChild(li);
  });
}

deadlineForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  // Using an input for subject if the select is missing or overwritten
  const type    = $r("deadlineType").value;
  const subject = $r("deadlineSubject").value.trim();
  const date    = $r("deadlineDate").value;
  const notes   = $r("deadlineNotes").value.trim();

  if (!subject) { showToast("Please enter a subject.", "error"); return; }
  if (!date)    { showToast("Please select a date.", "error"); return; }

  const btn = deadlineForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Adding…";

  try {
    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject, type, dueDate: date, notes, isDeadline: true
      })
    });
    deadlineForm.reset();
    showToast("Deadline added.", "success");
    loadDeadlines();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add Deadline";
  }
});

deadlineListEl.addEventListener("click", async function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const id     = btn.getAttribute("data-id");

  if (action === "delete") {
    try {
      await apiFetch("/api/tasks/" + id, { method: "DELETE" });
      loadDeadlines();
    } catch(err) {
      showToast(err.message, "error");
    }
  }
  if (action === "confirm-date") {
    const li         = btn.closest("li");
    const dateInput  = li.querySelector(".coming-soon-date");
    const chosenDate = dateInput ? dateInput.value : "";
    if (!chosenDate) { showToast("Please select a date first.", "error"); return; }

    const d = allDeadlines.find(x => x._id === id);
    if (!d) return;

    try {
      await apiFetch("/api/tasks/" + id, {
        method: "PUT",
        body: JSON.stringify({
          dueDate: chosenDate,
          isComingSoon: false,
          notes: (d.notes || "").replace("— set date once teacher assigns", "").trim().replace(/•\s*$/, "").trim()
        })
      });
      loadDeadlines();
    } catch (err) {
      showToast(err.message, "error");
    }
  }
});

clearDeadlineBtn.addEventListener("click", async function () {
  if (!confirm("Clear all deadlines? This cannot be undone.")) return;
  try {
    await apiFetch("/api/tasks?isDeadline=true", { method: "DELETE" });
    loadDeadlines();
  } catch(err) {
    showToast(err.message, "error");
  }
});

// ===== SMART SUGGESTIONS =====
async function loadSuggestions() {
  const suggestBtn  = $r("getSuggestionsBtn");
  const suggestList = $r("suggestionList");
  if (!suggestList) return;

  if (suggestBtn) { suggestBtn.disabled = true; suggestBtn.textContent = "Analyzing…"; }
  suggestList.innerHTML = '<li class="empty" style="color:var(--muted)">Loading suggestions…</li>';

  try {
    const data = await apiFetch("/api/planner/suggest");

    const suggestions = data.suggestions || [];
    suggestList.innerHTML = "";

    if (suggestions.length === 0) {
      suggestList.innerHTML = '<li class="empty">All tasks are up to date — great work! 🎉</li>';
      return;
    }

    suggestions.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "item";
      li.style.borderLeft = "3px solid " + (i === 0 ? "#2563eb" : i === 1 ? "#7c3aed" : "#cbd5e1");
      li.innerHTML = `
        <div class="item-top">
          <div>
            <p class="item-title" style="margin:0">
              <span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:6px;font-size:0.78rem;font-weight:800;margin-right:6px">#${i + 1}</span>
              ${s.subject} &bull; ${s.type}${s.unit ? " &bull; Unit " + s.unit : ""}
            </p>
            <p class="item-meta" style="margin-top:5px">${s.reason}</p>
          </div>
          <span style="font-weight:800;color:#2563eb;font-size:0.88rem">${s.duration ? s.duration + "m" : ""}</span>
        </div>
      `;
      suggestList.appendChild(li);
    });

    showToast("Smart suggestions loaded! ✨", "success");
  } catch (err) {
    suggestList.innerHTML = '<li class="empty">Could not load suggestions. Is the backend running?</li>';
    showToast(err.message || "Suggestion service unavailable.", "error");
  } finally {
    if (suggestBtn) { suggestBtn.disabled = false; suggestBtn.textContent = "✨ Get Smart Suggestions"; }
  }
}

// Bind suggestion button
(function bindSuggestions() {
  const btn = $r("getSuggestionsBtn");
  if (btn) btn.addEventListener("click", loadSuggestions);
})();

// ===== Init =====
loadTodos();
loadDeadlines();
