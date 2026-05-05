// ============================================================
//  models/TimetableSlot.js — Weekly class schedule
// ============================================================

const mongoose = require("mongoose");

const timetableSlotSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true
    },
    day: {
      type:     String,
      required: true,
      enum:     ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    },
    subject: {
      type:     String,
      required: true,
      trim:     true
    },
    time: {
      type:     String,
      required: true,
      trim:     true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimetableSlot", timetableSlotSchema);
