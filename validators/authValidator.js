'use strict';

const validator = require('validator');
const { ORGANIZATION_TYPES_LIST } = require('../constants/roles');
const {
  ORGANIZATION_CATEGORIES_LIST,
  FAITHS_LIST,
  ORGANIZATION_SUBTYPES,
  ALL_SUBTYPES_LIST,
  ORGANIZATION_CATEGORIES,
} = require('../constants/organization');

const ORGANIZATION_SUBTYPES_LIST = Array.isArray(ALL_SUBTYPES_LIST)
  ? ALL_SUBTYPES_LIST
  : Object.values(ORGANIZATION_SUBTYPES || {}).flat();

const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 255;
const ADDRESS_MAX_LENGTH = 500;
const PHONE_MAX_LENGTH = 20;
const PAN_MAX_LENGTH = 20;
const REG_80G_MAX_LENGTH = 100;

function validatePanNumber(pan, required = true) {
  if (!pan || typeof pan !== 'string') {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: 'PAN number is required.' };
  }
  const trimmed = pan.trim().toUpperCase();
  if (!trimmed) {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: 'PAN number is required.' };
  }
  if (trimmed.length > PAN_MAX_LENGTH) {
    return { valid: false, message: `PAN number must be at most ${PAN_MAX_LENGTH} characters.` };
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trimmed)) {
    return { valid: false, message: 'Invalid PAN format. Example: ABCDE1234F.' };
  }
  return { valid: true, value: trimmed };
}

