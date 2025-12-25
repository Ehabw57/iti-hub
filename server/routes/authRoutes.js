const authRoute = require("express").Router();
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const {sendSuccess} = require("../utils/responseHelpers")

// Import controllers from auth directory
const {register, login, requestPasswordReset, confirmPasswordReset , verifyEmail} = require("../controllers/auth");

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
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many password reset attempts. Please try again later.",
    },
  },
});

// Authentication routes
authRoute.post("/register", register);
authRoute.post("/login", loginLimiter, login);
authRoute.post("/password-reset/request", passwordResetLimiter, requestPasswordReset);
authRoute.post("/password-reset/confirm", passwordResetLimiter, confirmPasswordReset);
authRoute.get("/verify-email", verifyEmail);
authRoute.post("/check-username", async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    sendSuccess(res, { available: false });
  } else {
    sendSuccess(res, { available: true });
  }
});
authRoute.post("/check-email", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    sendSuccess(res, { available: false });
  } else {
    sendSuccess(res, { available: true });
  }
});

module.exports = authRoute;
