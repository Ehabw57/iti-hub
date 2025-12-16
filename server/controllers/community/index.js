/**
 * Community Controller Index
 * Exports all community-related controllers
 */
const createCommunity = require("./createCommunityController");
const getCommunity = require("./getCommunityController");
const updateCommunityDetails = require("./updateCommunityDetailsController");
const updateCommunityProfilePicture = require("./updateCommunityProfilePictureController");
const updateCommunityCoverImage = require("./updateCommunityCoverImageController");
const joinCommunity = require("./joinCommunityController");
const leaveCommunity = require("./leaveCommunityController");
const addModerator = require("./addModeratorController");
const removeModerator = require("./removeModeratorController");
const listCommunities = require("./listCommunitiesController");
const getCommunityFeed = require("./getCommunityFeedController");
const searchCommunities = require("./searchCommunitiesController");

module.exports = {
  createCommunity,
  getCommunity,
  updateCommunityDetails,
  updateCommunityProfilePicture,
  updateCommunityCoverImage,
  joinCommunity,
  leaveCommunity,
  addModerator,
  removeModerator,
  listCommunities,
  getCommunityFeed,
  searchCommunities,
};
