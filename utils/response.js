'use strict';

/**
 * Standard API response helpers.
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) {
    payload.data = data;
  }
  return res.status(statusCode).json(payload);
}

function error(res, message = 'An error occurred', statusCode = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}

module.exports = { success, error };
