'use strict';

const { User, Devotee, DevoteeFavorite } = require('../models');
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
      attributes: ['id', 'name', 'email', 'phone', 'organizationType', 'profileImage'],
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
          attributes: ['id', 'name', 'email', 'phone', 'organizationType', 'profileImage'],
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
          attributes: ['id', 'name', 'email', 'phone', 'organizationType', 'profileImage'],
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
};
