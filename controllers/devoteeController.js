'use strict';

const { Op } = require('sequelize');
const { User, Devotee, DevoteeFavorite, Support, SupportMessage } = require('../models');
const { ROLES } = require('../constants/roles');
const { ORGANIZATION_TYPES_LIST } = require('../constants/roles');
const { generateDevoteeToken } = require('../middleware/auth');
const { success, error } = require('../utils/response');
const { deleteFileFromS3 } = require('../middleware/upload');
const { generateOtp, sendOtp } = require('../services/otpService');
const {
  validateSendOtp,
  validateVerifyOtp,
  validateDevoteeDetails,
  validateSetFavorites,
  validateOrganizationType,
} = require('../validators/devoteeValidator');
const {
  validateDevoteeRaiseSupport,
  validateSupportMessage,
} = require('../validators/supportValidator');

const MAX_FAVORITES = 5;

/**
 * POST /api/devotee/send-otp
 * Send 4-digit OTP to mobile.
 * Body: { mobile }
 */
async function sendOtpHandler(req, res, next) {
  try {
    const validation = validateSendOtp(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { mobile } = validation.data;

    let devotee = await Devotee.findOne({ where: { mobile } });
    if (!devotee) {
      devotee = await Devotee.create({ mobile });
    }

    const otp = generateOtp();
    await devotee.setOtp(otp);
    await devotee.save();

    await sendOtp(mobile, otp);

    return success(
      res,
      { mobile, message: 'OTP sent successfully. Valid for 10 minutes.' },
      'OTP sent.',
      200
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/devotee/verify-otp
 * Verify OTP and login/register. Returns JWT token.
 * Body: { mobile, otp }
 */
async function verifyOtp(req, res, next) {
  try {
    const validation = validateVerifyOtp(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { mobile, otp } = validation.data;

    const devotee = await Devotee.findOne({ where: { mobile } });
    if (!devotee) {
      return error(res, 'Invalid mobile or OTP.', 401);
    }

    const isValid = await devotee.verifyOtp(otp);
    if (!isValid) {
      return error(res, 'Invalid or expired OTP.', 401);
    }

    // Clear OTP after successful verification
    devotee.otpHash = null;
    devotee.otpExpiresAt = null;
    await devotee.save();

    const token = generateDevoteeToken(devotee);
    return success(res, {
      devotee: devotee.toSafeObject(),
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/devotee/details
 * Update devotee details (name, email, city, profileImage). Requires auth.
 * Body: { name?, email?, city? } or multipart with profileImage file.
 */
async function updateDetails(req, res, next) {
  try {
    const validation = validateDevoteeDetails(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { name, email, city } = validation.data;
    const devotee = req.devotee;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (city !== undefined) updates.city = city;

    if (req.file?.location) {
      if (devotee.profileImage) {
        await deleteFileFromS3(devotee.profileImage);
      }
      updates.profileImage = req.file.location;
    }
    console.log("devote",devotee);

    if (Object.keys(updates).length === 0) {
      return error(res, 'No updates provided.', 400);
    }

    await devotee.update(updates);
    return success(res, { devotee: devotee.toSafeObject() }, 'Details updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/me
 * Get current devotee profile.
 */
async function getMe(req, res, next) {
  try {
    return success(res, { devotee: req.devotee.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/organization-types
 * List organization types: temple, church, masjid, gurudwara.
 */
async function getOrganizationTypes(req, res, next) {
  try {
    const types = ORGANIZATION_TYPES_LIST.map((type) => ({ type, label: type.charAt(0).toUpperCase() + type.slice(1) }));
    return success(res, { organizationTypes: types });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/organizations?type=temple
 * Get all organizations of the given type (active admins).
 */
async function getOrganizations(req, res, next) {
  try {
    const validation = validateOrganizationType(req.query.type);
    if (!validation.valid) {
      return error(res, validation.message, 422);
    }
    const { value: organizationType } = validation;

    const organizations = await User.findAll({
      where: {
        role: ROLES.ADMIN,
        organizationType,
        isActive: true,
      },
      attributes: ['id', 'orgId', 'name', 'email', 'phone', 'organizationType', 'profileImage'],
      order: [['name', 'ASC']],
    });

    return success(res, {
      organizations: organizations.map((o) => o.get({ plain: true })),
      total: organizations.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/favorites
 * Get devotee's favorite organizations (up to 5).
 */
async function getFavorites(req, res, next) {
  try {
    const devotee = req.devotee;
    const favorites = await DevoteeFavorite.findAll({
      where: { devoteeId: devotee.id },
      include: [
        {
          model: User,
          as: 'organization',
          attributes: ['id', 'orgId', 'name', 'email', 'phone', 'organizationType', 'profileImage'],
        },
      ],
      order: [['displayOrder', 'ASC']],
    });

    const list = favorites.map((f) => ({
      id: f.id,
      displayOrder: f.displayOrder,
      organization: f.organization ? f.organization.get({ plain: true }) : null,
    }));

    return success(res, { favorites: list, total: list.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/devotee/favorites
 * Set favorite organizations (up to 5). Replaces existing favorites.
 * Body: { adminIds: [1, 2, 3] }
 */
async function setFavorites(req, res, next) {
  try {
    const validation = validateSetFavorites(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { adminIds } = validation.data;
    const devotee = req.devotee;

    // Verify all admins exist and are active
    const admins = await User.findAll({
      where: {
        id: adminIds,
        role: ROLES.ADMIN,
        isActive: true,
      },
      attributes: ['id'],
    });
    if (admins.length !== adminIds.length) {
      return error(res, 'One or more organizations not found or inactive.', 400);
    }

    await DevoteeFavorite.destroy({ where: { devoteeId: devotee.id } });

    const toCreate = adminIds.map((adminId, index) => ({
      devoteeId: devotee.id,
      adminId,
      displayOrder: index + 1,
    }));
    await DevoteeFavorite.bulkCreate(toCreate);

    const favorites = await DevoteeFavorite.findAll({
      where: { devoteeId: devotee.id },
      include: [
        {
          model: User,
          as: 'organization',
          attributes: ['id', 'orgId', 'name', 'email', 'phone', 'organizationType', 'profileImage'],
        },
      ],
      order: [['displayOrder', 'ASC']],
    });

    const list = favorites.map((f) => ({
      id: f.id,
      displayOrder: f.displayOrder,
      organization: f.organization ? f.organization.get({ plain: true }) : null,
    }));

    return success(res, { favorites: list }, 'Favorites updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/devotee/favorites
 * Update favorite organizations (same as set, replaces existing).
 * Body: { adminIds: [1, 2, 3, 4, 5] }
 */
async function updateFavorites(req, res, next) {
  return setFavorites(req, res, next);
}

/**
 * POST /api/devotee/support
 * Raise a support ticket for a specific organization (admin). Admin must be one of devotee's favorites.
 * Body: { adminId, reason }
 */
async function raiseSupport(req, res, next) {
  try {
    const validation = validateDevoteeRaiseSupport(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { adminId, reason } = validation.data;
    const devotee = req.devotee;

    const favorite = await DevoteeFavorite.findOne({
      where: { devoteeId: devotee.id, adminId },
    });
    if (!favorite) {
      return error(res, 'You can raise support only for an organization in your favorites.', 400);
    }

    const admin = await User.findByPk(adminId);
    if (!admin || !admin.isActive) {
      return error(res, 'Organization not found or inactive.', 400);
    }

    const ticket = await Support.create({
      reason,
      adminId,
      devoteeId: devotee.id,
      adminName: devotee.name || 'Devotee',
      adminEmail: devotee.mobile || devotee.email || 'N/A',
      status: 'pending',
    });

    return success(
      res,
      { ticket: ticket.get({ plain: true }) },
      'Support ticket raised successfully. The organization will respond to your request.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/support
 * List support tickets raised by the current devotee (without messages).
 */
async function getMySupportTickets(req, res, next) {
  try {
    const tickets = await Support.findAll({
      where: { devoteeId: req.devotee.id },
      order: [['created_at', 'DESC']],
    });
    return success(res, { tickets, total: tickets.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/support/:id
 * Get a single support ticket with its messages (ownership enforced).
 */
async function getSupportTicketWithMessages(req, res, next) {
  try {
    const { id } = req.params;
    const ticket = await Support.findOne({
      where: { id, devoteeId: req.devotee.id },
      include: [
        {
          model: SupportMessage,
          as: 'messages',
          order: [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    if (!ticket) {
      return error(res, 'Support ticket not found.', 404);
    }

    // Mark all messages from the other side as read when devotee views the conversation.
    await SupportMessage.update(
      { isRead: true },
      {
        where: {
          supportId: ticket.id,
          isRead: false,
          senderRole: { [Op.ne]: 'DEVOTEE' },
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
 * POST /api/devotee/support/:id/message
 * Add a reply message on a devotee-owned ticket and optionally reopen it.
 */
async function addSupportMessageAsDevotee(req, res, next) {
  try {
    const { id } = req.params;
    const validation = validateSupportMessage(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { message } = validation.data;

    const ticket = await Support.findOne({
      where: { id, devoteeId: req.devotee.id },
    });

    if (!ticket) {
      return error(res, 'Support ticket not found.', 404);
    }

    const createdMessage = await SupportMessage.create({
      supportId: ticket.id,
      senderRole: 'DEVOTEE',
      senderId: req.devotee.id,
      message,
    });

    // When replying, mark existing messages from the other side as read as they have been seen.
    await SupportMessage.update(
      { isRead: true },
      {
        where: {
          supportId: ticket.id,
          isRead: false,
          senderRole: { [Op.ne]: 'DEVOTEE' },
        },
      }
    );

    // If ticket was resolved, move to in_progress on new devotee reply.
    if (ticket.status === 'resolved') {
      await ticket.update({ status: 'in_progress' });
    }

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

module.exports = {
  sendOtpHandler,
  verifyOtp,
  updateDetails,
  getMe,
  getOrganizationTypes,
  getOrganizations,
  getFavorites,
  setFavorites,
  updateFavorites,
  raiseSupport,
  getMySupportTickets,
  getSupportTicketWithMessages,
  addSupportMessageAsDevotee,
};
