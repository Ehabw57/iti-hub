const jwt = require("jsonwebtoken");
module.exports = function (req, res, next) {
  try {
    const role = req?.user.role;
console.log("User Role:", role);
    if (role === "admin") next();
    else
   return res.status(403).json({ message: "Forbidden: Admins only" });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Server Error", error: error.message });
  }
};
