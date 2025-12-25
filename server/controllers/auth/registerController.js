const User = require("../../models/User");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require('../../middlewares/errorHandler');
const { ValidationError, ConflictError } = require('../../utils/errors');
const { sendCreated } = require('../../utils/responseHelpers');

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, username, fullName }
 * @returns { success, message, data: { user, token } } or error
 */
exports.register = asyncHandler(async (req, res) => {
  const { email, password, username, fullName } = req.body;

  // Validation object to collect all errors
  const validationErrors = {};

  // Validate email
  if (!email) {
    validationErrors.email = "Email is required";
  } else if (!validator.isEmail(email)) {
    validationErrors.email = "Email format is invalid";
  }

  // Validate password
  if (!password) {
    validationErrors.password = "Password is required";
  } else {
    if (password.length < 8) {
      validationErrors.password =
        "Password must be at least 8 characters long";
    } else if (!/[a-z]/.test(password)) {
      validationErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      validationErrors.password = "Password must contain at least one number";
    }
  }

  // Validate username
  if (!username) {
    validationErrors.username = "Username is required";
  } else if (username.length < 3 || username.length > 30) {
    validationErrors.username =
      "Username must be between 3 and 30 characters";
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    validationErrors.username =
      "Username can only contain alphanumeric characters and underscores";
  }

  // Validate fullName
  if (!fullName) {
    validationErrors.fullName = "Full name is required";
  } else if (fullName.length < 2) {
    validationErrors.fullName =
      "Full name must be at least 2 characters long";
  }

  // If there are validation errors, throw them
  if (Object.keys(validationErrors).length > 0) {
    console.log(validationErrors);
    throw new ValidationError("Validation failed", {
      fields: validationErrors,
    });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ConflictError("Email is already registered", "EMAIL_EXISTS");
  }

  // Check if username already exists
  const existingUsername = await User.findOne({
    username: username.toLowerCase(),
  });
  if (existingUsername) {
    throw new ConflictError("Username is already taken", "USERNAME_EXISTS");
  }

  // Create new user
  const newUser = new User({
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    fullName,
    profilePicture: 'https://res-console.cloudinary.com/djdhnueis/thumbnails/v1/image/upload/v1761820117/bWFpbi1zYW1wbGU'
  });

  await newUser.save();

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Return user without password
  const userObject = newUser.toObject();
  delete userObject.password;

  return sendCreated(
    res,
    { user: userObject, token },
    "User registered successfully"
  );
});
