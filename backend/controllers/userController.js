const mongoose = require("mongoose");
const User = require("../models/User");

async function createUser(req, res) {
  try {
    console.log("wofun worked!!");
    console.log(req.body);
    const newUser = await User.create({ ...req.body });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ massage: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ massage: err.massage });
  }
}

async function getUserById() {
  try {
    const user = await User.findById(res.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const updateUser = async (req, res) => {
  try {
    console.log(req.body);
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
};
