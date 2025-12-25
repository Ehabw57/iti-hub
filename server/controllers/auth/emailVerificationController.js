const User = require("../../models/User");
const crypto = require("crypto");
const { asyncHandler } = require("../../middlewares/errorHandler");
const { ValidationError } = require("../../utils/errors");
const { sendSuccess } = require("../../utils/responseHelpers");

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ValidationError("Verification token is required");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ValidationError("Invalid or expired verification token");
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;

  await user.save();

  return sendSuccess(res, {}, "Email verified successfully 🎉");
});
