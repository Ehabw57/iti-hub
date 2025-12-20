const Branch = require("../../models/Branch");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * GET /branches
 * Public: returns enabled branches only
 */
const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({ isDisabled: false }).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: branches,
  });
});

module.exports = {
  getBranches,
};
