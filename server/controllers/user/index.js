/**
 * User Controller Index
 * Exports all user-related controllers for Epic 2
 */
const updateProfile = require("./updateProfileController");
const getUserProfile = require("./getUserProfileController");

module.exports = {
  getUserProfile,
  updateProfile,
  ...require("./blockController"),
};
