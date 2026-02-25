'use strict';

const { Op } = require('sequelize');
const { User, Support, Donation, Devotee, DevoteeFavorite, sequelize } = require('../models');
const { ROLES } = require('../constants/roles');
const { DONATION_STATUS } = require('../constants/donation');
const { SUPPORT_STATUS_LIST } = require('../constants/support');
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

    const { email, password, name, organizationType, phone, address, latitude, longitude } = validation.data;

    const existing = await User.findOne({
      where: { email },
      attributes: ['id'],
    });
    if (existing) {
      return error(res, 'An account with this email already exists.', 409);
    }

    // Build the user first so we can set the password hash before validation
    const user = User.build({
      email,
      name,
      phone,
      address,
      role: ROLES.ADMIN,
      organizationType,
      createdById: req.user.id,
      latitude,
      longitude,
    });

    // Hash and set the password before saving to satisfy not-null validation
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
 * Get all support tickets for this admin: (1) raised by this admin, (2) raised by devotees for this admin.
 */
async function getMySupportTickets(req, res, next) {
  try {
    const tickets = await Support.findAll({
      where: { adminId: req.user.id },
      include: [
        {
          model: Devotee,
          as: 'devotee',
          attributes: ['id', 'mobile', 'name'],
          required: false,
        },
      ],
      order: sequelize.literal('"Support"."created_at" DESC'),
    });
    const list = tickets.map((t) => {
      const plain = t.get({ plain: true });
      return {
        ...plain,
        raisedBy: plain.devoteeId ? 'devotee' : 'admin',
        devotee: plain.devotee ? { id: plain.devotee.id, mobile: plain.devotee.mobile, name: plain.devotee.name } : null,
      };
    });
    return success(res, { tickets: list, total: list.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/support/:id
 * Update support ticket status (pending | resolved). Only for tickets belonging to this admin.
 */
async function updateSupportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!status || !SUPPORT_STATUS_LIST.includes(status)) {
      return error(res, 'Valid status required: pending or resolved.', 422);
    }

    const ticket = await Support.findOne({
      where: { id, adminId },
    });
    if (!ticket) {
      return error(res, 'Support ticket not found.', 404);
    }

    await ticket.update({ status });
    return success(res, { ticket: ticket.get({ plain: true }) }, 'Support ticket updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/devotees
 * Get list of devotees who have selected this organization in their favorite list.
 * Query: ?page=1&limit=20
 */
async function getMyDevotees(req, res, next) {
  try {
    const adminId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // First, get all unique devotee IDs that have this admin in their favorites.
    const favoriteRows = await DevoteeFavorite.findAll({
      where: { adminId },
      attributes: ['devoteeId'],
    });

    const allIds = [...new Set(favoriteRows.map((f) => f.devoteeId))];
    const total = allIds.length;

    if (total === 0) {
      return success(res, {
        devotees: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    // Manual pagination over the ID list
    const pagedIds = allIds.slice(offset, offset + limit);

    const devoteesRows = await Devotee.findAll({
      where: { id: pagedIds },
      // No explicit order here to avoid referencing a non-existent "createdAt" column in SQL.
    });

    const devotees = devoteesRows.map((d) => d.toSafeObject());

    return success(res, {
      devotees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/devotees/walkin
 * Create or update a devotee (walk-in) and record a CASH donation for this admin.
 * Body: { mobile, name?, email?, city?, amount, eventId?, utr?, transactionId? }
 */
async function createWalkInCashDonation(req, res, next) {
  try {
    const adminId = req.user.id;
    const {
      mobile,
      name,
      email,
      city,
      amount,
      eventId,
      utr,
      transactionId,
    } = req.body || {};

    if (!mobile || typeof mobile !== 'string') {
      return error(res, 'Valid mobile is required.', 422);
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return error(res, 'Valid positive amount is required.', 422);
    }

    // Find existing devotee by mobile or create a new one
    let devotee = await Devotee.findOne({ where: { mobile } });

    if (!devotee) {
      devotee = await Devotee.create({
        mobile,
        name: name || null,
        email: email || null,
        city: city || null,
      });
    } else {
      const updates = {};
      if (typeof name === 'string' && name.trim() && name !== devotee.name) {
        updates.name = name.trim();
      }
      if (typeof email === 'string' && email.trim() && email !== devotee.email) {
        updates.email = email.trim();
      }
      if (typeof city === 'string' && city.trim() && city !== devotee.city) {
        updates.city = city.trim();
      }

      if (Object.keys(updates).length > 0) {
        await devotee.update(updates);
      }
    }

    // Ensure this devotee has this admin as a favorite (linked to this organization)
    await DevoteeFavorite.findOrCreate({
      where: { devoteeId: devotee.id, adminId },
      defaults: { displayOrder: 1 },
    });

    // Record the cash donation as CAPTURED
    const donation = await Donation.create({
      devoteeId: devotee.id,
      adminId,
      eventId: eventId || null,
      amount: numericAmount,
      status: DONATION_STATUS.CAPTURED,
      utr: utr || null,
      transactionId: transactionId || null,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      razorpaySignature: null,
    });

    return success(
      res,
      {
        devotee: devotee.toSafeObject(),
        donation: donation.get({ plain: true }),
      },
      'Walk-in cash donation recorded successfully.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard
 * Get all community overview stats for the admin/organization in one API.
 * Returns: totalRegisteredDevotees, totalDonateDevotees, totalDonation, last30Days, last90Days.
 */
async function getDashboard(req, res, next) {
  try {
    const adminId = req.user.id;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const capturedWhere = { adminId, status: DONATION_STATUS.CAPTURED };

    const [
      totalRegisteredDevotees,
      totalDonateDevoteesResult,
      totalDonationResult,
      last30DaysResult,
      last90DaysResult,
    ] = await Promise.all([
      DevoteeFavorite.count({
        where: { adminId },
        distinct: true,
        col: 'devotee_id',
      }),
      Donation.findAll({
        where: capturedWhere,
        attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('devotee_id'))), 'count']],
        raw: true,
      }),
      Donation.sum('amount', { where: capturedWhere }),
      Donation.sum('amount', {
        where: {
          ...capturedWhere,
          [Op.and]: [sequelize.where(sequelize.col('created_at'), Op.gte, thirtyDaysAgo)],
        },
      }),
      Donation.sum('amount', {
        where: {
          ...capturedWhere,
          [Op.and]: [sequelize.where(sequelize.col('created_at'), Op.gte, ninetyDaysAgo)],
        },
      }),
    ]);

    const totalDonateDevotees = parseInt(totalDonateDevoteesResult[0]?.count || 0, 10);
    const totalDonationRupees = parseFloat(totalDonationResult || 0).toFixed(2);
    const last30DaysRupees = parseFloat(last30DaysResult || 0).toFixed(2);
    const last90DaysRupees = parseFloat(last90DaysResult || 0).toFixed(2);

    return success(res, {
      totalRegisteredDevotees,
      totalDonateDevotees,
      totalDonationRupees,
      last30DaysRupees,
      last90DaysRupees,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/transactions
 * Get devotee donation/transaction list for this organization (temple, church, masjid, gurudwara).
 * Query: ?page=1&limit=20&status=captured|pending|failed (optional).
 */
async function getDevoteeTransactions(req, res, next) {
  try {
    const adminId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;
    const paymentMethodFilter = req.query.paymentMethod;

    const where = { adminId };
    if (statusFilter && ['pending', 'captured', 'failed'].includes(statusFilter)) {
      where.status = statusFilter;
    }
    if (paymentMethodFilter) {
      where.paymentMethod = paymentMethodFilter;
    }

    const { count, rows } = await Donation.findAndCountAll({
      where,
      include: [
        {
          model: Devotee,
          attributes: ['id', 'mobile', 'name'],
        },
      ],
      order: sequelize.literal('"Donation"."created_at" DESC'),
      limit,
      offset,
      distinct: true,
    });

    const transactions = rows.map((d) => {
      const plain = d.get({ plain: true });
      // Debug log to see available fields
      console.log('Transaction plain object:', JSON.stringify(plain, null, 2));

      const createdAt = plain.createdAt || plain.created_at;
      const dateObj = createdAt ? new Date(createdAt) : null;

      return {
        id: plain.id,
        amount: plain.amount,
        amountRupees: plain.amount,
        status: plain.status,
        razorpayOrderId: plain.razorpayOrderId,
        razorpayPaymentId: plain.razorpayPaymentId,
        paymentMethod: plain.paymentMethod,
        devotee: plain.Devotee
          ? { id: plain.Devotee.id, mobile: plain.Devotee.mobile, name: plain.Devotee.name }
          : null,
        transactionDate: dateObj ? dateObj.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
        transactionTime: dateObj ? dateObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : null,
        createdAt: createdAt,
      };
    });

    // Top Contributors (Devotees who donated most to this admin)
    const topContributorsList = await Donation.findAll({
      where: {
        adminId,
        status: 'captured', // Ensure only successful donations are counted
      },
      attributes: [
        'devoteeId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      ],
      include: [
        {
          model: Devotee,
          attributes: ['id', 'name', 'mobile'], // Add profileImage if available in model
        },
      ],
      group: ['devoteeId', 'Devotee.id'],
      order: [[sequelize.literal('"totalAmount"'), 'DESC']],
      limit: 5,
    });

    const topContributors = topContributorsList.map((tc) => {
      const plain = tc.get({ plain: true });
      return {
        devoteeId: plain.devoteeId,
        totalAmount: plain.totalAmount,
        totalAmountRupees: plain.totalAmount, // Already in Rupees
        devotee: plain.Devotee ? {
          id: plain.Devotee.id,
          name: plain.Devotee.name,
          mobile: plain.Devotee.mobile
        } : null,
      };
    });

    return success(res, {
      transactions,
      topContributors,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
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
  getDashboard,
  raiseSupport,
  getMySupportTickets,
  updateSupportStatus,
  getMyDevotees,
  getDevoteeTransactions,
  createWalkInCashDonation,
};
