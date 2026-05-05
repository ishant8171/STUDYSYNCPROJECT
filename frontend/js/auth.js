// ============================================================
//  auth.js — Login & Register (upgraded: saves JWT token)
//  Uses shared storage.js + toast.js + api.js
// ============================================================

const ENV = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
  ? "development" 
  : "production";

const API_BASE = "https://studysyncproject-3.onrender.com";

async function handleLoginSubmit(e) {
  e.preventDefault();

  const erp      = document.querySelector('input[name="erp"]').value.trim();
  const password = document.querySelector('input[name="password"]').value;

  if (!erp || !password) {
    showToast("Please enter your ERP ID and password.", "error");
    return;
  }

  const btn = document.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = "Logging in…"; }

  try {
    const response = await fetch(API_BASE + "/api/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ erp, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Login failed.", "error");
      return;
    }

    // Save JWT token + profile
    if (data.token) {
      localStorage.setItem("ss_token", data.token);
    }
    if (data.user) {
      saveJSON("studentProfile", data.user);
      localStorage.setItem("isLoggedIn", "true"); // backward compat
      window.location.href = "../dashboard/dashboard.html";
    }

  } catch {
    showToast("Cannot reach the server. Make sure the backend is running.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Login"; }
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const name            = document.querySelector('input[name="name"]').value.trim();
  const erp             = document.querySelector('input[name="erp"]').value.trim();
  const course          = document.querySelector('input[name="course"]').value.trim();
  const semester        = document.querySelector('input[name="semester"]').value.trim();
  const password        = document.querySelector('input[name="password"]').value;
  const confirmPassword = document.querySelector('input[name="confirmPassword"]').value;

  if (password !== confirmPassword) {
    showToast("Passwords do not match.", "error");
    return;
  }

  if (password.length < 4) {
    showToast("Password must be at least 4 characters.", "error");
    return;
  }

  const btn = document.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = "Registering…"; }

  try {
    const response = await fetch(API_BASE + "/api/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, erp, course, semester, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Registration failed.", "error");
      return;
    }

    // Save JWT token + profile
    if (data.token) {
      localStorage.setItem("ss_token", data.token);
    }
    if (data.user) {
      saveJSON("studentProfile", data.user);
      localStorage.setItem("isLoggedIn", "true"); // backward compat
      window.location.href = "../dashboard/dashboard.html";
    }

  } catch {
    showToast("Cannot reach the server. Make sure the backend is running.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Register"; }
  }
}

// Auto-bind forms
(function bindAuthForms() {
  const form = document.querySelector("form[data-page]");
  if (!form) return;
  const page = form.getAttribute("data-page");
  if (page === "login")    form.addEventListener("submit", handleLoginSubmit);
  if (page === "register") form.addEventListener("submit", handleRegisterSubmit);
})();
