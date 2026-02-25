'use strict';

const { User, Devotee, DevoteeFavorite, Donation, Event, sequelize } = require('../models');
const { DONATION_STATUS } = require('../constants/donation');
const { success, error } = require('../utils/response');
const { createOrder, verifyPaymentSignature, fetchPayment } = require('../services/razorpayService');
const { validateCreateDonation, validateVerifyDonation } = require('../validators/devoteeValidator');

/**
 * POST /api/devotee/donation/create-order
 * Create Razorpay order for donation. Devotee selects org and optionally an event.
 * Body: { adminId, amount, eventId? } - amount in rupees
 */
async function createDonationOrder(req, res, next) {
  try {
    const validation = validateCreateDonation(req.body);
    if (!validation.valid) {
      return error(res, 'Validation failed', 422, validation.errors);
    }
    const { adminId, amountRupees, eventId } = validation.data;
    const devotee = req.devotee;

    const amountPaise = Math.round(amountRupees * 100);
    if (amountPaise < 100) {
      return error(res, 'Minimum donation is ₹1.', 422);
    }

    const favorite = await DevoteeFavorite.findOne({
      where: { devoteeId: devotee.id, adminId },
    });
    if (!favorite) {
      return error(res, 'Organization must be one of your 5 favorites. Add it first.', 400);
    }

    const admin = await User.findByPk(adminId);
    if (!admin || !admin.isActive) {
      return error(res, 'Organization not found or inactive.', 400);
    }

    let event = null;
    if (eventId) {
      event = await Event.findOne({
        where: { id: eventId, adminId, isActive: true },
      });
      if (!event) {
        return error(res, 'Event not found or does not belong to this organization.', 400);
      }
    }

    const razorpayOrder = await createOrder(amountPaise, `don_${devotee.id}_${adminId}_${eventId || 'org'}_${Date.now()}`);

    const donation = await Donation.create({
      devoteeId: devotee.id,
      adminId,
      eventId: eventId || null,
      amount: amountRupees,
      razorpayOrderId: razorpayOrder.orderId,
      status: DONATION_STATUS.PENDING,
    });

    const payload = {
      donationId: donation.id,
      razorpayOrderId: razorpayOrder.orderId,
      amount: razorpayOrder.amount,
      amountRupees: razorpayOrder.amount / 100,
      currency: razorpayOrder.currency,
      keyId: razorpayOrder.keyId,
      organizationId: adminId,
      organizationName: admin.name,
    };
    if (event) {
      payload.eventId = event.id;
      payload.eventTitle = event.title;
      payload.eventRaisedAmountPaise = event.raisedAmountPaise;
      payload.eventTargetAmountPaise = event.targetAmountPaise;
    }

    return success(res, payload, 'Order created. Complete payment on client.', 201);
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

    // Fetch full payment details to get UTR / Bank Transaction ID / Method
    let utr = null;
    let transactionId = null;
    let paymentMethod = null;
    try {
      const paymentDetails = await fetchPayment(razorpayPaymentId);
      console.log('Razorpay Payment Details:', JSON.stringify(paymentDetails, null, 2));
      if (paymentDetails) {
        paymentMethod = paymentDetails.method;
        console.log('Extracted Payment Method:', paymentMethod);
        if (paymentDetails.acquirer_data) {
          utr = paymentDetails.acquirer_data.rrn || paymentDetails.acquirer_data.upi_transaction_id;
          transactionId = paymentDetails.acquirer_data.bank_transaction_id;
        }
      }
      // Fallback: if bank_transaction_id is missing, use razorpayPaymentId as transactionId
      if (!transactionId) {
        transactionId = razorpayPaymentId;
      }
    } catch (fetchErr) {
      console.error('Error fetching payment details from Razorpay:', fetchErr);
      // Proceed without UTR/BankTxnId if fetch fails, but log it.
    }

    await donation.update({
      razorpayPaymentId,
      razorpaySignature,
      utr,
      transactionId,
      paymentMethod,
      status: DONATION_STATUS.CAPTURED,
    });

    if (donation.eventId) {
      const ev = await Event.findByPk(donation.eventId);
      if (ev) {
        const currentRaised = Number(ev.raisedAmountPaise || 0);
        // donation.amount is in Rupees, convert to Paise for Event
        const donationAmountPaise = Math.round(Number(donation.amount) * 100);
        await ev.update({ raisedAmountPaise: currentRaised + donationAmountPaise });
      }
    }

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
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'eventType', 'raisedAmountPaise', 'targetAmountPaise'],
        },
      ],
      order: sequelize.literal('"Donation"."created_at" DESC'),
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
        [Donation.sequelize.fn('SUM', Donation.sequelize.col('amount')), 'totalAmountRupees'],
      ],
      raw: true,
    });

    const totalCount = parseInt(stats[0]?.totalCount || 0, 10);
    const totalAmountRupees = parseFloat(stats[0]?.totalAmountRupees || 0);
    const totalAmountPaise = Math.round(totalAmountRupees * 100);

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
  const ev = plain.event || plain.Event;
  return {
    id: plain.id,
    devoteeId: plain.devoteeId,
    organizationId: plain.adminId,
    amount: (plain.amount * 100).toFixed(0), // return in paise for consistency if needed, or just remove if API consumer expects rupees
    amountRupees: parseFloat(plain.amount).toFixed(2),
    status: plain.status,
    organization: plain.organization,
    eventId: plain.eventId,
    event: ev ? { id: ev.id, title: ev.title, eventType: ev.eventType, raisedAmountPaise: ev.raisedAmountPaise, targetAmountPaise: ev.targetAmountPaise } : null,
    razorpayOrderId: plain.razorpayOrderId,
    razorpayPaymentId: plain.razorpayPaymentId,
    razorpaySignature: plain.razorpaySignature,
    paymentMethod: plain.paymentMethod,
    utr: plain.utr,
    transactionId: plain.transactionId,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  };
}

module.exports = {
  createDonationOrder,
  verifyDonation,
  getMyDonations,
  getStats,
};
