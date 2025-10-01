const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} = require("../controllers/userController");

const userRouter = express.Router();

userRouter.post("/user", createUser);
userRouter.get("/user", getAllUsers);
userRouter.get("/users/:id", getUserById);
userRouter.put("/users/:id", updateUser);
userRouter.delete("/users/:id", deleteUser);

module.exports = userRouter;
