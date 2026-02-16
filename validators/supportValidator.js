'use strict';

const REASON_MAX_LENGTH = 2000;

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

module.exports = {
  validateRaiseSupport,
};
