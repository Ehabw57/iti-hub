const express = require("express");
const connectionRoute = express.Router();
const { 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing 
} = require("../controllers/connection");
const { checkAuth, optionalAuth } = require("../middlewares/checkAuth");


connectionRoute.post("/users/:userId/follow", checkAuth, followUser);
connectionRoute.delete("/users/:userId/follow", checkAuth, unfollowUser);

connectionRoute.get("/users/:userId/followers", optionalAuth, getFollowers);
connectionRoute.get("/users/:userId/following", optionalAuth, getFollowing);

module.exports = connectionRoute;
