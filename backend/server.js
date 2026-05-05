// ============================================================
//  server.js — StudySync Backend v2.0
//  Upgrades: JWT auth, rate limiting, helmet, centralized errors
// ============================================================

require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const mongoose     = require("mongoose");
const rateLimit    = require("express-rate-limit");

const authRoutes      = require("./routes/auth");
const plannerRoutes   = require("./routes/planner");
const resourceRoutes  = require("./routes/resources");
const taskRoutes      = require("./routes/tasks");
const subjectRoutes   = require("./routes/subjects");
const perfRoutes      = require("./routes/performance");
const timetableRoutes = require("./routes/timetable");
const { errorHandler } = require("./middleware/errorHandler");

const app      = express();
const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/studysync";

// ===== Security Middleware =====
app.use(helmet());

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: "Too many requests. Please try again later." }
});
app.use(limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: "Too many auth attempts. Please try again in 15 minutes." }
});

// ===== General Middleware =====
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5500' }));
app.use(express.json({ limit: "1mb" }));

// ===== Routes =====
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/planner",     plannerRoutes);
app.use("/api/resources",   resourceRoutes);
app.use("/api/tasks",       taskRoutes);
app.use("/api/subjects",    subjectRoutes);
app.use("/api/performance", perfRoutes);
app.use("/api/timetable",   timetableRoutes);

// Legacy route support (old /api/login and /api/register still work)
app.use("/api",           authLimiter, authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ===== Centralized Error Handler (must be last) =====
app.use(errorHandler);

// ===== Database + Start Server =====
if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
  console.error("❌ CRITICAL: MONGO_URI is not defined in environment variables!");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
.then(() => {
  // Extracting DB name/host for safer logging (not the password)
  const dbHost = MONGO_URI.split('@').pop().split('/')[0] || "Remote DB";
  console.log("✅ MongoDB connected to host:", dbHost);
  
  app.listen(PORT, () => {
    console.log(`🚀 StudySync server v2.0 running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api (locally)`);
  });
})
.catch(err => {
  console.error("❌ MongoDB connection failed!");
  console.error("   Error Message:", err.message);
  console.error("   Check your MONGO_URI and IP Whitelist in MongoDB Atlas.");
  process.exit(1);
});
