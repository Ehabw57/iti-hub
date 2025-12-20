/**
 * Wraps async route handlers to automatically catch errors
 * and pass them to the global error handler
 * 
 * Usage:
 * const asyncHandler = require('./utils/asyncHandler');
 * router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
