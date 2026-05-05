// ============================================================
//  middleware/auth.js — JWT verification middleware
// ============================================================

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "studysync_secret_change_this_in_production";

/**
 * verifyToken — Protect any route by attaching this middleware.
 * Reads: Authorization: Bearer <token>
 * Attaches: req.user = { userId, erp }
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, erp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

module.exports = { verifyToken };
