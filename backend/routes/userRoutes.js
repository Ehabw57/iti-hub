const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getUserPosts
} = require("../controllers/userController");

const userRouter = express.Router();

userRouter.post("/user", createUser);
userRouter.get("/user", getAllUsers);
userRouter.get("/users/:id", getUserById);
userRouter.put("/users/:id", updateUser);
userRouter.delete("/users/:id", deleteUser);
postRoutes.get("/users/:id/posts", getUserPosts);

module.exports = userRouter;
