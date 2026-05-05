// ============================================================
//  api.js — Shared API fetch helper for StudySync frontend
//  Include this BEFORE any page script that talks to the backend.
// ============================================================

const ENV = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
  ? "development" 
  : "production";

const API_BASE = ENV === "development" 
  ? "http://localhost:5000" 
  : "https://studysyncproject-3.onrender.com";

/**
 * apiFetch — wrapper around fetch that automatically:
 *   1. Attaches Authorization: Bearer <token> header
 *   2. Redirects to login on 401
 *   3. Returns parsed JSON or throws an error
 *
 * @param {string} path    - e.g. "/api/planner/suggest"
 * @param {object} options - same as fetch options
 * @returns {Promise<object>} parsed JSON response
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("ss_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const response = await fetch(API_BASE + path, {
    ...options,
    headers
  });

  // Token expired or invalid — force re-login
  if (response.status === 401) {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("studentProfile");
    // Find the relative path to login from any page depth
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = depth >= 2 ? "../auth/" : "pages/auth/";
    window.location.href = prefix + "login.html";
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.message || "Request failed.");
    err.status = response.status;
    throw err;
  }

  return data;
}

/**
 * isAuthenticated — checks if a valid token exists
 * (Used as a lightweight auth guard on page load)
 */
function isAuthenticated() {
  return !!localStorage.getItem("ss_token");
}

/**
 * authGuard — call at the top of every protected page script.
 * Redirects to login if no token found.
 */
function authGuard() {
  if (!isAuthenticated()) {
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = depth >= 2 ? "../auth/" : "pages/auth/";
    window.location.href = prefix + "login.html";
  }
}

/**
 * logout — clears session and redirects to login
 */
function logout() {
  localStorage.removeItem("ss_token");
  localStorage.setItem("isLoggedIn", "false"); // keep for backward compat
  window.location.href = "../auth/login.html";
}
