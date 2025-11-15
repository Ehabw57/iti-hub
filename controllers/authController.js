const User = require("../models/User");

const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if(password.length < 6){
      return  res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const newUser = new User({
      first_name,
      last_name,
      email,
      password,
      role,
    });
    await newUser.save();

    const user = newUser.toObject();
    delete user.password;
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        const token = user.generateAuthToken();
        return res.status(200).json({ message: "Login successful", token });
      }
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    res.status(500).json({ message: "Error during login", error });
  }
};

module.exports = {
  register,
  login,
};