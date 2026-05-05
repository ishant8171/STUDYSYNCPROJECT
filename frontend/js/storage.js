// ============================================================
//  storage.js — Centralised localStorage helpers for StudySync
//  Include this BEFORE any page script.
// ============================================================

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function progressKey(semester) {
  return "progress_sem_" + semester;
}

function uid(prefix) {
  return (prefix || "id") + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeSemester() {
  const profile = loadJSON("studentProfile", null);
  const sem = profile && profile.semester ? String(profile.semester) : "1";
  return /^[1-6]$/.test(sem) ? sem : "1";
}
