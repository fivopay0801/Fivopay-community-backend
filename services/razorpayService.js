'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment.');
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay order.
 * @param {number} amountPaise - Amount in paise (INR)
 * @param {string} receipt - Optional receipt id
 * @returns {Promise<{orderId: string, amount: number, currency: string}>}
 */
async function createOrder(amountPaise, receipt = null) {
  const rzp = getRazorpay();
  const options = {
    amount: amountPaise,
    currency: 'INR',
    receipt: receipt || `rcpt_${Date.now()}`,
  };
  const order = await rzp.orders.create(options);
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayKeyId,
  };
}

/**
 * Verify Razorpay payment signature.
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean}
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!razorpayKeySecret) {
    throw new Error('RAZORPAY_KEY_SECRET must be set to verify payments.');
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(body)
    .digest('hex');
  return expected === signature;
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  getRazorpayKeyId: () => razorpayKeyId,
};
