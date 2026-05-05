// ============================================================
//  routes/performance.js — Performance API
// ============================================================

const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const Performance = require("../models/Performance");

const router = express.Router();
router.use(verifyToken);

// GET /api/performance
router.get("/", async (req, res, next) => {
  try {
    const performanceData = await Performance.find({ userId: req.user.userId }).sort({ date: -1 });
    res.json({ performanceData });
  } catch (err) {
    next(err);
  }
});

// POST /api/performance
router.post("/", async (req, res, next) => {
  try {
    const { date, tasksCompleted, unitsCompleted, studyStreak } = req.body;
    const performance = new Performance({
      userId: req.user.userId,
      date: new Date(date), // Map string to Date
      tasksCompleted, 
      unitsCompleted, 
      studyStreak
    });
    await performance.save();
    res.status(201).json({ performance, message: "Performance recorded." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
