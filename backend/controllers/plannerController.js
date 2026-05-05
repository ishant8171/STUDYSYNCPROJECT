// ============================================================
//  controllers/plannerController.js — Planner Logic
// ============================================================

const Task = require("../models/Task");
const Subject = require("../models/Subject");
const plannerService = require("../services/plannerService");
const taskService = require("../services/taskService");

/**
 * Get study suggestions
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId, isDeadline: false });
    const deadlines = await Task.find({ userId: req.user.userId, isDeadline: true });
    const progress = await Subject.find({ userId: req.user.userId });
    
    const suggestions = plannerService.generateDailySuggestions(tasks, deadlines, progress);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
};

/**
 * Get reminders (urgent deadlines + missed tasks)
 */
exports.getReminders = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId, isDeadline: false });
    const deadlines = await Task.find({ userId: req.user.userId, isDeadline: true });
    
    const { urgentDeadlines } = plannerService.generateReminders(tasks, deadlines);
    const missedTasks = await taskService.getMissedTasks(req.user.userId);
    
    // Auto-update missed task priorities
    await taskService.updateMissedTasksPriority(req.user.userId);
    
    res.json({ urgentDeadlines, missedTasks });
  } catch (err) {
    next(err);
  }
};
