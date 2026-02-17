'use strict';

const jwt = require('jsonwebtoken');
const { User, Devotee } = require('../models');
const { ROLES } = require('../constants/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user (admin/super_admin).
 * @param {Object} user - User instance or plain object with id, email, role
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
 * Generate a JWT token for a devotee (mobile + OTP auth).
 * @param {Object} devotee - Devotee instance or plain object with id, mobile
 * @returns {string} JWT token
 */
function generateDevoteeToken(devotee) {
  const payload = {
    id: devotee.id,
    mobile: devotee.mobile,
    type: 'devotee',
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

/**
 * Middleware: Verify devotee JWT and attach req.devotee.
 */
async function authenticateDevotee(req, res, next) {
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
    if (decoded.type !== 'devotee') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    const devotee = await Devotee.findByPk(decoded.id);
    if (!devotee) {
      return res.status(401).json({
        success: false,
        message: 'Devotee not found. Token invalid.',
      });
    }

    req.devotee = devotee;
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

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  generateDevoteeToken,
  authenticate,
  authenticateDevotee,
  requireSuperAdmin,
  requireAdmin,
};
