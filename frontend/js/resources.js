// ============================================================
//  resources.js — Subject Resource Manager
//  Uses: storage.js, toast.js, api.js, data.js
// ============================================================

// ===== Auth Guard =====
authGuard();

// ===== Helpers =====
function $r(id) { return document.getElementById(id); }

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

// ===== State =====
let allResources = [];

// ===== Render Resources =====
function renderResources(list) {
  const listEl = $r("resourceList");
  const badge  = $r("resourceBadge");
  badge.textContent = String(list.length);
  listEl.innerHTML  = "";

  if (list.length === 0) {
    listEl.innerHTML = '<li class="empty">No resources added yet.</li>';
    return;
  }

  list.forEach(r => {
    const li = document.createElement("li");
    li.className = "item res-item";

    const typeColors = {
      note: "background:#dbeafe;color:#1e40af",
      link: "background:#d1fae5;color:#065f46",
      file: "background:#fef3c7;color:#92400e"
    };
    const tagStyle = typeColors[r.type] || typeColors.note;

    li.innerHTML = `
      <div class="item-top">
        <div style="flex:1;min-width:0">
          <p class="item-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${r.isImportant ? '<span style="color:#f59e0b;font-size:1rem" title="Important">★</span>' : ""}
            <span style="word-break:break-word">${r.title}</span>
            <span class="res-tag" style="${tagStyle};padding:2px 8px;border-radius:6px;font-size:0.78rem;font-weight:700">${r.type}</span>
          </p>
          <p class="item-meta" style="margin-top:4px">
            ${r.subjectName ? "<strong>" + r.subjectName + "</strong> · " : ""}
            ${r.content ? '<span style="color:var(--muted);word-break:break-all">' + r.content.slice(0, 80) + (r.content.length > 80 ? "…" : "") + "</span>" : "<em style='color:var(--muted)'>No content</em>"}
          </p>
        </div>
      </div>
      <div class="item-actions" style="margin-top:8px">
        <button class="small-btn" data-action="toggle-important" data-id="${r._id}" title="${r.isImportant ? "Unmark" : "Mark"} Important">
          ${r.isImportant ? "★ Unmark" : "☆ Important"}
        </button>
        <button class="small-btn done" data-action="to-task" data-id="${r._id}">→ Add to Planner</button>
        <button class="small-btn danger" data-action="delete" data-id="${r._id}">Delete</button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

// ===== Load Resources =====
async function loadResources() {
  const filterSlug = $r("filterSubject") ? $r("filterSubject").value : "";
  const listEl     = $r("resourceList");
  listEl.innerHTML = '<li class="empty" style="color:var(--muted)">Loading…</li>';

  try {
    const query = filterSlug ? `?subjectSlug=${encodeURIComponent(filterSlug)}` : "";
    const data  = await apiFetch("/api/resources" + query);
    allResources = data.resources || [];
    renderResources(allResources);
  } catch (err) {
    showToast(err.message || "Failed to load resources.", "error");
    listEl.innerHTML = '<li class="empty">Could not load resources. Is the backend running?</li>';
  }
}

// ===== Add Resource Form =====
$r("resourceForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const title       = $r("resTitle").value.trim();
  const type        = $r("resType").value;
  const subjectSlug = $r("resSubjectSlug").value;
  const content     = $r("resContent").value.trim();
  const isImportant = $r("resImportant").checked;

  if (!title) { showToast("Title is required.", "error"); return; }

  // Resolve subject name from slug
  const semester    = safeSemester();
  const subjects    = SEMESTER_SUBJECTS[semester] || [];
  const found       = subjects.find(s => s.slug === subjectSlug);
  const subjectName = found ? found.name : subjectSlug;

  const btn = this.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }

  try {
    await apiFetch("/api/resources", {
      method: "POST",
      body:   JSON.stringify({ title, type, content, subjectSlug, subjectName, isImportant })
    });
    this.reset();
    showToast("Resource added.", "success");
    loadResources();
  } catch (err) {
    showToast(err.message || "Failed to add resource.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Add Resource"; }
  }
});

// ===== List Actions (delete / toggle-important / to-task) =====
$r("resourceList").addEventListener("click", async function (e) {
  const btn    = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.getAttribute("data-action");
  const id     = btn.getAttribute("data-id");

  if (action === "delete") {
    if (!confirm("Delete this resource?")) return;
    try {
      await apiFetch("/api/resources/" + id, { method: "DELETE" });
      showToast("Resource deleted.", "success");
      loadResources();
    } catch (err) {
      showToast(err.message || "Failed to delete.", "error");
    }
  }

  if (action === "toggle-important") {
    const resource = allResources.find(r => r._id === id);
    if (!resource) return;
    try {
      await apiFetch("/api/resources/" + id, {
        method: "PUT",
        body:   JSON.stringify({ isImportant: !resource.isImportant })
      });
      loadResources();
    } catch (err) {
      showToast(err.message || "Failed to update.", "error");
    }
  }

  if (action === "to-task") {
    btn.disabled = true;
    btn.textContent = "Adding…";
    try {
      const data  = await apiFetch("/api/resources/" + id + "/to-task", { method: "POST" });
      const task  = data.task;
      const todos = loadJSON("todos", []);
      todos.push(task);
      saveJSON("todos", todos);
      showToast("Task added to your Planner! ✅", "success");
    } catch (err) {
      showToast(err.message || "Failed to convert to task.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "→ Add to Planner";
    }
  }
});

// ===== Filter by Subject =====
if ($r("filterSubject")) {
  $r("filterSubject").addEventListener("change", loadResources);
}

// ===== Populate Subject Dropdowns =====
(function populateSubjectSelects() {
  const semester  = safeSemester();
  const subjects  = SEMESTER_SUBJECTS[semester] || [];

  ["resSubjectSlug", "filterSubject"].forEach(selectId => {
    const sel = $r(selectId);
    if (!sel) return;
    // Keep the first default option, add subjects
    subjects.forEach(s => {
      const opt = document.createElement("option");
      opt.value       = s.slug;
      opt.textContent = s.name;
      sel.appendChild(opt);
    });
  });
})();

// ===== Init =====
loadResources();
