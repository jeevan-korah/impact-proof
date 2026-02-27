// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";

// Verifies JWT and attaches decoded payload to req.user
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "authorization token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "token has expired",
      });
    }
    return res.status(401).json({
      success: false,
      message: "invalid token",
    });
  }
};

// Role guard — use after authenticate
// Usage: requireRole('engineer') or requireRole('company')
export const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: `access restricted to ${role} accounts`,
    });
  }
  next();
};
