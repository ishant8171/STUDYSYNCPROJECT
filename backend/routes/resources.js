// ============================================================
//  routes/resources.js — Resources API
// ============================================================

const express = require("express");
const { body, param } = require("express-validator");
const resourceController = require("../controllers/resourceController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// All resource routes require authentication
router.use(verifyToken);

// Validation rules
const resourceValidation = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("type").isIn(["note", "link", "file"]).withMessage("Type must be note, link, or file"),
  body("content").optional().trim(),
  body("subjectId").optional().isMongoId().withMessage("Invalid Subject ID"),
  body("isImportant").optional().isBoolean()
];

const updateValidation = [
  param("id").isMongoId().withMessage("Invalid resource ID"),
  body("title").optional().trim().isLength({ min: 1, max: 200 }),
  body("type").optional().isIn(["note", "link", "file"]),
  body("content").optional().trim(),
  body("isImportant").optional().isBoolean()
];

// Routes
router.get("/",     resourceController.getAllResources);
router.post("/",    resourceValidation, resourceController.createResource);
router.put("/:id",  updateValidation,   resourceController.updateResource);
router.delete("/:id", resourceController.deleteResource);

// Feature: Resource to Task Conversion
router.post("/:id/convert-to-task", resourceController.convertToTask);

// Legacy support (optional, if frontend uses it)
router.post("/:id/to-task", resourceController.convertToTask);

module.exports = router;
