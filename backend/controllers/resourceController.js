// ============================================================
//  controllers/resourceController.js — Resource Logic
// ============================================================

const Resource = require("../models/Resource");
const taskService = require("../services/taskService");
const { validationResult } = require("express-validator");

/**
 * Get all resources
 */
exports.getAllResources = async (req, res, next) => {
  try {
    const filter = { userId: req.user.userId };
    if (req.query.subjectId) {
      filter.subjectId = req.query.subjectId;
    }
    const resources = await Resource.find(filter).sort({ isImportant: -1, createdAt: -1 });
    res.json({ resources });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a resource
 */
exports.createResource = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { title, type, content, subjectId, isImportant } = req.body;
    const resource = new Resource({
      userId: req.user.userId,
      title,
      type,
      content: content || "",
      subjectId,
      isImportant: Boolean(isImportant)
    });
    await resource.save();
    res.status(201).json({ resource, message: "Resource added." });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a resource
 */
exports.updateResource = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!resource) return res.status(404).json({ message: "Resource not found." });
    res.json({ resource, message: "Resource updated." });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a resource
 */
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!resource) return res.status(404).json({ message: "Resource not found." });
    res.json({ message: "Resource deleted." });
  } catch (err) {
    next(err);
  }
};

/**
 * Convert resource to task
 */
exports.convertToTask = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!resource) return res.status(404).json({ message: "Resource not found." });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskData = {
      userId:    resource.userId,
      subjectId: resource.subjectId,
      title:     resource.title,
      type:      "Revision",
      deadline:  today,
      status:    "pending",
      notes:     `Converted from resource: "${resource.title}"`
    };

    const task = await taskService.createTask(taskData);
    res.status(201).json({ 
        task, 
        message: "Resource successfully converted to a planner task." 
    });
  } catch (err) {
    next(err);
  }
};
