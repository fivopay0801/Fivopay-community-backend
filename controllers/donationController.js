'use strict';

const { User, Devotee, DevoteeFavorite, Donation } = require('../models');
const { DONATION_STATUS } = require('../constants/donation');
const { success, error } = require('../utils/response');
const { createOrder, verifyPaymentSignature } = require('../services/razorpayService');
const { validateCreateDonation, validateVerifyDonation } = require('../validators/devoteeValidator');

/**
 * POST /api/devotee/donation/create-order
 * Create Razorpay order for donation. Devotee selects one of their 5 favorite orgs.
 * Body: { adminId, amount } - amount in paise or rupees (we use paise for Razorpay)
 */
async function createDonationOrder(req, res, next) {
  try {
    const validation = validateCreateDonation(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { adminId, amountRupees } = validation.data;
    const devotee = req.devotee;

    const amountPaise = Math.round(amountRupees * 100);
    if (amountPaise < 100) {
      return error(res, 'Minimum donation is ₹1.', 422);
    }

    const favorite = await DevoteeFavorite.findOne({
      where: { devoteeId: devotee.id, adminId },
      include: [{ model: User, as: 'organization', attributes: ['id', 'name'] }],
    });
    if (!favorite) {
      return error(res, 'Organization must be one of your 5 favorites. Add it first.', 400);
    }

    const admin = await User.findByPk(adminId);
    if (!admin || !admin.isActive) {
      return error(res, 'Organization not found or inactive.', 400);
    }

    const razorpayOrder = await createOrder(amountPaise, `don_${devotee.id}_${adminId}_${Date.now()}`);

    const donation = await Donation.create({
      devoteeId: devotee.id,
      adminId,
      amount: amountPaise,
      razorpayOrderId: razorpayOrder.orderId,
      status: DONATION_STATUS.PENDING,
    });

    return success(
      res,
      {
        donationId: donation.id,
        razorpayOrderId: razorpayOrder.orderId,
        amount: razorpayOrder.amount,
        amountRupees: razorpayOrder.amount / 100,
        currency: razorpayOrder.currency,
        keyId: razorpayOrder.keyId,
        organizationId: adminId,
        organizationName: admin.name,
      },
      'Order created. Complete payment on client.',
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/devotee/donation/verify
 * Verify Razorpay payment and capture donation.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
async function verifyDonation(req, res, next) {
  try {
    const validation = validateVerifyDonation(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = validation.data;
    const devotee = req.devotee;

    const donation = await Donation.findOne({
      where: {
        razorpayOrderId,
        devoteeId: devotee.id,
      },
      include: [{ model: User, as: 'organization', attributes: ['id', 'name'] }],
    });
    if (!donation) {
      return error(res, 'Donation not found.', 404);
    }
    if (donation.status === DONATION_STATUS.CAPTURED) {
      return success(res, { donation: donationToResponse(donation) }, 'Payment already verified.');
    }
    if (donation.status === DONATION_STATUS.FAILED) {
      return error(res, 'Payment failed. Please try again.', 400);
    }

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      await donation.update({ status: DONATION_STATUS.FAILED });
      return error(res, 'Payment verification failed. Invalid signature.', 400);
    }

    await donation.update({
      razorpayPaymentId,
      razorpaySignature,
      status: DONATION_STATUS.CAPTURED,
    });

    return success(
      res,
      { donation: donationToResponse(donation) },
      'Payment verified. Thank you for your donation!',
      200
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/donations
 * List devotee's donation history with pagination.
 */
async function getMyDonations(req, res, next) {
  try {
    const devotee = req.devotee;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await Donation.findAndCountAll({
      where: { devoteeId: devotee.id },
      include: [
        {
          model: User,
          as: 'organization',
          attributes: ['id', 'name', 'organizationType', 'profileImage'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    const donations = rows.map((d) => donationToResponse(d));

    return success(res, {
      donations,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/devotee/stats
 * Devotee donation stats: total count, total amount.
 */
async function getStats(req, res, next) {
  try {
    const devotee = req.devotee;

    const stats = await Donation.findAll({
      where: {
        devoteeId: devotee.id,
        status: DONATION_STATUS.CAPTURED,
      },
      attributes: [
        [Donation.sequelize.fn('COUNT', Donation.sequelize.col('id')), 'totalCount'],
        [Donation.sequelize.fn('SUM', Donation.sequelize.col('amount')), 'totalAmountPaise'],
      ],
      raw: true,
    });

    const totalCount = parseInt(stats[0]?.totalCount || 0, 10);
    const totalAmountPaise = parseInt(stats[0]?.totalAmountPaise || 0, 10);
    const totalAmountRupees = totalAmountPaise / 100;

    return success(res, {
      totalDonations: totalCount,
      totalAmountPaise,
      totalAmountRupees: totalAmountRupees.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
}

function donationToResponse(donation) {
  const plain = donation.get ? donation.get({ plain: true }) : donation;
  return {
    id: plain.id,
    amount: plain.amount,
    amountRupees: (plain.amount / 100).toFixed(2),
    status: plain.status,
    organizationId: plain.adminId,
    organization: plain.organization,
    razorpayOrderId: plain.razorpayOrderId,
    razorpayPaymentId: plain.razorpayPaymentId,
    createdAt: plain.createdAt,
  };
}

module.exports = {
  createDonationOrder,
  verifyDonation,
  getMyDonations,
  getStats,
};
