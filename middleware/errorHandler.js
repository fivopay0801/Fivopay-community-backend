'use strict';

/**
 * Global error handler.
 * Sends consistent JSON error response and logs in development.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error]', err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error.' : message,
    ...(process.env.NODE_ENV !== 'production' && err.errors && { errors: err.errors }),
  });
}

module.exports = errorHandler;
