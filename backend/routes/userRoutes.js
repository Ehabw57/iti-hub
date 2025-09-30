const express = require ("express")
const {getAllUsers , getUserById}=require("../controllers/userController")

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
