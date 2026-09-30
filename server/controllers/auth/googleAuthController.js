const crypto = require("crypto");
const User = require("../../models/User");
const { asyncHandler } = require("../../middlewares/errorHandler");
const {
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  InternalError,
} = require("../../utils/errors");
const { sendSuccess } = require("../../utils/responseHelpers");
// Namespace import — call-time property lookup lets tests spy on
// `verifyGoogleIdToken` (a destructured binding would escape the spy).
const googleAuthUtil = require("../../utils/googleAuth");
const { SEED_PROFILE_PICTURES } = require("../../utils/constants");

/**
 * Build a unique username from an email's local part.
 * Usernames must match /^[a-z0-9_]{3,30}$/ (see User schema).
 * Falls back to "user" when nothing usable remains, and appends random
 * digits until the username is free.
 * @param {string} email - Verified Google email
 * @returns {Promise<string>} Available username
 */
async function buildUniqueUsername(email) {
  const rawBase = String(email)
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

  let base = rawBase.slice(0, 30);
  if (base.length < 3) base = `user_${rawBase}`.slice(0, 30);
  if (base.length < 3) base = "iti_user";

  let candidate = base;
  let attempts = 0;

  // Try the clean base, then bases with random numeric suffixes
  while (attempts < 5) {
    const existing = await User.findOne({ username: candidate });
    if (!existing) return candidate;

    const suffix = crypto.randomInt(1000, 9999);
    candidate = `${base.slice(0, 26)}_${suffix}`.slice(0, 30);
    attempts += 1;
  }

  // Extremely unlikely — final safety net
  return `iti_${crypto.randomBytes(8).toString("hex").slice(0, 20)}`;
}

/**
 * @route   POST /auth/google
 * @desc    Google Sign-In — verify the Google ID token server-side, then
 *          find-or-create (or link to) a User and issue the app's normal JWT,
 *          exactly as a standard login would.
 * @access  Public
 * @body    { idToken }  — credential returned by Google Identity Services
 * @returns { success, message, data: { token, user } } or error
 *
 * Account linking rules:
 *  - Existing account with the same email (password-based or Google):
 *    link the Google identity to it — never create a duplicate.
 *  - Unknown email: create a new account (username derived from the email,
 *    random unusable password, Google picture or a seeded avatar).
 */
exports.googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ValidationError("Google ID token is required", "MISSING_GOOGLE_TOKEN");
  }

  // 1. Verify the ID token against Google's keys + GOOGLE_CLIENT_ID audience
  let googleProfile;
  try {
    googleProfile = await googleAuthUtil.verifyGoogleIdToken(idToken);
  } catch (err) {
    // Check the specific infrastructural failures first — GoogleAuthError
    // always carries statusCode 401, so the generic 401 branch below would
    // otherwise swallow them.
    if (err instanceof Error && err.code === "GOOGLE_NOT_CONFIGURED") {
      throw new InternalError("Google sign-in is not configured on the server", "GOOGLE_NOT_CONFIGURED");
    }
    if (err instanceof Error && err.code === "GOOGLE_UNREACHABLE") {
      throw new InternalError("Could not reach Google to verify the sign-in", "GOOGLE_UNREACHABLE");
    }
    if (err instanceof Error && err.statusCode === 401) {
      throw new AuthenticationError(err.message, err.code || "INVALID_GOOGLE_TOKEN");
    }
    throw new InternalError("Google sign-in failed", "GOOGLE_AUTH_FAILED");
  }

  const { sub: googleId, email, name, picture } = googleProfile;
  const normalizedEmail = String(email).toLowerCase();

  // 2. Find an existing account — by Google ID first, then by email (linking)
  let user = await User.findOne({ googleId }).select("+password");
  let linkedToExisting = false;

  if (!user) {
    user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (user) linkedToExisting = true;
  }

  // 3. Link or create
  if (user) {
    if (user.isBlocked) {
      throw new ForbiddenError("Your account has been blocked", "ACCOUNT_BLOCKED");
    }

    // Link the Google identity to the existing (possibly password-based) account
    user.googleId = googleId;

    // Google has already verified this email address
    user.isEmailVerified = true;

    // Adopt the Google profile picture/name only if the account has none
    if (!user.profilePicture && picture) user.profilePicture = picture;

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    // New account from Google profile data
    const username = await buildUniqueUsername(normalizedEmail);
    const fullName =
      name && String(name).trim().length >= 2 ? String(name).trim() : username;

    user = new User({
      email: normalizedEmail,
      username,
      // Random password — this account signs in via Google, not credentials
      password: crypto.randomBytes(24).toString("hex") + "aA1!",
      fullName,
      profilePicture: picture || SEED_PROFILE_PICTURES[Math.floor(Math.random() * SEED_PROFILE_PICTURES.length)],
      googleId,
      isEmailVerified: true, // Google verified the email for us
    });

    await user.save();
  }

  // 4. Issue the app's normal auth session — identical to a standard login
  const token = user.generateAuthToken();

  const userObject = user.toObject();
  // Never leak sensitive fields in the login response (select:false only
  // affects query projection — toObject still returns them, so delete here)
  delete userObject.password;
  delete userObject.googleId;

  return sendSuccess(
    res,
    { token, user: userObject, linkedToExisting },
    linkedToExisting
      ? "Signed in with Google (linked to your existing account)"
      : "Signed in with Google"
  );
});