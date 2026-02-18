'use strict';

const { User, Support, Devotee, sequelize } = require('../models');
const { ROLES, ORGANIZATION_TYPES_LIST } = require('../constants/roles');
const { generateToken } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const {
  validateSuperAdminRegister,
  validateLogin,
  validateProfileUpdate,
} = require('../validators/authValidator');
const { deleteFileFromS3 } = require('../middleware/upload');

/**
 * POST /api/super-admin/register
 * Register a new Super Admin (Chairman).
 */
async function register(req, res, next) {
  try {
    const validation = validateSuperAdminRegister(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const { email, password, name, address, phone } = validation.data;

    const existing = await User.findOne({
      where: { email },
      attributes: ['id'],
    });
    if (existing) {
      return error(res, 'An account with this email already exists.', 409);
    }

    // Build the user first so we can set the password hash
    const user = User.build({
      email,
      name,
      address,
      phone,
      role: ROLES.SUPER_ADMIN,
    });

    // Hash and set the password before saving to satisfy not-null validation
    await user.setPassword(password);
    await user.save();

    const token = generateToken(user);
    return success(
      res,
      {
        user: user.toSafeObject(),
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
      'Super admin registered successfully.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/super-admin/login
 * Login for Super Admin.
 */
async function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }

    const { email, password } = validation.data;

    const user = await User.scope('withPassword').findOne({
      where: { email, role: ROLES.SUPER_ADMIN },
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


async function getMe(req, res, next) {
  try {
    return success(res, { user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}


async function getProfile(req, res, next) {
  try {
    return success(res, { user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}


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
 * GET /api/super-admin/admins
 * Get all admins (for Super Admin only).
 * Query: ?organizationType=temple|church|masjid|gurudwara (optional - filter by org type).
 */
async function getAllAdmins(req, res, next) {
  try {
    const where = { role: ROLES.ADMIN };
    const organizationType = req.query.organizationType;
    if (organizationType && ORGANIZATION_TYPES_LIST.includes(organizationType.toLowerCase().trim())) {
      where.organizationType = organizationType.toLowerCase().trim();
    }

    const admins = await User.findAll({
      where,
      attributes: [
        'id',
        'name',
        'email',
        'phone',
        'organizationType',
        'isActive',
        [sequelize.col('created_at'), 'createdAt'],
      ],
      order: [['organizationType', 'ASC'], ['name', 'ASC'], sequelize.literal('"User"."created_at" DESC')],
    });

    return success(res, { admins, total: admins.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/super-admin/devotees
 * Get list of all devotees (for Super Admin only).
 */
async function getAllDevotees(req, res, next) {
  try {
    const devotees = await Devotee.findAll({
      attributes: ['id', 'mobile', 'name', [sequelize.col('created_at'), 'createdAt']],
      order: sequelize.literal('"Devotee"."created_at" DESC'),
    });

    return success(res, { devotees, total: devotees.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/super-admin/support
 * Get all help & support tickets (for Super Admin).
 */
async function getAllSupportTickets(req, res, next) {
  try {
    const tickets = await Support.findAll({
      order: sequelize.literal('"Support"."created_at" DESC'),
    });

    return success(res, { tickets, total: tickets.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/super-admin/support/:id
 * Update support ticket status (pending | resolved).
 */
async function updateSupportStatus(req, res, next) {
  try {
    const { SUPPORT_STATUS_LIST } = require('../constants/support');

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !SUPPORT_STATUS_LIST.includes(status)) {
      return error(res, 'Valid status required: pending or resolved.', 422);
    }

    const ticket = await Support.findByPk(id);
    if (!ticket) {
      return error(res, 'Support ticket not found.', 404);
    }

    await ticket.update({ status });
    return success(res, { ticket }, 'Support ticket updated successfully.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  getProfile,
  updateProfile,
  deleteProfile,
  getAllAdmins,
  getAllDevotees,
  getAllSupportTickets,
  updateSupportStatus,
};
