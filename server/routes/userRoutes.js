const express = require("express");
const { 
  getUserProfile, 
  updateProfile, 
  blockUser, 
  unblockUser 
} = require("../controllers/user");
const { getUserPosts } = require("../controllers/post");
const { checkAuth, optionalAuth } = require("../middlewares/checkAuth");

const userRouter = express.Router();


userRouter.get("/users/:username", optionalAuth, getUserProfile); // Public, optional auth
userRouter.put("/users/profile", checkAuth, updateProfile); // Requires auth

userRouter.post("/users/:userId/block", checkAuth, blockUser); // Requires auth
userRouter.delete("/users/:userId/block", checkAuth, unblockUser); // Requires auth

// Get user's posts
userRouter.get("/users/:userId/posts", optionalAuth, getUserPosts); // Public, optional auth

module.exports = userRouter;
