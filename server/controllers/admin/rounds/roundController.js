const Round = require("../../../models/Round");
const Branch = require("../../../models/Branch");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/branches/:branchId/rounds
 * Create a round in a branch
 */
const createRound = asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { number, name, startDate, endDate, status } = req.body;

  // Validate branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  if (number === undefined || number === null) {
    return res.status(400).json({
      success: false,
      message: "Round number is required",
    });
  }

  // Check uniqueness of number within branch
  const existingRound = await Round.findOne({ branchId, number });
  if (existingRound) {
    return res.status(409).json({
      success: false,
      message: `Round number ${number} already exists in this branch`,
    });
  }

  // Validate status if provided
  const validStatuses = ["draft", "upcoming", "active", "ended", "disabled"];
  const roundStatus = status || "draft";
  if (!validStatuses.includes(roundStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // Enforce single active per branch
  if (roundStatus === "active") {
    const activeRound = await Round.findOne({ branchId, status: "active" });
    if (activeRound) {
      return res.status(409).json({
        success: false,
        message: "Branch already has an active round",
      });
    }
  }

  // Enforce at most one upcoming per branch
  if (roundStatus === "upcoming") {
    const upcomingRound = await Round.findOne({ branchId, status: "upcoming" });
    if (upcomingRound) {
      return res.status(409).json({
        success: false,
        message: "Branch already has an upcoming round",
      });
    }
  }

  const round = await Round.create({
    branchId,
    number,
    name: name?.trim() || null,
    startDate: startDate || null,
    endDate: endDate || null,
    status: roundStatus,
  });

  res.status(201).json({
    success: true,
    message: "Round created successfully",
    data: round,
  });
});

/**
 * PATCH /admin/rounds/:roundId
 * Update mutable fields: name, startDate, endDate
 */
const updateRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;
  const { name, startDate, endDate } = req.body;

  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  if (name !== undefined) {
    round.name = name?.trim() || null;
  }
  if (startDate !== undefined) {
    round.startDate = startDate || null;
  }
  if (endDate !== undefined) {
    round.endDate = endDate || null;
  }

  await round.save();

  res.status(200).json({
    success: true,
    message: "Round updated successfully",
    data: round,
  });
});

/**
 * POST /admin/rounds/:roundId/start
 * Set status to active (enforce single active per branch)
 */
const startRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  if (round.status === "active") {
    return res.status(200).json({
      success: true,
      message: "Round is already active",
      data: round,
    });
  }

  // Check for existing active round in same branch
  const activeRound = await Round.findOne({
    branchId: round.branchId,
    status: "active",
  });

  if (activeRound) {
    return res.status(409).json({
      success: false,
      message: "Branch already has an active round. End it first.",
    });
  }

  round.status = "active";
  await round.save();

  res.status(200).json({
    success: true,
    message: "Round started successfully",
    data: round,
  });
});

/**
 * POST /admin/rounds/:roundId/end
 * Set status to ended
 */
const endRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  if (round.status === "ended") {
    return res.status(200).json({
      success: true,
      message: "Round is already ended",
      data: round,
    });
  }

  round.status = "ended";
  await round.save();

  res.status(200).json({
    success: true,
    message: "Round ended successfully",
    data: round,
  });
});

/**
 * POST /admin/rounds/:roundId/disable
 * Set status to disabled
 */
const disableRound = asyncHandler(async (req, res) => {
  const { roundId } = req.params;

  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }

  if (round.status === "disabled") {
    return res.status(409).json({
      success: false,
      message: "Round is already disabled",
    });
  }

  round.status = "disabled";
  await round.save();

  res.status(200).json({
    success: true,
    message: "Round disabled successfully",
    data: round,
  });
});

/**
 * GET /admin/branches/:branchId/rounds
 * List all rounds for a branch (includes disabled)
 */
const listBranchRounds = asyncHandler(async (req, res) => {
  const { branchId } = req.params;

  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }

  const rounds = await Round.find({ branchId }).sort({ number: -1 });

  res.status(200).json({
    success: true,
    data: rounds,
  });
});

module.exports = {
  createRound,
  updateRound,
  startRound,
  endRound,
  disableRound,
  listBranchRounds,
};
