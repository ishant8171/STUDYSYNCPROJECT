// ============================================================
//  models/Task.js — Server-side task metadata model
// ============================================================

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true
    },
    subjectId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Subject",
      index:    true
    },
    subject: {
      type:     String,
      required: true,
      trim:     true
    },
    localId: {
      type:  String,
      trim:  true
    },
    title: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 200
    },
    type: {
      type:    String,
      default: "Revision"
    },
    unit: {
      type:    Number,
      default: null
    },
    duration: {
      type:    Number,
      default: null
    },
    deadline: {
      type:  Date,
      index: true
    },
    status: {
      type:    String,
      enum:    ['pending', 'completed'],
      default: 'pending'
    },
    priority: {
      type:    String,
      enum:    ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    isDeadline: {
      type:    Boolean,
      default: false
    },
    notes: {
      type:    String,
      trim:    true,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
