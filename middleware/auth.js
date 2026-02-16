'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { ROLES } = require('../constants/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user.
 * @param {Object} user - User instance or plain object with id, role
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Middleware: Verify JWT and attach req.user.
 * Responds with 401 if token is missing or invalid.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.',
      });
    }
    next(err);
  }
}

/**
 * Middleware: Require authenticated user to be Super Admin.
 * Must be used after authenticate().
 */
function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Forbidden. Super admin access required.',
  });
}

/**
 * Middleware: Require authenticated user to be Admin.
 * Must be used after authenticate().
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === ROLES.ADMIN) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Forbidden. Admin access required.',
  });
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  authenticate,
  requireSuperAdmin,
  requireAdmin,
};
