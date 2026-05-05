// ============================================================
//  routes/timetable.js — Timetable API
// ============================================================

const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const TimetableSlot = require("../models/TimetableSlot");

const router = express.Router();
router.use(verifyToken);

// GET /api/timetable
router.get("/", async (req, res, next) => {
  try {
    const slots = await TimetableSlot.find({ userId: req.user.userId });
    res.json({ slots });
  } catch (err) {
    next(err);
  }
});

// POST /api/timetable
router.post("/", async (req, res, next) => {
  try {
    const { day, subject, time } = req.body;
    const slot = new TimetableSlot({
      userId: req.user.userId,
      day, subject, time
    });
    await slot.save();
    res.status(201).json({ slot, message: "Slot added." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/timetable/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const slot = await TimetableSlot.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!slot) return res.status(404).json({ message: "Slot not found." });
    res.json({ message: "Slot deleted." });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/timetable (Clear all)
router.delete("/", async (req, res, next) => {
  try {
    await TimetableSlot.deleteMany({ userId: req.user.userId });
    res.json({ message: "Timetable cleared." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
