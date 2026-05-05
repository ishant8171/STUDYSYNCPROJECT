// ============================================================
//  middleware/errorHandler.js — Centralized error middleware
// ============================================================

/**
 * Centralized error handler. Mount LAST in Express (after all routes).
 * Usage: next(err) from any route/middleware.
 */
function errorHandler(err, req, res, next) {
  // Log for server-side visibility
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message || err);

  // Mongoose duplicate key (e.g., duplicate ERP)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({ message: `${field} already exists.` });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message).join(", ");
    return res.status(400).json({ message: messages });
  }

  // JWT errors (should not normally reach here — handled in verifyToken)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token." });
  }

  // Default: Internal Server Error
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || "Internal server error.";
  res.status(status).json({ message });
}

module.exports = { errorHandler };
