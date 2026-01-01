const User = require("../../models/User");
const crypto = require("crypto");
const { asyncHandler } = require("../../middlewares/errorHandler");
const { ValidationError } = require("../../utils/errors");
const { sendSuccess } = require("../../utils/responseHelpers");
const sendEmail = require('../../utils/sendEmail');

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ValidationError("Verification token is required");
  }

  
  const user = await User.findOne({
    emailVerificationToken: token,
  });
  console.log(user);

  if (!user) {
    throw new ValidationError("Invalid or expired verification token");
  }

  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;

  await user.save();

  return sendSuccess(res, {}, "Email verified successfully 🎉");
});


exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ValidationError("User not found");
  }
  if (user.emailVerified) {
    throw new ValidationError("Email is already verified");
  } 
  await user.generateEmailVerificationToken();
  await user.save(); 
  
  await sendEmail({
  to: user.email,
  subject: 'Verify your email',
  html: `
    <h2>Welcome 👋</h2>
    <p>Please verify your email by clicking the link below:</p>
    <a href="http://localhost:5173/verify-email?token=${user.emailVerificationToken}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
  `
});
  // Here you would typically send the verification email again
  return sendSuccess(res, {}, "Verification email resent successfully");  
}); 