function validate80GRegistrationNumber(reg, required = true) {
  if (!reg || typeof reg !== 'string') {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: '80G registration number is required.' };
  }
  const trimmed = reg.trim();
  if (!trimmed) {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: '80G registration number is required.' };
  }
  if (trimmed.length > REG_80G_MAX_LENGTH) {
    return { valid: false, message: `80G registration number must be at most ${REG_80G_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validate email format.
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required.' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!validator.isEmail(trimmed)) {
    return { valid: false, message: 'Invalid email format.' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validate password (length and basic strength).
 */
function validatePassword(password, fieldName = 'Password') {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: `${fieldName} is required.` };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `${fieldName} must be at least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  return { valid: true };
}

/**
 * Validate name.
 */
function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: `${fieldName} is required.` };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: `${fieldName} cannot be empty.` };
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return { valid: false, message: `${fieldName} must be at most ${NAME_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validate address (optional for some flows; required for super admin register).
 */
function validateAddress(address, required = true) {
  if (!address || typeof address !== 'string') {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: 'Address is required.' };
  }
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: 'Address cannot be empty.' };
  }
  if (trimmed.length > ADDRESS_MAX_LENGTH) {
    return { valid: false, message: `Address must be at most ${ADDRESS_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validate phone number.
 */
function validatePhone(phone, required = true) {
  if (!phone || typeof phone !== 'string') {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: 'Phone is required.' };
  }
  const trimmed = phone.trim().replace(/\s/g, '');
  if (trimmed.length === 0) {
    if (!required) return { valid: true, value: null };
    return { valid: false, message: 'Phone cannot be empty.' };
  }
  if (trimmed.length > PHONE_MAX_LENGTH) {
    return { valid: false, message: `Phone must be at most ${PHONE_MAX_LENGTH} characters.` };
  }
  if (!/^[+]?[\d\s()-]+$/.test(trimmed) || trimmed.length < 10) {
    return { valid: false, message: 'Please provide a valid phone number.' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validate organization type for admin.
 */
function validateOrganizationType(organizationType) {
  if (!organizationType || typeof organizationType !== 'string') {
    return { valid: false, message: 'Organization type is required for admin.' };
  }
  const normalized = organizationType.toLowerCase().trim();
  if (!ORGANIZATION_TYPES_LIST.includes(normalized)) {
    return {
      valid: false,
      message: `Organization type must be one of: ${ORGANIZATION_TYPES_LIST.join(', ')}.`,
    };
  }
  return { valid: true, value: normalized };
}

/**
 * Validate organization hierarchy.
 */
function validateOrganizationHierarchy(category, faith, subtype) {
  if (!category || !ORGANIZATION_CATEGORIES_LIST.includes(category.toLowerCase())) {
    return { valid: false, message: `Invalid organization category. Must be one of: ${ORGANIZATION_CATEGORIES_LIST.join(', ')}.` };
  }

  const cat = category.toLowerCase();

  if (cat === ORGANIZATION_CATEGORIES.FAITH) {
    if (!faith || !FAITHS_LIST.includes(faith.toLowerCase())) {
      return { valid: false, message: `For faith category, a valid faith is required: ${FAITHS_LIST.join(', ')}.` };
    }
    const f = faith.toLowerCase();
    const allowedSubtypes = ORGANIZATION_SUBTYPES[f] || [];
    if (!subtype || !allowedSubtypes.includes(subtype.toLowerCase())) {
      return { valid: false, message: `Invalid subtype for ${f}. Allowed: ${allowedSubtypes.join(', ')}.` };
    }
    return {
      valid: true,
      data: {
        organizationCategory: cat,
        faith: f,
        organizationSubtype: subtype.toLowerCase()
      }
    };
  } else if (cat === ORGANIZATION_CATEGORIES.NGO) {
    // For NGO, subtype is required (trust/society/company/foundation/other).
    const allowedNgo = Array.isArray(ALL_SUBTYPES_LIST) ? ALL_SUBTYPES_LIST : [];
    const ngoAllowed = allowedNgo.filter((s) => typeof s === 'string' && ['trust', 'society', 'company', 'foundation', 'other'].includes(s.toLowerCase()));
    const normalizedSubtype = subtype ? String(subtype).toLowerCase().trim() : '';
    if (!normalizedSubtype || !ngoAllowed.map(s => s.toLowerCase()).includes(normalizedSubtype)) {
      return { valid: false, message: `For NGO category, a valid subtype is required: trust, society, company, foundation, other.` };
    }
    return {
      valid: true,
      data: {
        organizationCategory: cat,
        faith: null,
        organizationSubtype: normalizedSubtype
      }
    };
  }

  return { valid: false, message: 'Invalid organization hierarchy.' };
}

/**
 * Validate super admin registration body: { email, password, name, address, phone }.
 */
function validateSuperAdminRegister(body) {
  const errors = [];
  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) errors.push(emailResult.message);
  const passwordResult = validatePassword(body.password);
  if (!passwordResult.valid) errors.push(passwordResult.message);
  const nameResult = validateName(body.name);
  if (!nameResult.valid) errors.push(nameResult.message);
  const addressResult = validateAddress(body.address, true);
  if (!addressResult.valid) errors.push(addressResult.message);
  const phoneResult = validatePhone(body.phone, true);
  if (!phoneResult.valid) errors.push(phoneResult.message);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: {
      email: emailResult.value,
      password: body.password,
      name: nameResult.value,
      address: addressResult.value,
      phone: phoneResult.value,
    },
  };
}

/**
 * Validate login body: { email, password }.
 */
function validateLogin(body) {
  const errors = [];
  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) errors.push(emailResult.message);
  const passwordResult = validatePassword(body.password);
  if (!passwordResult.valid) errors.push(passwordResult.message);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: {
      email: emailResult.value,
      password: body.password,
    },
  };
}

/**
 * Validate create admin body: { email, password, name, organizationType, phone }.
 * phone = head of organization phone (required).
 */
