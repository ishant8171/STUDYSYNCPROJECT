// ============================================================
//  routes/auth.js — Auth routes
// ============================================================

const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("erp").trim().notEmpty().withMessage("ERP ID is required").isLength({ max: 50 }),
  body("course").trim().notEmpty().withMessage("Course is required"),
  body("semester").notEmpty().withMessage("Semester is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number")
];

const loginValidation = [
  body("erp").trim().notEmpty().withMessage("ERP ID is required"),
  body("password").notEmpty().withMessage("Password is required")
];

// Routes
router.post("/register", registerValidation, authController.register);
router.post("/login",    loginValidation,    authController.login);
router.get("/me",        verifyToken,         authController.getMe);
router.put("/streak",    verifyToken,         authController.updateStreak);

module.exports = router;
