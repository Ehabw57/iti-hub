/**
 * User Controller Index
 * Exports all user-related controllers for Epic 2
 */
const updateProfile = require("./updateProfileController");
const getUserProfile = require("./getUserProfileController");
const uploadProfilePicture = require("./uploadProfilePictureController");
const uploadCoverImage = require("./uploadCoverImageController");

module.exports = {
  getUserProfile,
  updateProfile,
  uploadProfilePicture,
  uploadCoverImage,
  ...require("./blockController"),
};
