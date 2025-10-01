const express = require ("express")
const {getAllUsers , getUserById, updateUser, deleteUser}=require("../controllers/userController")

const userRouter = express.Router();

userRouter.get("/user", getAllUsers);
userRouter.get("/users/:id ", getUserById);
userRouter.put("/users/:id ", updateUser);
userRouter.delete("/users/:id ", deleteUser);

module.exports =  userRouter