// ============================================================
//  models/User.js — User model with basic streak tracking
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    erp:      { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    course:   { type: String, required: true, trim: true, maxlength: 50 },
    semester: { type: String, required: true },
    password: { type: String, required: true },
    studyStreak: { type: Number, default: 0 },
    lastStudiedDate: { type: String, default: null } // "YYYY-MM-DD"
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
