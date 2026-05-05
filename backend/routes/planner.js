// ============================================================
//  routes/planner.js — Planner API
// ============================================================

const express = require("express");
const plannerController = require("../controllers/plannerController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// All planner routes require authentication
router.use(verifyToken);

router.get("/suggest",   plannerController.getSuggestions);
router.get("/reminders", plannerController.getReminders);

module.exports = router;
