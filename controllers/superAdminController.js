'use strict';

const { Op } = require('sequelize');
const { User, Support, SupportMessage, Devotee, Donation, sequelize } = require('../models');
const { ROLES, ORGANIZATION_TYPES_LIST } = require('../constants/roles');
const {
  ORGANIZATION_CATEGORIES,
  ORGANIZATION_CATEGORIES_LIST,
  FAITHS_LIST,
  ALL_SUBTYPES_LIST,
} = require('../constants/organization');
const { generateToken } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const {
  validateSuperAdminRegister,
  validateLogin,
  validateProfileUpdate,
  validateEmail,
  validateVerifyForgotOtp,
  validateResetPassword,
} = require('../validators/authValidator');
const { generateOtp, sendEmailOtp, generateRandomOtp } = require('../services/otpService');
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

/**
 * POST /api/super-admin/forgot-password
 * Send OTP to email for password reset.
 */
async function forgotPassword(req, res, next) {
  try {
    const validation = validateEmail(req.body.email);
    if (!validation.valid) {
      return error(res, validation.message, 422);
    }
    const email = validation.value;

    const user = await User.findOne({ where: { email, role: ROLES.SUPER_ADMIN } });
    if (!user) {
      // For security, don't reveal if email exists
      return success(res, { message: 'If this email is registered, you will receive an OTP shortly.' });
    }

    const now = new Date();
    // Resend delay (60s)
    if (user.lastOtpSentAt) {
      const secondsSinceLast = (now - new Date(user.lastOtpSentAt)) / 1000;
      if (secondsSinceLast < 60) {
        const wait = Math.ceil(60 - secondsSinceLast);
        return error(res, `Please wait ${wait} seconds before requesting a new OTP.`, 429);
      }
    }

    // Hourly limit (3 per hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (!user.otpWindowStartAt || new Date(user.otpWindowStartAt) < oneHourAgo) {
      user.otpWindowStartAt = now;
      user.otpCount = 0;
    }

    if (user.otpCount >= 3) {
      return error(res, 'Maximum OTP limit reached (3 per hour). Please try again later.', 429);
    }

    const otp = generateRandomOtp();
    await user.setOtp(otp);

    user.lastOtpSentAt = now;
    user.otpCount += 1;
    await user.save();

    await sendEmailOtp(email, otp);

    return success(res, { message: 'OTP sent successfully to your registered email.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/super-admin/verify-forgot-otp
 * Verify OTP for password reset.
 */
async function verifyForgotOtp(req, res, next) {
  try {
    const validation = validateVerifyForgotOtp(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { email, otp } = validation.data;

    const user = await User.findOne({ where: { email, role: ROLES.SUPER_ADMIN } });
    if (!user) {
      return error(res, 'Invalid email or OTP.', 401);
    }

    const isValid = await user.verifyOtp(otp);
    if (!isValid) {
      return error(res, 'Invalid or expired OTP.', 401);
    }

    return success(res, { message: 'OTP verified successfully. You can now reset your password.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/super-admin/reset-password
 * Reset password using OTP.
 */
async function resetPassword(req, res, next) {
  try {
    const validation = validateResetPassword(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { email, otp, password } = validation.data;

    const user = await User.findOne({ where: { email, role: ROLES.SUPER_ADMIN } });
    if (!user) {
      return error(res, 'Invalid email or OTP.', 401);
    }

    const isValid = await user.verifyOtp(otp);
    if (!isValid) {
      return error(res, 'Invalid or expired OTP.', 401);
    }

    // Update password and clear OTP
    await user.setPassword(password);
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    return success(res, null, 'Password reset successfully. You can now login with your new password.');
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

    const { organizationCategory, faith, organizationSubtype } = req.query;
    if (organizationCategory && ORGANIZATION_CATEGORIES_LIST.includes(organizationCategory.toLowerCase().trim())) {
      where.organizationCategory = organizationCategory.toLowerCase().trim();
    }
    if (faith && FAITHS_LIST.includes(faith.toLowerCase().trim())) {
      where.faith = faith.toLowerCase().trim();
    }
    if (organizationSubtype && ALL_SUBTYPES_LIST.includes(organizationSubtype.toLowerCase().trim())) {
      where.organizationSubtype = organizationSubtype.toLowerCase().trim();
    }

    const admins = await User.findAll({
      where,
      attributes: [
        'id',
        'orgId',
        'name',
        'email',
        'phone',
        'address',
        'profileImage',
        'role',
        'organizationType',
        'organizationCategory',
        'faith',
        'organizationSubtype',
        'panNumber',
        'registration80GNumber',
        'isActive',
        'latitude',
        'longitude',
        [sequelize.col('created_at'), 'createdAt'],
        [sequelize.col('updated_at'), 'updatedAt'],
      ],
      order: [['organizationType', 'ASC'], ['name', 'ASC'], sequelize.literal('"User"."created_at" DESC')],
    });

    const adminsList = admins.map((admin) => {
      const plain = admin.get({ plain: true });
      return {
        ...plain,
        googleMapLink: (plain.latitude && plain.longitude)
          ? `https://www.google.com/maps?q=${plain.latitude},${plain.longitude}`
          : null,
      };
    });

    return success(res, { admins: adminsList, total: adminsList.length });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/super-admin/admins/:id
 * Deactivate an admin (for Super Admin only).
 */
async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;

    const admin = await User.findOne({
      where: { id, role: ROLES.ADMIN },
    });

    if (!admin) {
      return error(res, 'Admin not found.', 404);
    }

    await admin.update({ isActive: false });
    return success(res, null, 'Admin deactivated successfully.');
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
      order: [['created_at', 'DESC']],
    });

    const list = devotees.map(d => d.toSafeObject());

    return success(res, { devotees: list, total: list.length });
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
      include: [
        {
          model: SupportMessage,
          as: 'messages',
          required: false,
        },
      ],
      order: [
        ['created_at', 'DESC'],
        [{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC'],
      ],
    });

    const list = tickets.map((t) => {
      const plain = t.get({ plain: true });
      const messages = plain.messages || [];
      const lastMessage = messages.length ? messages[messages.length - 1] : null;
      const unreadCount = messages.filter((m) => !m.isRead).length;

      return {
        ...plain,
        lastMessagePreview: lastMessage ? String(lastMessage.message).slice(0, 200) : null,
        lastMessageAt: lastMessage ? lastMessage.created_at || lastMessage.createdAt : null,
        unreadCount,
      };
    });

    return success(res, { tickets: list, total: list.length });
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
      return error(res, 'Valid status required: pending, in_progress, or resolved.', 422);
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

/**
 * GET /api/super-admin/support/:id
 * Get a single support ticket with messages (no ownership restriction).
 */
async function getSupportTicketWithMessages(req, res, next) {
  try {
    const { id } = req.params;

    const ticket = await Support.findOne({
      where: { id },
      include: [
        {
          model: SupportMessage,
          as: 'messages',
          required: false,
        },
      ],
      order: [
        ['created_at', 'DESC'],
        [{ model: SupportMessage, as: 'messages' }, 'created_at', 'ASC'],
      ],
    });

    if (!ticket) {
      return error(res, 'Support ticket not found.', 404);
    }

    // Mark all messages from the other side as read when super admin views the conversation.
    await SupportMessage.update(
      { isRead: true },
      {
        where: {
          supportId: ticket.id,
          isRead: false,
          senderRole: { [Op.ne]: 'SUPER_ADMIN' },
        },
      }
    );

    const plain = ticket.get({ plain: true });
    return success(res, { ticket: plain });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/super-admin/support/:id/message
 * Super admin replies to any support ticket.
 */
async function addSupportMessageAsSuperAdmin(req, res, next) {
  try {
    const { validateSupportMessage } = require('../validators/supportValidator');
    const { id } = req.params;

    const validation = validateSupportMessage(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { message } = validation.data;

    const ticket = await Support.findByPk(id);
    if (!ticket) {
      return error(res, 'Support ticket not found.', 404);
    }

    const createdMessage = await SupportMessage.create({
      supportId: ticket.id,
      senderRole: 'SUPER_ADMIN',
      senderId: req.user.id,
      message,
    });

    // When super admin responds, mark ticket as in_progress unless already resolved.
    if (ticket.status === 'pending') {
      await ticket.update({ status: 'in_progress' });
    }

    // When replying, mark existing messages from the other side as read as they have been seen.
    await SupportMessage.update(
      { isRead: true },
      {
        where: {
          supportId: ticket.id,
          isRead: false,
          senderRole: { [Op.ne]: 'SUPER_ADMIN' },
        },
      }
    );

    return success(
      res,
      { message: createdMessage.get({ plain: true }) },
      'Message added to support ticket.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/super-admin/stats
 * Dashboard statistics: org counts, donation sums (30/90 days), support tickets, devotees.
 */
async function getDashboardStats(req, res, next) {
  try {
    // 1. Organization Counts by Type
    const orgCounts = await User.findAll({
      where: { role: ROLES.ADMIN, isActive: true },
      attributes: [
        'organizationType',
        'organizationCategory',
        'faith',
        'organizationSubtype',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['organizationType', 'organizationCategory', 'faith', 'organizationSubtype'],
      raw: true,
    });

    const organizations = {
      total: 0,
      byType: {
        temple: 0,
        church: 0,
        masjid: 0,
        gurudwara: 0,
        other: 0,
      },
      byCategory: {
        faith: 0,
        ngo: 0,
      },
      byFaith: {},
    };

    FAITHS_LIST.forEach(f => organizations.byFaith[f] = 0);

    orgCounts.forEach((org) => {
      const count = parseInt(org.count, 10);
      organizations.total += count;

      // Legacy type count
      const type = (org.organizationType || 'other').toLowerCase();
      if (organizations.byType[type] !== undefined) {
        organizations.byType[type] += count;
      } else {
        organizations.byType.other += count;
      }

      // New hierarchy counts
      if (org.organizationCategory) {
        organizations.byCategory[org.organizationCategory] = (organizations.byCategory[org.organizationCategory] || 0) + count;
      }
      if (org.faith) {
        organizations.byFaith[org.faith] = (organizations.byFaith[org.faith] || 0) + count;
      }
    });

    // 2. Donation Amounts (Last 30 & 90 Days)
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const last90Days = new Date(today);
    last90Days.setDate(today.getDate() - 90);

    const donationStats = await Donation.findAll({
      attributes: [
        [
          sequelize.fn(
            'SUM',
            sequelize.literal(`CASE WHEN "created_at" >= '${last30Days.toISOString()}' THEN "amount" ELSE 0 END`)
          ),
          'last30Days',
        ],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal(`CASE WHEN "created_at" >= '${last90Days.toISOString()}' THEN "amount" ELSE 0 END`)
          ),
          'last90Days',
        ],
      ],
      where: {
        status: 'captured', // Using literal string or import constant if available. specific matching 'captured' status.
      },
      raw: true,
    });

    const totalDonationsLast30Days = parseFloat(donationStats[0]?.last30Days || 0).toFixed(2);
    const totalDonationsLast90Days = parseFloat(donationStats[0]?.last90Days || 0).toFixed(2);

    // 3. Total Support Tickets
    const totalSupportTickets = await Support.count();

    // 4. Total Devotees
    const totalDevotees = await Devotee.count();

    return success(res, {
      organizations,
      donations: {
        last30Days: totalDonationsLast30Days,
        last90Days: totalDonationsLast90Days,
      },
      supportTickets: {
        total: totalSupportTickets,
      },
      devotees: {
        total: totalDevotees,
      },
    });
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
  deleteAdmin,
  getAllDevotees,
  getAllSupportTickets,
  updateSupportStatus,
  getDashboardStats,
  getSupportTicketWithMessages,
  addSupportMessageAsSuperAdmin,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
};
