// ============================================================
//  models/Performance.js — Performance analytics data
// ============================================================

const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true
    },
    date: {
      type:     Date,
      required: true,
      index:    true
    },
    tasksCompleted: {
      type:    Number,
      default: 0
    },
    unitsCompleted: {
      type:    Number,
      default: 0
    },
    studyStreak: {
      type:    Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Performance", performanceSchema);
