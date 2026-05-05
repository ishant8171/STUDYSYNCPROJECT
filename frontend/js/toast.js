// ============================================================
//  toast.js — Shared toast notification (replaces all alert())
//  Include this BEFORE any page script.
// ============================================================

function showToast(msg, type) {
  // type: "success" | "error" | "info" (default)
  let box = document.getElementById("_ssToast");
  if (!box) {
    box = document.createElement("div");
    box.id = "_ssToast";
    Object.assign(box.style, {
      position:     "fixed",
      bottom:       "24px",
      left:         "50%",
      transform:    "translateX(-50%)",
      padding:      "13px 22px",
      borderRadius: "12px",
      fontFamily:   "Inter, system-ui, sans-serif",
      fontWeight:   "600",
      fontSize:     "0.93rem",
      boxShadow:    "0 4px 20px rgba(0,0,0,0.22)",
      zIndex:       "9999",
      maxWidth:     "90vw",
      textAlign:    "center",
      transition:   "opacity 0.35s ease",
      pointerEvents:"none"
    });
    document.body.appendChild(box);
  }

  const colors = {
    success: { bg: "#1a6640", text: "#ffffff" },
    error:   { bg: "#991b1b", text: "#ffffff" },
    info:    { bg: "#0a2440", text: "#ffffff" }
  };
  const c = colors[type] || colors.info;
  box.style.background = c.bg;
  box.style.color      = c.text;
  box.textContent      = msg;
  box.style.opacity    = "1";

  clearTimeout(box._timer);
  box._timer = setTimeout(() => { box.style.opacity = "0"; }, 3500);
}
