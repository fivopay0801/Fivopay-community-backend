'use strict';

const validator = require('validator');
const { ORGANIZATION_TYPES_LIST } = require('../constants/roles');

const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 255;
const ADDRESS_MAX_LENGTH = 500;
const PHONE_MAX_LENGTH = 20;

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
      phone: phoneResult.value,
      address: addressResult.value,
      latitude: lat,
      longitude: long,
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

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data };
}

module.exports = {
  validateSuperAdminRegister,
  validateLogin,
  validateCreateAdmin,
  validateProfileUpdate,
  validateEmail,
  validatePassword,
  validateName,
  validateAddress,
  validatePhone,
  validateOrganizationType,
};
