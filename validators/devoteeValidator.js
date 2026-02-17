'use strict';

const { ORGANIZATION_TYPES_LIST } = require('../constants/roles');

const MAX_FAVORITES = 5;

const MOBILE_REGEX = /^[+]?[\d\s()-]{10,20}$/;
const OTP_REGEX = /^\d{4}$/;
const NAME_MAX_LENGTH = 255;
const EMAIL_MAX_LENGTH = 255;
const CITY_MAX_LENGTH = 100;

function validateMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') {
    return { valid: false, message: 'Mobile is required.' };
  }
  const trimmed = mobile.trim().replace(/\s/g, '');
  if (trimmed.length < 10) {
    return { valid: false, message: 'Please provide a valid mobile number.' };
  }
  if (!MOBILE_REGEX.test(trimmed)) {
    return { valid: false, message: 'Invalid mobile format.' };
  }
  return { valid: true, value: trimmed };
}

function validateOtp(otp) {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, message: 'OTP is required.' };
  }
  const trimmed = String(otp).trim();
  if (!OTP_REGEX.test(trimmed)) {
    return { valid: false, message: 'OTP must be 4 digits.' };
  }
  return { valid: true, value: trimmed };
}

function validateName(name, required = false) {
  if (!name || typeof name !== 'string') {
    if (required) return { valid: false, message: 'Name is required.' };
    return { valid: true, value: null };
  }
  const trimmed = name.trim();
  if (required && trimmed.length === 0) {
    return { valid: false, message: 'Name cannot be empty.' };
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return { valid: false, message: `Name must be at most ${NAME_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed || null };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: true, value: null };
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) return { valid: true, value: null };
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return { valid: false, message: `Email must be at most ${EMAIL_MAX_LENGTH} characters.` };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Invalid email format.' };
  }
  return { valid: true, value: trimmed };
}

function validateCity(city) {
  if (!city || typeof city !== 'string') {
    return { valid: true, value: null };
  }
  const trimmed = city.trim();
  if (trimmed.length > CITY_MAX_LENGTH) {
    return { valid: false, message: `City must be at most ${CITY_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed || null };
}

function validateOrganizationType(type) {
  if (!type || typeof type !== 'string') {
    return { valid: false, message: 'Organization type is required.' };
  }
  const normalized = type.toLowerCase().trim();
  if (!ORGANIZATION_TYPES_LIST.includes(normalized)) {
    return {
      valid: false,
      message: `Organization type must be one of: ${ORGANIZATION_TYPES_LIST.join(', ')}.`,
    };
  }
  return { valid: true, value: normalized };
}

function validateAdminIds(adminIds) {
  if (!Array.isArray(adminIds)) {
    return { valid: false, message: 'adminIds must be an array.' };
  }
  if (adminIds.length > MAX_FAVORITES) {
    return { valid: false, message: `Maximum ${MAX_FAVORITES} favorites allowed.` };
  }
  const ids = adminIds.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0);
  if (ids.length !== adminIds.length) {
    return { valid: false, message: 'Each adminId must be a positive integer.' };
  }
  const unique = [...new Set(ids)];
  if (unique.length > MAX_FAVORITES) {
    return { valid: false, message: `Maximum ${MAX_FAVORITES} unique favorites allowed.` };
  }
  return { valid: true, value: unique };
}

function validateSendOtp(body) {
  const mobileResult = validateMobile(body.mobile);
  if (!mobileResult.valid) {
    return { valid: false, errors: [mobileResult.message] };
  }
  return { valid: true, data: { mobile: mobileResult.value } };
}

function validateVerifyOtp(body) {
  const mobileResult = validateMobile(body.mobile);
  const otpResult = validateOtp(body.otp);
  const errors = [];
  if (!mobileResult.valid) errors.push(mobileResult.message);
  if (!otpResult.valid) errors.push(otpResult.message);
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: {
      mobile: mobileResult.value,
      otp: otpResult.value,
    },
  };
}

function validateDevoteeDetails(body) {
  const errors = [];
  const nameResult = validateName(body?.name, false);
  const emailResult = validateEmail(body?.email);
  const cityResult = validateCity(body?.city);

  if (!nameResult.valid) errors.push(nameResult.message);
  if (!emailResult.valid) errors.push(emailResult.message);
  if (!cityResult.valid) errors.push(cityResult.message);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const data = {};
  if (nameResult.value != null) data.name = nameResult.value;
  if (emailResult.value != null) data.email = emailResult.value;
  if (cityResult.value != null) data.city = cityResult.value;

  return { valid: true, data };
}

function validateSetFavorites(body) {
  const adminResult = validateAdminIds(body.adminIds);
  if (!adminResult.valid) {
    return { valid: false, errors: [adminResult.message] };
  }
  return { valid: true, data: { adminIds: adminResult.value } };
}

function validateCreateDonation(body) {
  const errors = [];
  const adminId = body.adminId;
  const amount = body.amount;

  if (!adminId || !Number.isInteger(Number(adminId)) || Number(adminId) <= 0) {
    errors.push('Valid adminId (organization) is required.');
  }
  const amountNum = Number(amount);
  if ((typeof amount !== 'number' && typeof amount !== 'string') || isNaN(amountNum)) {
    errors.push('Amount is required.');
  } else if (amountNum < 1) {
    errors.push('Minimum donation amount is ₹1.');
  } else if (amountNum > 1000000) {
    errors.push('Amount exceeds maximum allowed.');
  }

  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      adminId: Number(adminId),
      amountRupees: Math.floor(amountNum * 100) / 100,
    },
  };
}

function validateVerifyDonation(body) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  const errors = [];
  if (!razorpay_order_id || typeof razorpay_order_id !== 'string') {
    errors.push('razorpay_order_id is required.');
  }
  if (!razorpay_payment_id || typeof razorpay_payment_id !== 'string') {
    errors.push('razorpay_payment_id is required.');
  }
  if (!razorpay_signature || typeof razorpay_signature !== 'string') {
    errors.push('razorpay_signature is required.');
  }
  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    data: {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
  };
}

module.exports = {
  validateMobile,
  validateOtp,
  validateName,
  validateOrganizationType,
  validateAdminIds,
  validateSendOtp,
  validateVerifyOtp,
  validateDevoteeDetails,
  validateSetFavorites,
  validateCreateDonation,
  validateVerifyDonation,
};
