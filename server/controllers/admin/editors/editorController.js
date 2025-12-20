const User = require("../../../models/User");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/editors
 * Assign editor role to a user (idempotent)
 */
const assignEditor = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Cannot change admin role",
    });
  }

  if (user.role === "editor") {
    return res.status(200).json({
      success: true,
      message: "User is already an editor",
      data: { id: user._id, username: user.username, role: user.role },
    });
  }

  user.role = "editor";
  await user.save();

  res.status(200).json({
    success: true,
    message: "Editor role assigned successfully",
    data: { id: user._id, username: user.username, role: user.role },
  });
});

/**
 * DELETE /admin/editors/:userId
 * Remove editor role from a user (set back to user)
 */
const removeEditor = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.role === "admin") {
    return res.status(400).json({
      success: false,
      message: "Cannot change admin role",
    });
  }

  if (user.role !== "editor") {
    return res.status(200).json({
      success: true,
      message: "User is not an editor",
      data: { id: user._id, username: user.username, role: user.role },
    });
  }

  user.role = "user";
  await user.save();

  res.status(200).json({
    success: true,
    message: "Editor role removed successfully",
    data: { id: user._id, username: user.username, role: user.role },
  });
});

module.exports = {
  assignEditor,
  removeEditor,
};
