'use strict';

/**
 * Global error handler.
 * Sends consistent JSON error response and logs in development.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error.';

  if (process.env.NODE_ENV !== 'test') {
    // Log richer error details in development environments to aid debugging
    const baseInfo = {
      name: err.name,
      message: err.message,
    };

    // Sequelize / database errors often have an `original` property with the DB error
    const dbInfo = err.original
      ? {
          dbName: err.original.name,
          dbMessage: err.original.message,
          dbDetail: err.original.detail,
        }
      : undefined;

    console.error('[Error]', {
      ...baseInfo,
      ...(dbInfo || {}),
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error.' : message,
    ...(process.env.NODE_ENV !== 'production' && err.errors && { errors: err.errors }),
  });
}

module.exports = errorHandler;
