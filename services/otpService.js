const { sendOtpSms } = require('./fast2sms');
const { sendMail } = require('./emailService');

/**
 * Generate a 4-digit OTP. 
 * Currently returns '0000' for testing to avoid SMS charges.
 * @returns {string} 4-digit OTP
 */
function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Generate a random 4-digit OTP.
 * @returns {string} 4-digit OTP
 */
function generateRandomOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Send OTP to mobile using Fast2SMS DLT route.
 * @param {string} mobile
 * @param {string} otp
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendOtp(mobile, otp) {
  // If we are using static OTP (0000), we skip real SMS sending to avoid charges.
  const useStaticOtp = process.env.USE_STATIC_OTP === 'true'; // Default to false for dynamic OTPs

  if (useStaticOtp || otp === '0000') {
    console.log(`[OTP DEBUG] Static OTP enabled. Skipping real SMS for ${mobile}. OTP: ${otp}`);
    return true;
  }

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
  const templateId = process.env.FAST2SMS_TEMPLATE_ID || '210471';
  const variablesValues = `${otp}|`;

  const result = await sendOtpSms(mobile, templateId, variablesValues);

  if (!result.ok) {
    console.error(`[OTP ERROR] Failed to send SMS to ${mobile}:`, result.body);
  }

  return result.ok;
}

/**
 * Send OTP to email.
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendEmailOtp(email, otp) {
  const useStaticOtp = process.env.USE_STATIC_OTP === 'true';

  if (useStaticOtp || otp === '0000') {
    console.log(`[OTP DEBUG] Static OTP enabled. Skipping real email for ${email}. OTP: ${otp}`);
    return true;
  }

  const subject = 'Your Password Reset OTP';
  const text = `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`;
  const html = `<p>Your OTP for password reset is: <strong>${otp}</strong>.</p><p>It is valid for 10 minutes.</p>`;

  return await sendMail({ to: email, subject, text, html });
}

module.exports = {
  generateOtp,
  generateRandomOtp,
  sendOtp,
  sendEmailOtp,
};
