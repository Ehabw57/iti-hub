const UserEnrollment = require("../../../models/UserEnrollment");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * POST /admin/enrollments/:enrollmentId/graduate
 * Update graduation status for an enrollment
 */
const graduateEnrollment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { graduated } = req.body;

  if (graduated === undefined || graduated === null) {
    return res.status(400).json({
      success: false,
      message: "graduated field is required (true or false)",
    });
  }

  const enrollment = await UserEnrollment.findById(enrollmentId);
  if (!enrollment) {
    return res.status(404).json({
      success: false,
      message: "Enrollment not found",
    });
  }

  // Idempotent: if same value, just return
  if (enrollment.graduated === graduated) {
    return res.status(200).json({
      success: true,
      message: "Graduation status unchanged",
      data: enrollment,
    });
  }

  enrollment.graduated = graduated;
  await enrollment.save();

  res.status(200).json({
    success: true,
    message: `Enrollment marked as ${graduated ? "graduated" : "not graduated"}`,
    data: enrollment,
  });
});

/**
 * GET /admin/enrollments
 * List enrollments with optional filters (roundId, graduated)
 */
const listEnrollments = asyncHandler(async (req, res) => {
  const { roundId, graduated, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (roundId) {
    filter.roundId = roundId;
  }
  if (graduated !== undefined) {
    if (graduated === "null") {
      filter.graduated = null;
    } else if (graduated === "true") {
      filter.graduated = true;
    } else if (graduated === "false") {
      filter.graduated = false;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const enrollments = await UserEnrollment.find(filter)
    .populate("userId", "username fullName email")
    .populate("branchId", "name")
    .populate("roundId", "number name")
    .populate("trackId", "name")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await UserEnrollment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: enrollments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

module.exports = {
  graduateEnrollment,
  listEnrollments,
};
