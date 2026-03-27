'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment.');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
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
    keyId: process.env.RAZORPAY_KEY_ID,
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
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_SECRET must be set to verify payments.');
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}

/**
 * Fetch payment details from Razorpay to get method, UTR, etc.
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
async function fetchPayment(paymentId) {
  const rzp = getRazorpay();
  return rzp.payments.fetch(paymentId);
}

/**
 * Fetch payments for a Razorpay order.
 * @param {string} orderId 
 * @returns {Promise<Object>}
 */
async function fetchOrderPayments(orderId) {
  const rzp = getRazorpay();
  return rzp.orders.fetchPayments(orderId);
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  fetchOrderPayments,
  getRazorpayKeyId: () => process.env.RAZORPAY_KEY_ID,
};
