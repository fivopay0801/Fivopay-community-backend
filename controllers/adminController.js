'use strict';

const { User, Support } = require('../models');
const { ROLES } = require('../constants/roles');
const { generateToken } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const {
  validateLogin,
  validateCreateAdmin,
  validateProfileUpdate,
} = require('../validators/authValidator');
const { validateRaiseSupport } = require('../validators/supportValidator');
const { deleteFileFromS3 } = require('../middleware/upload');

/**
 * POST /api/admin - Create Admin (Super Admin only).
 * Body: { email, password, name, organizationType, phone } (phone = head of organization).
 */
async function create(req, res, next) {
  try {
    const validation = validateCreateAdmin(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const { email, password, name, organizationType, phone } = validation.data;

    const existing = await User.findOne({
      where: { email },
      attributes: ['id'],
    });
    if (existing) {
      return error(res, 'An account with this email already exists.', 409);
    }

    const user = await User.create({
      email,
      name,
      phone,
      role: ROLES.ADMIN,
      organizationType,
      createdById: req.user.id,
    });
    await user.setPassword(password);
    await user.save();

    return success(
      res,
      { user: user.toSafeObject() },
      'Admin created successfully.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/login
 * Login for Admin (church, masjid, gurudwara, temple).
 */
async function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const { email, password } = validation.data;

    const user = await User.scope('withPassword').findOne({
      where: { email, role: ROLES.ADMIN },
    });
    if (!user) {
      return error(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return error(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return error(res, 'Account is deactivated.', 403);
    }

    const token = generateToken(user);
    return success(res, {
      user: user.toSafeObject(),
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/me
 * Return current authenticated Admin (alias getProfile).
 */
async function getMe(req, res, next) {
  try {
    return success(res, { user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/profile
 * Get Admin profile.
 */
async function getProfile(req, res, next) {
  try {
    return success(res, { user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/profile
 * Update Admin profile. Use multipart/form-data for image; JSON or form fields for name, email, address, phone.
 */
async function updateProfile(req, res, next) {
  try {
    const validation = validateProfileUpdate(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const user = req.user;
    const updates = validation.data || {};

    if (updates.email && updates.email !== user.email) {
      const existing = await User.findOne({
        where: { email: updates.email },
        attributes: ['id'],
      });
      if (existing) {
        return error(res, 'An account with this email already exists.', 409);
      }
    }

    if (req.file && req.file.location) {
      if (user.profileImage) {
        await deleteFileFromS3(user.profileImage);
      }
      updates.profileImage = req.file.location;
    }

    await user.update(updates);
    return success(res, { user: user.toSafeObject() }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/profile
 * Delete (deactivate) Admin profile. Account is soft-deleted (isActive = false).
 */
async function deleteProfile(req, res, next) {
  try {
    const user = req.user;
    await user.update({ isActive: false });
    return success(res, null, 'Profile deactivated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/support
 * Raise a help & support issue. reason in body; adminName, adminEmail from logged-in admin.
 */
async function raiseSupport(req, res, next) {
  try {
    const validation = validateRaiseSupport(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const { reason } = validation.data;
    const admin = req.user;

    const ticket = await Support.create({
      reason,
      adminName: admin.name,
      adminEmail: admin.email,
      status: 'pending',
      adminId: admin.id,
    });

    return success(
      res,
      { ticket: ticket.get({ plain: true }) },
      'Support ticket raised successfully.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/support
 * Get all support tickets raised by this admin.
 */
async function getMySupportTickets(req, res, next) {
  try {
    const tickets = await Support.findAll({
      where: { adminId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    return success(res, { tickets, total: tickets.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  login,
  getMe,
  getProfile,
  updateProfile,
  deleteProfile,
  raiseSupport,
  getMySupportTickets,
};