function validateCreateAdmin(body) {
  const errors = [];
  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) errors.push(emailResult.message);
  const passwordResult = validatePassword(body.password);
  if (!passwordResult.valid) errors.push(passwordResult.message);
  const nameResult = validateName(body.name);
  if (!nameResult.valid) errors.push(nameResult.message);
  const orgResult = validateOrganizationType(body.organizationType);
  if (!orgResult.valid) errors.push(orgResult.message);
  const phoneResult = validatePhone(body.phone, true);
  if (!phoneResult.valid) errors.push(phoneResult.message);
  const addressResult = validateAddress(body.address, true);
  if (!addressResult.valid) errors.push(addressResult.message);

  const panResult = validatePanNumber(body.panNumber, true);
  if (!panResult.valid) errors.push(panResult.message);
  const reg80gResult = validate80GRegistrationNumber(body.registration80GNumber, true);
  if (!reg80gResult.valid) errors.push(reg80gResult.message);

  let lat = null;
  let long = null;
  if (body.latitude !== undefined && body.latitude !== '') {
    lat = parseFloat(body.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Invalid latitude.');
  }
  if (body.longitude !== undefined && body.longitude !== '') {
    long = parseFloat(body.longitude);
    if (isNaN(long) || long < -180 || long > 180) errors.push('Invalid longitude.');
  }

  const hierarchyResult = validateOrganizationHierarchy(body.organizationCategory, body.faith, body.organizationSubtype);
  if (!hierarchyResult.valid) errors.push(hierarchyResult.message);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return {
    valid: true,
    data: {
      email: emailResult.value,
      password: body.password,
      name: nameResult.value,
      organizationType: orgResult.value,
      organizationCategory: hierarchyResult.data.organizationCategory,
      faith: hierarchyResult.data.faith,
      organizationSubtype: hierarchyResult.data.organizationSubtype,
      phone: phoneResult.value,
      address: addressResult.value,
      latitude: lat,
      longitude: long,
      panNumber: panResult.value,
      registration80GNumber: reg80gResult.value,
    },
  };
}

/**
 * Validate profile update body (all optional): { name?, email?, address?, phone? }.
 */
