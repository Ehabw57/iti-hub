const User = require("../../../models/User");
const UserEnrollment = require("../../../models/UserEnrollment");
const Branch = require("../../../models/Branch");
const Round = require("../../../models/Round");
const Track = require("../../../models/Track");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/users/:userId/verify
 * Verify user profile and create enrollment record
 */
const verifyUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { branchId, roundId, trackId } = req.body;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Validate branch exists and not disabled
  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: "Branch not found",
    });
  }
  if (branch.isDisabled) {
    return res.status(400).json({
      success: false,
      message: "Branch is disabled",
    });
  }

  // Validate round exists, belongs to branch, and not disabled
  const round = await Round.findById(roundId);
  if (!round) {
    return res.status(404).json({
      success: false,
      message: "Round not found",
    });
  }
  if (round.branchId.toString() !== branchId) {
    return res.status(400).json({
      success: false,
      message: "Round does not belong to the specified branch",
    });
  }
  if (round.status === "disabled") {
    return res.status(400).json({
      success: false,
      message: "Round is disabled",
    });
  }

  // Validate track exists, belongs to round, and not disabled
  const track = await Track.findById(trackId);
  if (!track) {
    return res.status(404).json({
      success: false,
      message: "Track not found",
    });
  }
  if (track.roundId.toString() !== roundId) {
    return res.status(400).json({
      success: false,
      message: "Track does not belong to the specified round",
    });
  }
  if (track.isDisabled) {
    return res.status(400).json({
      success: false,
      message: "Track is disabled",
    });
  }

  // Check for existing enrollment in this round
  let enrollment = await UserEnrollment.findOne({ userId, roundId });
  if (enrollment) {
    // Idempotent: return existing enrollment
    return res.status(200).json({
      success: true,
      message: "User already enrolled in this round",
      data: {
        user: {
          id: user._id,
          username: user.username,
          verificationStatus: user.verificationStatus,
        },
        enrollment,
      },
    });
  }

  // Create enrollment
  enrollment = await UserEnrollment.create({
    userId,
    branchId,
    roundId,
    trackId,
    graduated: null, // Not yet determined
  });

  // Update user verification status
  user.verificationStatus = true;
  user.branchId = branchId;
  user.roundId = roundId;
  user.trackId = trackId;
  await user.save();

  res.status(201).json({
    success: true,
    message: "User verified and enrolled successfully",
    data: {
      user: {
        id: user._id,
        username: user.username,
        verificationStatus: user.verificationStatus,
      },
      enrollment,
    },
  });
});

/**
 * DELETE /admin/users/:userId/verify
 * Reject user verification (clear selections, set status to false)
 */
const rejectVerification = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.verificationStatus = false;
  user.branchId = null;
  user.roundId = null;
  user.trackId = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User verification rejected; selections cleared",
    data: {
      id: user._id,
      username: user.username,
      verificationStatus: user.verificationStatus,
    },
  });
});

/**
 * GET /admin/users
 * List users with optional verificationStatus filter
 */
const listUsers = asyncHandler(async (req, res) => {
  const { verificationStatus, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (verificationStatus !== undefined) {
    if (verificationStatus === "null" || verificationStatus === "pending") {
      filter.verificationStatus = null;
    } else if (verificationStatus === "true" || verificationStatus === "verified") {
      filter.verificationStatus = true;
    } else if (verificationStatus === "false" || verificationStatus === "rejected") {
      filter.verificationStatus = false;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const users = await User.find(filter)
    .select("_id username fullName email role verificationStatus branchId roundId trackId createdAt")
    .populate("branchId", "name")
    .populate("roundId", "number name")
    .populate("trackId", "name")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

module.exports = {
  verifyUser,
  rejectVerification,
  listUsers,
};
