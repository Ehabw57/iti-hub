const express = require("express");
const { 
  getUserProfile, 
  updateProfile, 
  blockUser, 
  unblockUser 
} = require("../controllers/user");
const { checkAuth, optionalAuth } = require("../middlewares/checkAuth");

const userRouter = express.Router();


userRouter.get("/users/:username", optionalAuth, getUserProfile); // Public, optional auth
userRouter.put("/users/profile", checkAuth, updateProfile); // Requires auth

userRouter.post("/users/:userId/block", checkAuth, blockUser); // Requires auth
userRouter.delete("/users/:userId/block", checkAuth, unblockUser); // Requires auth

module.exports = userRouter;
