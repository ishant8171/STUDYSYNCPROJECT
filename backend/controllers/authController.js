// ============================================================
//  controllers/authController.js — Auth Logic
// ============================================================

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const JWT_SECRET = process.env.JWT_SECRET || "studysync_secret_change_this_in_production";
const JWT_EXPIRES_IN = "7d";

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, erp, course, semester, password } = req.body;

  try {
    const existing = await User.findOne({ erp });
    if (existing) {
      return res.status(400).json({ message: "ERP ID is already registered." });
    }

    const newUser = new User({ name, erp, course, semester, password });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id.toString(), erp: newUser.erp },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Registration successful!",
      token,
      user: { name, erp, course, semester }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { erp, password } = req.body;

  try {
    const user = await User.findOne({ erp });
    if (!user) {
      return res.status(400).json({ message: "ERP ID not found." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), erp: user.erp },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful!",
      token,
      user: { name: user.name, erp: user.erp, course: user.course, semester: user.semester }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Streak Reset Logic
    if (user.lastStudiedDate) {
      const today = new Date().toISOString().split("T")[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split("T")[0];

      if (user.lastStudiedDate !== today && user.lastStudiedDate !== yesterday) {
        user.studyStreak = 0;
        await user.save();
      }
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

/**
 * Update study streak
 */
exports.updateStreak = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    
    const today = new Date().toISOString().split("T")[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    if (user.lastStudiedDate !== today) {
      if (user.lastStudiedDate === yesterday) {
        user.studyStreak = (user.studyStreak || 0) + 1;
      } else {
        user.studyStreak = 1;
      }
      user.lastStudiedDate = today;
      await user.save();
    }
    
    res.json({ streak: user.studyStreak, lastStudiedDate: user.lastStudiedDate });
  } catch (err) {
    next(err);
  }
};
