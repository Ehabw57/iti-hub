const Round = require("../../models/Round");
const Branch = require("../../models/Branch");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * GET /rounds?branchId=<id>
 * Public: returns rounds for a branch with statuses active and ended (excludes disabled/draft/upcoming)
 */
const getRoundsByBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.query;

  if (!branchId) {
    return res.status(400).json({
      success: false,
      message: "branchId query parameter is required",
    });
  }

  // Validate branch exists and is not disabled
  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  if (branch.isDisabled) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  // Return only active and ended rounds
  const rounds = await Round.find({
    branchId,
    status: { $in: ["active", "ended"] },
  }).sort({ number: -1 });

  res.status(200).json({
    success: true,
    data: rounds,
  });
});

module.exports = {
  getRoundsByBranch,
};
