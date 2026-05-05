// ============================================================
//  routes/subjects.js — Subjects API
// ============================================================

const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const Subject = require("../models/Subject");

const router = express.Router();
router.use(verifyToken);

// GET /api/subjects
router.get("/", async (req, res, next) => {
  try {
    const subjects = await Subject.find({ userId: req.user.userId }).sort({ name: 1 });
    res.json({ subjects });
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects
router.post("/", async (req, res, next) => {
  try {
    const { slug, name, semester, units } = req.body;
    
    // Check if subject already exists
    let subject = await Subject.findOne({ userId: req.user.userId, slug });
    if (subject) {
      // Update existing
      subject.name = name;
      subject.semester = semester;
      subject.units = units || subject.units;
      await subject.save();
    } else {
      subject = new Subject({
        userId: req.user.userId,
        slug, name, semester, units
      });
      await subject.save();
    }
    res.status(201).json({ subject, message: "Subject saved." });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subjects/:slug/unit
router.put("/:slug/unit", async (req, res, next) => {
  try {
    const { unitIndex, lectureIndex, isDone } = req.body;
    const subject = await Subject.findOne({ userId: req.user.userId, slug: req.params.slug });
    
    if (!subject) return res.status(404).json({ message: "Subject not found." });
    
    // Update the specific lecture status
    if (subject.units[unitIndex]) {
      subject.units[unitIndex][lectureIndex] = isDone;
      // Tell Mongoose the mixed array has changed
      subject.markModified('units');
      await subject.save();
    }
    
    res.json({ subject });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:slug
router.delete("/:slug", async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndDelete({ userId: req.user.userId, slug: req.params.slug });
    if (!subject) return res.status(404).json({ message: "Subject not found." });
    res.json({ message: "Subject deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
