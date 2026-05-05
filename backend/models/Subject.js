// ============================================================
//  models/Subject.js — Subject metadata and progress
// ============================================================

const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true
    },
    slug: {
      type:     String,
      required: true,
      trim:     true
    },
    name: {
      type:     String,
      required: true,
      trim:     true
    },
    semester: {
      type:     String,
      required: true
    },
    units: {
      // 2D array or structured data representing completed lectures
      type:    mongoose.Schema.Types.Mixed,
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
