// ============================================================
//  timetable.js  (uses shared: api.js, data.js, toast.js)
// ============================================================

// ===== Auth Guard =====
authGuard();

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

// ===== Constants =====
const DAYS      = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const _today    = new Date();
const _dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const todayName = _dayNames[_today.getDay()];

// ===== Header =====
$r("todayText").innerText = _today.toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});
$r("todayDay").innerText = todayName;

// ===== State =====
let allSlots = [];

async function loadTimetable() {
  try {
    const data = await apiFetch("/api/timetable");
    allSlots = data.slots || [];
    renderTimetable();
    checkMissedSlots();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===== Auto To-Do =====
async function autoAddTimetableTodo(subjectName, timeStr) {
  const date = todayISO();
  try {
    const tasksRes = await apiFetch("/api/tasks?isDeadline=false");
    const already = tasksRes.tasks.some(
      t => t.subject === subjectName && t.type === "Lecture" && t.dueDate === date && !t.isDone
    );
    if (already) return;
    
    await apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        subject: subjectName, type: "Lecture", unit: null, duration: 60,
        dueDate: date, isDone: false, isDeadline: false, notes: timeStr
      })
    });
  } catch(e) { console.error(e); }
}

// ===== Render Timetable =====
function renderTimetable() {
  $r("slotBadge").innerText = String(allSlots.length);
  const ttGrid = $r("ttGrid");
  ttGrid.innerHTML = "";

  DAYS.forEach(day => {
    const daySlots = allSlots.filter(s => s.day === day);
    const isToday  = day === todayName;
    const col      = document.createElement("div");
    col.className  = "tt-day-col";

    const slotsHTML = daySlots.length === 0
      ? '<p class="tt-empty">No classes</p>'
      : daySlots.map(s => `
          <div class="tt-slot">
            <div class="tt-slot-info">
              <span class="tt-slot-subject">${s.subject}</span>
              <span class="tt-slot-time">${s.time}</span>
            </div>
            <button class="tt-del" data-id="${s._id}" title="Remove">✕</button>
          </div>
        `).join("");

    col.innerHTML = `
      <div class="tt-day-header ${isToday ? "today-header" : ""}">${day}${isToday ? " ★" : ""}</div>
      <div class="tt-slots">${slotsHTML}</div>
    `;
    ttGrid.appendChild(col);
  });
}

$r("ttGrid").addEventListener("click", async e => {
  const btn = e.target.closest(".tt-del");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  try {
    await apiFetch("/api/timetable/" + id, { method: "DELETE" });
    loadTimetable();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ===== Form Submit =====
$r("slotForm").addEventListener("submit", async e => {
  e.preventDefault();
  const day     = $r("slotDay").value;
  const subject = $r("slotSubject").value.trim();
  const time    = $r("slotTime").value.trim();

  if (!subject || !time) { showToast("Please fill all fields.", "error"); return; }

  const btn = $r("slotForm").querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Adding…";

  try {
    await apiFetch("/api/timetable", {
      method: "POST",
      body: JSON.stringify({ day, subject, time })
    });
    $r("slotForm").reset();
    showToast("Slot added.", "success");
    await loadTimetable();

    if (day === todayName) {
      await autoAddTimetableTodo(subject, time);
      showToast('Today\'s class "' + subject + '" auto-added to your To-Do list!', "success");
    }
  } catch(err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add Slot";
  }
});

// ===== Clear All =====
$r("clearTimetableBtn").addEventListener("click", async () => {
  if (!confirm("Clear entire timetable?")) return;
  try {
    await apiFetch("/api/timetable", { method: "DELETE" });
    loadTimetable();
  } catch(err) {
    showToast(err.message, "error");
  }
});

// ===== ADAPTIVE TIMETABLE — Missed Slot Detection =====
async function checkMissedSlots() {
  const now       = new Date();
  const nowHHMM   = now.getHours() * 60 + now.getMinutes();
  const today     = todayISO();

  try {
    const tasksRes = await apiFetch("/api/tasks?isDeadline=false");
    const todos = tasksRes.tasks;

    const missedSlots = allSlots.filter(s => {
      if (s.day !== todayName) return false;
      if (!s.time) return false;

      const parts = s.time.match(/(\d{1,2}):(\d{2})/);
      if (!parts) return false;
      let h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);

      if (/PM/i.test(s.time) && h < 12) h += 12;
      if (/AM/i.test(s.time) && h === 12) h = 0;

      const slotMinutes = h * 60 + m;
      if (slotMinutes >= nowHHMM) return false; // Not yet passed

      const lectureTaskPending = todos.some(
        t => t.subject === s.subject && t.type === "Lecture" && t.dueDate === today && !t.isDone
      );
      return lectureTaskPending;
    });

    if (missedSlots.length === 0) return;

    const box = $r("adaptiveSuggestions");
    if (!box) return;
    box.style.display = "block";

    const ul = $r("adaptiveList");
    if (!ul) return;
    ul.innerHTML = "";

    const todayIdx  = DAYS.indexOf(todayName);
    const nextDay   = DAYS[(todayIdx + 1) % DAYS.length] || "Tomorrow";

    missedSlots.forEach(s => {
      const li = document.createElement("li");
      li.style.cssText = "padding:8px 0;border-bottom:1px solid rgba(10,36,64,0.08);font-weight:600;font-size:0.9rem";
      li.innerHTML = `
        <span style="color:var(--navy-900)">${s.subject}</span>
        <span style="color:var(--muted)"> &bull; ${s.time} was missed</span>
        <span style="color:#2563eb;font-weight:700"> → Suggest moving to ${nextDay}</span>
      `;
      ul.appendChild(li);
    });

    showToast(`${missedSlots.length} class(es) appear missed. Check Adaptive Suggestions below.`, "info");
  } catch(e) { console.error(e); }
}

// ===== Init =====
loadTimetable();
