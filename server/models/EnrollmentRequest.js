const mongoose = require("mongoose");

/**
 * EnrollmentRequest - a student's request to join a track at a branch.
 *
 * Requests are reviewed by track managers (super admin / branch admin of the
 * track's branch / the track's assigned admin). An approval creates the
 * Enrollment document and syncs Track.studentIds + User.trackIds — exactly
 * like the old instant-enroll flow, but gated behind a manager decision.
 */
const enrollmentRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    track_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: true,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    // pending -> approved | rejected; cancelled rows are removed entirely
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A user may only have ONE pending request per track (any branch)
enrollmentRequestSchema.index(
  { user_id: 1, track_id: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "one_pending_request_per_user_track",
  }
);

const EnrollmentRequest = mongoose.model("EnrollmentRequest", enrollmentRequestSchema);

module.exports = EnrollmentRequest;