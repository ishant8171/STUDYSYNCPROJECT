// ============================================================
//  services/taskService.js — Task Business Logic
// ============================================================

const Task = require("../models/Task");

/**
 * Get all tasks for a user
 */
async function getAllTasks(userId, filter = {}) {
  return await Task.find({ userId, ...filter }).sort({ deadline: 1 });
}

/**
 * Create a new task
 */
async function createTask(taskData) {
  const task = new Task(taskData);
  return await task.save();
}

/**
 * Update an existing task
 */
async function updateTask(taskId, userId, updateData) {
  return await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );
}

/**
 * Delete a task
 */
async function deleteTask(taskId, userId) {
  return await Task.findOneAndDelete({ _id: taskId, userId });
}

/**
 * Delete many tasks
 */
async function deleteManyTasks(filter) {
  return await Task.deleteMany(filter);
}

/**
 * Detect missed tasks and return them with suggestions
 */
async function getMissedTasks(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missedTasks = await Task.find({
    userId,
    status: "pending",
    deadline: { $lt: today },
    isDeadline: false
  });

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return missedTasks.map(task => {
    return {
      taskId: task._id,
      title: task.title,
      subjectId: task.subjectId,
      originalDeadline: task.deadline,
      suggestedDeadline: tomorrow,
      message: `Task "${task.title}" is overdue. Suggested new deadline: ${tomorrow.toDateString()}.`
    };
  });
}

/**
 * Automatically update missed tasks priority to "High"
 */
async function updateMissedTasksPriority(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await Task.updateMany(
    {
      userId,
      status: "pending",
      deadline: { $lt: today },
      priority: { $ne: "High" }
    },
    { $set: { priority: "High" } }
  );
}

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteManyTasks,
  getMissedTasks,
  updateMissedTasksPriority
};
