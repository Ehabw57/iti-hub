const User = require("../../models/User");
const crypto = require("crypto");
const { asyncHandler } = require("../../middlewares/errorHandler");
const { ValidationError } = require("../../utils/errors");
const { sendSuccess } = require("../../utils/responseHelpers");
const sendEmail = require('../../utils/sendEmail');
const { getEmailVerificationTemplate } = require('../../utils/emailTemplates');

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ValidationError("Verification token is required", "MISSING_TOKEN");
  }

  // Hash the token to match database (same pattern as password reset)
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token and non-expired expiration
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  }).select('+emailVerificationToken');

  if (!user) {
    // Check if there's a user with this token but expired
    const expiredUser = await User.findOne({ emailVerificationToken: hashedToken }).select('+emailVerificationToken');
    
    if (expiredUser) {
      throw new ValidationError("Email verification token has expired", "TOKEN_EXPIRED");
    }

    throw new ValidationError("Invalid or expired verification token", "INVALID_VERIFICATION_TOKEN");
  }

  // Check if email is already verified
  if (user.isEmailVerified) {
    throw new ValidationError("Email is already verified", "EMAIL_ALREADY_VERIFIED");
  }

  user.isEmailVerified = true;
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
  if (user.isEmailVerified) {
    throw new ValidationError("Email is already verified");
  } 
  
  // generateEmailVerificationToken returns the plain token, stores hashed version
  const verificationToken = user.generateEmailVerificationToken();
  await user.save(); 
  
  const verifyLink = `http://localhost:5173/verify-email?token=${verificationToken}`;
  
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - itiHub',
    html: getEmailVerificationTemplate(verifyLink, user.fullName)
  });

  // Here you would typically send the verification email again
  return sendSuccess(res, {}, "Verification email resent successfully");  
}); 