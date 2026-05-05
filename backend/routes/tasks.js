// ============================================================
//  routes/tasks.js — Tasks API
// ============================================================

const express = require("express");
const taskController = require("../controllers/taskController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// All task routes require authentication
router.use(verifyToken);

router.get("/",     taskController.getAllTasks);
router.post("/",    taskController.createTask);
router.put("/:id",  taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.delete("/",  taskController.clearTasks);

module.exports = router;