function validateProfileUpdate(body) {
  const errors = [];
  const data = {};

  if (body.name !== undefined && body.name !== null && body.name !== '') {
    const r = validateName(body.name);
    if (!r.valid) errors.push(r.message);
    else data.name = r.value;
  }
  if (body.email !== undefined && body.email !== null && body.email !== '') {
    const r = validateEmail(body.email);
    if (!r.valid) errors.push(r.message);
    else data.email = r.value;
  }
  if (body.address !== undefined && body.address !== null) {
    const r = validateAddress(body.address, false);
    if (!r.valid && r.message) errors.push(r.message);
    else data.address = r.value;
  }
  if (body.phone !== undefined && body.phone !== null) {
    const r = validatePhone(body.phone, false);
    if (!r.valid && r.message) errors.push(r.message);
    else data.phone = r.value;
  }

  if (body.organizationCategory !== undefined) {
    if (body.organizationCategory && !ORGANIZATION_CATEGORIES_LIST.includes(body.organizationCategory.toLowerCase())) {
      errors.push(`Invalid organization category. Must be one of: ${ORGANIZATION_CATEGORIES_LIST.join(', ')}.`);
    } else {
      data.organizationCategory = body.organizationCategory ? body.organizationCategory.toLowerCase() : null;
    }
  }
  if (body.faith !== undefined) {
    if (body.faith && !FAITHS_LIST.includes(body.faith.toLowerCase())) {
      errors.push(`Invalid faith. Must be one of: ${FAITHS_LIST.join(', ')}.`);
    } else {
      data.faith = body.faith ? body.faith.toLowerCase() : null;
    }
  }
  if (body.organizationSubtype !== undefined) {
    if (body.organizationSubtype && !ORGANIZATION_SUBTYPES_LIST.includes(body.organizationSubtype.toLowerCase())) {
      errors.push(`Invalid organization subtype.`);
    } else {
      data.organizationSubtype = body.organizationSubtype ? body.organizationSubtype.toLowerCase() : null;
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data };
}

/**
 * Validate admin update by super admin (more fields than regular profile update).
 */
function validateAdminUpdateBySuperAdmin(body) {
  const errors = [];
  const data = {};

  if (body.name !== undefined && body.name !== null && body.name !== '') {
    const r = validateName(body.name);
    if (!r.valid) errors.push(r.message);
    else data.name = r.value;
  }
  if (body.email !== undefined && body.email !== null && body.email !== '') {
    const r = validateEmail(body.email);
    if (!r.valid) errors.push(r.message);
    else data.email = r.value;
  }
  if (body.address !== undefined && body.address !== null) {
    const r = validateAddress(body.address, false);
    if (!r.valid && r.message) errors.push(r.message);
    else data.address = r.value;
  }
  if (body.phone !== undefined && body.phone !== null) {
    const r = validatePhone(body.phone, false);
    if (!r.valid && r.message) errors.push(r.message);
    else data.phone = r.value;
  }
  if (body.organizationType !== undefined && body.organizationType !== null && body.organizationType !== '') {
    const r = validateOrganizationType(body.organizationType);
    if (!r.valid) errors.push(r.message);
    else data.organizationType = r.value;
  }
  if (body.isActive !== undefined && body.isActive !== null) {
    data.isActive = body.isActive === true || body.isActive === 'true';
  }
  if (body.password !== undefined && body.password !== null && body.password !== '') {
    const r = validatePassword(body.password);
    if (!r.valid) errors.push(r.message);
    else data.password = body.password; // We will hash it in controller
  }

  if (body.latitude !== undefined && body.latitude !== null && body.latitude !== '') {
    const lat = parseFloat(body.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Invalid latitude.');
    else data.latitude = lat;
  }
  if (body.longitude !== undefined && body.longitude !== null && body.longitude !== '') {
    const long = parseFloat(body.longitude);
    if (isNaN(long) || long < -180 || long > 180) errors.push('Invalid longitude.');
    else data.longitude = long;
  }

  if (body.organizationCategory !== undefined) {
    if (body.organizationCategory && !ORGANIZATION_CATEGORIES_LIST.includes(body.organizationCategory.toLowerCase())) {
      errors.push(`Invalid organization category. Must be one of: ${ORGANIZATION_CATEGORIES_LIST.join(', ')}.`);
    } else {
      data.organizationCategory = body.organizationCategory ? body.organizationCategory.toLowerCase() : null;
    }
  }
  if (body.faith !== undefined) {
    if (body.faith && !FAITHS_LIST.includes(body.faith.toLowerCase())) {
      errors.push(`Invalid faith. Must be one of: ${FAITHS_LIST.join(', ')}.`);
    } else {
      data.faith = body.faith ? body.faith.toLowerCase() : null;
    }
  }
  if (body.organizationSubtype !== undefined) {
    if (body.organizationSubtype && !ORGANIZATION_SUBTYPES_LIST.includes(body.organizationSubtype.toLowerCase())) {
      errors.push(`Invalid organization subtype.`);
    } else {
      data.organizationSubtype = body.organizationSubtype ? body.organizationSubtype.toLowerCase() : null;
    }
  }

  if (body.panNumber !== undefined) {
    const r = validatePanNumber(body.panNumber, false);
    if (!r.valid) errors.push(r.message);
    else data.panNumber = r.value;
  }
  if (body.registration80GNumber !== undefined) {
    const r = validate80GRegistrationNumber(body.registration80GNumber, false);
    if (!r.valid) errors.push(r.message);
    else data.registration80GNumber = r.value;
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data };
}

/**
 * Validate verify-forgot-otp body: { email, otp }.
 */
function validateVerifyForgotOtp(body) {
  const errors = [];

  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) errors.push(emailResult.message);

  const otp = body.otp;
  if (otp === undefined || otp === null || String(otp).trim() === '') {
    errors.push('OTP is required.');
  } else {
    const otpStr = String(otp).trim();
    if (!/^\d{4}$/.test(otpStr)) {
      errors.push('OTP must be a 4-digit code.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email: emailResult.value,
      otp: String(body.otp).trim(),
    },
  };
}

/**
 * Validate reset-password body: { email, otp, password }.
 */
function validateResetPassword(body) {
  const errors = [];

  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) errors.push(emailResult.message);

  const otp = body.otp;
  if (otp === undefined || otp === null || String(otp).trim() === '') {
    errors.push('OTP is required.');
  } else {
    const otpStr = String(otp).trim();
    if (!/^\d{4}$/.test(otpStr)) {
      errors.push('OTP must be a 4-digit code.');
    }
  }

  const passwordResult = validatePassword(body.password);
  if (!passwordResult.valid) errors.push(passwordResult.message);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      email: emailResult.value,
      otp: String(body.otp).trim(),
      password: body.password,
    },
  };
}

module.exports = {
  validateSuperAdminRegister,
  validateLogin,
  validateCreateAdmin,
  validateProfileUpdate,
  validateAdminUpdateBySuperAdmin,
  validateEmail,
  validatePassword,
  validateName,
  validateAddress,
  validatePhone,
  validatePhone,
  validateOrganizationType,
  validateOrganizationHierarchy,
  validateVerifyForgotOtp,
  validateResetPassword,
  validatePanNumber,
  validate80GRegistrationNumber,
};