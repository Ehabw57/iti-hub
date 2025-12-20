const Branch = require("../../../models/Branch");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/branches
 * Create a new branch
 */
const createBranch = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Branch name is required",
    });
  }

  const existingBranch = await Branch.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });

  if (existingBranch) {
    return res.status(409).json({
      success: false,
      message: "Branch with this name already exists",
    });
  }

  const branch = await Branch.create({
    name: name.trim(),
    description: description?.trim() || null,
  });

  res.status(201).json({
    success: true,
    message: "Branch created successfully",
    data: branch,
  });
});

/**
 * PATCH /admin/branches/:branchId
 * Update branch fields (name, description)
 */
const updateBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { name, description } = req.body;

  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  if (name && name.trim()) {
    const duplicate = await Branch.findOne({
      _id: { $ne: branchId },
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another branch with this name already exists",
      });
    }
    branch.name = name.trim();
  }

  if (description !== undefined) {
    branch.description = description?.trim() || null;
  }

  await branch.save();

  res.status(200).json({
    success: true,
    message: "Branch updated successfully",
    data: branch,
  });
});

/**
 * POST /admin/branches/:branchId/disable
 * Disable a branch (hide from selection lists)
 */
const disableBranch = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  if (branch.isDisabled) {
    return res.status(409).json({
      success: false,
      message: "Branch is already disabled",
    });
  }

  branch.isDisabled = true;
  await branch.save();

  res.status(200).json({
    success: true,
    message: "Branch disabled successfully",
    data: branch,
  });
});

/**
 * GET /admin/branches
 * List all branches (including disabled) for admin
 */
const listBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: branches,
  });
});

module.exports = {
  createBranch,
  updateBranch,
  disableBranch,
  listBranches,
};
