// ============================================================
//  controllers/taskController.js — Task Logic + Translation Layer
// ============================================================

const taskService = require("../services/taskService");

/**
 * Helper to map backend task to frontend format
 */
function mapTaskToFrontend(task) {
  if (!task) return null;
  const t = task.toObject ? task.toObject() : task;
  return {
    ...t,
    dueDate: t.deadline ? t.deadline.toISOString().split("T")[0] : null,
    isDone:  t.status === "completed",
    // Keep original fields for compatibility
    deadline: undefined,
    status:   undefined
  };
}

/**
 * Get all tasks
 */
exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks(req.user.userId);
    res.json({ tasks: tasks.map(mapTaskToFrontend) });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a task (with translation)
 */
exports.createTask = async (req, res, next) => {
  try {
    const { localId, subject, type, unit, duration, dueDate, isDone, isDeadline, notes, title } = req.body;
    
    const taskData = {
      userId: req.user.userId,
      localId,
      subject,
      title: title || type || "Untitled Task",
      type,
      unit,
      duration,
      deadline: dueDate ? new Date(dueDate) : null,
      status: isDone ? "completed" : "pending",
      isDeadline,
      notes
    };

    const task = await taskService.createTask(taskData);
    res.status(201).json({ task: mapTaskToFrontend(task), message: "Task created." });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a task
 */
exports.updateTask = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // Translation
    if (updateData.dueDate !== undefined) {
      updateData.deadline = updateData.dueDate ? new Date(updateData.dueDate) : null;
      delete updateData.dueDate;
    }
    if (updateData.isDone !== undefined) {
      updateData.status = updateData.isDone ? "completed" : "pending";
      delete updateData.isDone;
    }
    if (updateData.type !== undefined && !updateData.title) {
        updateData.title = updateData.type;
    }

    const task = await taskService.updateTask(req.params.id, req.user.userId, updateData);
    if (!task) return res.status(404).json({ message: "Task not found." });
    
    res.json({ task: mapTaskToFrontend(task) });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a task
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await taskService.deleteTask(req.params.id, req.user.userId);
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete many tasks
 */
exports.clearTasks = async (req, res, next) => {
  try {
    const filter = { userId: req.user.userId };
    if (req.query.isDeadline !== undefined) {
      filter.isDeadline = req.query.isDeadline === 'true';
    }
    await taskService.deleteManyTasks(filter);
    res.json({ message: "Tasks cleared." });
  } catch (err) {
    next(err);
  }
};
