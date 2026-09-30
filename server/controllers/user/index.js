/**
 * User Controller Index
 * Exports all user-related controllers for Epic 2 and Epic 9
 */
const updateProfile = require("./updateProfileController");
const getUserProfile = require("./getUserProfileController");
const uploadProfilePicture = require("./uploadProfilePictureController");
const uploadCoverImage = require("./uploadCoverImageController");
const searchUsers = require("./searchUsersController");
const changePassword = require("./changePasswordController");
const updateNotificationPreferences = require("./updateNotificationPreferencesController");
const deleteAccount = require("./deleteAccountController");

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  uploadCoverImage,
  searchUsers,
  changePassword,
  updateNotificationPreferences,
  deleteAccount,
  ...require("./blockController"),
};
