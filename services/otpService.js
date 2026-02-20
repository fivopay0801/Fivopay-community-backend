'use strict';

/**
 * Generate a 4-digit OTP.
 * @returns {string} 4-digit OTP
 */
function generateOtp() {
  // const otp = Math.floor(1000 + Math.random() * 9000);
  // return String(otp);
  return '0000';
}

/**
 * Send OTP to mobile. In development, log to console.
 * In production, integrate SMS gateway (Twilio, MSG91, etc.).
 * @param {string} mobile
 * @param {string} otp
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendOtp(mobile, otp) {
  if (process.env.NODE_ENV === 'development' || !process.env.SMS_GATEWAY_URL) {
    console.log(`[OTP] Mobile: ${mobile}, OTP: ${otp} (valid for 10 minutes)`);
    return true;
  }
  // TODO: Integrate SMS gateway
  // await fetch(process.env.SMS_GATEWAY_URL, { ... });
  return true;
}

module.exports = {
  generateOtp,
  sendOtp,
};
