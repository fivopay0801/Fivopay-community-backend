'use strict';

const REASON_MAX_LENGTH = 2000;
const MESSAGE_MAX_LENGTH = 4000;

function validateRaiseSupport(body) {
  const reason =
    body.reason !== undefined && body.reason !== null ? String(body.reason).trim() : '';
  if (!reason.length) {
    return { valid: false, errors: ['Reason is required.'] };
  }
  if (reason.length > REASON_MAX_LENGTH) {
    return {
      valid: false,
      errors: [`Reason must be at most ${REASON_MAX_LENGTH} characters.`],
    };
  }
  return { valid: true, data: { reason } };
}

/** Devotee raises support for a specific admin (must be in devotee's favorites). */
function validateDevoteeRaiseSupport(body) {
  const reasonResult = body.reason !== undefined && body.reason !== null
    ? (() => {
        const r = String(body.reason).trim();
        if (!r.length) return { valid: false, errors: ['Reason is required.'] };
        if (r.length > REASON_MAX_LENGTH) return { valid: false, errors: [`Reason must be at most ${REASON_MAX_LENGTH} characters.`] };
        return { valid: true, value: r };
      })()
    : { valid: false, errors: ['Reason is required.'] };
  const adminId = body.adminId;
  if (!adminId || !Number.isInteger(Number(adminId)) || Number(adminId) <= 0) {
    return { valid: false, errors: ['Valid adminId (organization) is required.'] };
  }
  if (reasonResult.valid === false) {
    return { valid: false, errors: reasonResult.errors };
  }
  return {
    valid: true,
    data: { reason: reasonResult.value, adminId: Number(adminId) },
  };
}

function validateSupportMessage(body) {
  const message =
    body.message !== undefined && body.message !== null ? String(body.message).trim() : '';
  if (!message.length) {
    return { valid: false, errors: ['Message is required.'] };
  }
  if (message.length > MESSAGE_MAX_LENGTH) {
    return {
      valid: false,
      errors: [`Message must be at most ${MESSAGE_MAX_LENGTH} characters.`],
    };
  }
  return { valid: true, data: { message } };
}

module.exports = {
  validateRaiseSupport,
  validateDevoteeRaiseSupport,
  validateSupportMessage,
};
