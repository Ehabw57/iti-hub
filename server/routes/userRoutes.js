const express = require("express");
const { 
  getUserProfile, 
  updateProfile, 
  blockUser, 
  unblockUser,
  uploadProfilePicture,
  uploadCoverImage,
} = require("../controllers/user");
const { getUserPosts } = require("../controllers/post");
const getUserCommunities = require("../controllers/community/getUserCommunities");
const { checkAuth, optionalAuth } = require("../middlewares/checkAuth");
const upload = require("../middlewares/upload");


const userRouter = express.Router();

// Get current user details & communities
userRouter.get("/users/me", checkAuth, (req, res) => res.json(req.user)); // Get current authenticated user
userRouter.get("/users/me/communities", checkAuth, getUserCommunities);

// Get & update user profile
userRouter.get("/users/:username", optionalAuth, getUserProfile); // Public, optional auth
userRouter.put("/users/profile", checkAuth, updateProfile); // Requires auth

// Image upload routes
userRouter.post("/users/profile/picture", checkAuth, upload.profile, uploadProfilePicture); // Upload profile picture
userRouter.post("/users/profile/cover", checkAuth, upload.cover, uploadCoverImage); // Upload cover image

// Block/Unblock users
userRouter.post("/users/:userId/block", checkAuth, blockUser); // Requires auth
userRouter.delete("/users/:userId/block", checkAuth, unblockUser); // Requires auth

// Get user's posts
userRouter.get("/users/:userId/posts", optionalAuth, getUserPosts); // Public, optional auth


module.exports = userRouter;
