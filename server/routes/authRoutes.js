const authRoute = require("express").Router();
const rateLimit = require("express-rate-limit");

// Import controllers from auth directory
const {register, login, requestPasswordReset, confirmPasswordReset} = require("../controllers/auth");

// Disable rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

// Rate limiters - disabled in test environment
const registerLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many registration attempts. Please try again later.",
    },
  },
});

const loginLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Please try again later.",
    },
  },
});

const passwordResetLimiter = isTestEnv ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many password reset attempts. Please try again later.",
    },
  },
});

// Authentication routes
authRoute.post("/register", registerLimiter, register);
authRoute.post("/login", loginLimiter, login);
authRoute.post("/password-reset/request", passwordResetLimiter, requestPasswordReset);
authRoute.post("/password-reset/confirm", passwordResetLimiter, confirmPasswordReset);

module.exports = authRoute;
