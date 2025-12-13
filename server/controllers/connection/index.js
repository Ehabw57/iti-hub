/**
 * Connection Controller Index
 * Exports all connection-related controllers for Epic 2
 */

const getFollowers = require("./getFollowersController");
const getFollowing = require("./getFollowingController");

module.exports = {
  ...require("./followController"),
  getFollowers,
  getFollowing,
};
