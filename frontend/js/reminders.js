// ============================================================
//  reminders.js — Global Reminder Banner + Missed Task Badge
//  Include in ALL protected pages (before </body>).
//  Fetches from backend API.
// ============================================================

(async function initReminders() {
  // Only run on pages that have a .topbar (i.e., protected pages)
  if (!document.querySelector(".topbar")) return;

  // Don't show if dismissed in this session
  if (sessionStorage.getItem("ss_banner_dismissed") === "1") return;

  try {
    const token = localStorage.getItem("ss_token");
    if (!token || typeof apiFetch !== "function") return;

    const data = await apiFetch("/api/planner/reminders");
    const { urgentDeadlines, missedTasks } = data;

    // ===== Render reminder banner if needed =====
    if (urgentDeadlines.length === 0 && missedTasks.length === 0) return;

    const banner = document.createElement("div");
    banner.id = "ss-reminder-banner";
    banner.style.cssText = [
      "background: linear-gradient(90deg, #0a2440, #10365f)",
      "color: #fff",
      "padding: 10px 18px",
      "font-family: Inter, system-ui, sans-serif",
      "font-size: 0.88rem",
      "font-weight: 600",
      "display: flex",
      "align-items: center",
      "justify-content: space-between",
      "flex-wrap: wrap",
      "gap: 8px",
      "z-index: 99",
      "border-bottom: 1px solid rgba(255,255,255,0.08)"
    ].join(";");

    // Build message
    const parts = [];
    if (urgentDeadlines.length > 0) {
      const first = urgentDeadlines[0];
      const label = first.daysLeft < 0
        ? `⚠️ OVERDUE: ${first.type} • ${first.subject}`
        : first.daysLeft === 0
          ? `🔴 TODAY: ${first.type} • ${first.subject}`
          : `🟠 ${first.daysLeft} day(s) left: ${first.type} • ${first.subject}`;
      parts.push(label);
      if (urgentDeadlines.length > 1) {
        parts.push(`+${urgentDeadlines.length - 1} more deadline(s)`);
      }
    }
    if (missedTasks.length > 0) {
      parts.push(`⏰ ${missedTasks.length} missed task(s) — visit Planner`);
    }

    const msg = document.createElement("span");
    msg.textContent = parts.join("   ·   ");

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;align-items:center;flex-shrink:0";

    const plannerLink = document.createElement("a");
    plannerLink.textContent = "Open Planner →";
    plannerLink.style.cssText = [
      "color: #7fb0ff",
      "font-weight: 700",
      "text-decoration: none",
      "white-space: nowrap"
    ].join(";");
    
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const depth = pathParts.length;
    plannerLink.href = depth >= 2 ? "../planner/planner.html" : "pages/planner/planner.html";

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = [
      "background: transparent",
      "border: 1px solid rgba(255,255,255,0.25)",
      "color: rgba(255,255,255,0.7)",
      "border-radius: 6px",
      "padding: 2px 8px",
      "cursor: pointer",
      "font-size: 0.8rem"
    ].join(";");
    
    closeBtn.addEventListener("click", () => {
      banner.style.display = "none";
      sessionStorage.setItem("ss_banner_dismissed", "1");
    });

    actions.appendChild(plannerLink);
    actions.appendChild(closeBtn);
    banner.appendChild(msg);
    banner.appendChild(actions);

    // Insert right after topbar
    const topbar = document.querySelector(".topbar");
    if (topbar && topbar.nextSibling) {
      topbar.parentNode.insertBefore(banner, topbar.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  } catch (err) {
    // silently fail
  }
})();
