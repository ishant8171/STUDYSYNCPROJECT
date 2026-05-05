// ============================================================
//  models/Resource.js — Subject Resource model
// ============================================================

const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
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
    title: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 200
    },
    type: {
      type:    String,
      enum:    ["note", "link", "file"],
      default: "note"
    },
    content: {
      type:    String,
      trim:    true,
      default: ""
    },
    isImportant: {
      type:    Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
