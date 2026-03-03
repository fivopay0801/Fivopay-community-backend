const { sendOtpSms } = require('./fast2sms');

/**
 * Generate a 4-digit OTP.
 * @returns {string} 4-digit OTP
 */
function generateOtp() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return String(otp);
}

/**
 * Send OTP to mobile using Fast2SMS DLT route.
 * @param {string} mobile
 * @param {string} otp
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendOtp(mobile, otp) {
  // If FAST2SMS_API_KEY is not set, we cannot send the SMS.
  if (!process.env.FAST2SMS_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[OTP DEBUG] FAST2SMS_API_KEY missing. Mobile:', mobile, 'OTP:', otp);
      return true;
    }
    console.error('[OTP ERROR] FAST2SMS_API_KEY missing. SMS delivery failed.');
    return false;
  }

  // For DLT route, Template ID is passed in the "message" field, 
  // and the variable values are passed in "variables_values" (e.g. "1234|").
  // If FAST2SMS_TEMPLATE_ID is not set, we use a fallback (might fail if DLT is strict).
  const templateId = process.env.FAST2SMS_TEMPLATE_ID || '210471'; // Fallback to a known ID or placeholder
  const variablesValues = `${otp}|`;

  const result = await sendOtpSms(mobile, templateId, variablesValues);

  if (!result.ok) {
    console.error(`[OTP ERROR] Failed to send SMS to ${mobile}:`, result.body);
  }

  return result.ok;
}

module.exports = {
  generateOtp,
  sendOtp,
};
