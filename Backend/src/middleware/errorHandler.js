const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = err;

  if (err && err.name === 'ValidationError') {
    error = ApiError.badRequest(
      'Validation failed',
      Object.values(err.errors).map((item) => item.message),
    );
  } else if (err && err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ') || 'field';
    error = ApiError.conflict(`Duplicate value for ${field}`);
  } else if (err && err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON body');
  }

  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    // Full detail stays in the server log; the client only sees a generic message.
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isServerError && env.nodeEnv === 'production' ? 'Internal server error' : error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
