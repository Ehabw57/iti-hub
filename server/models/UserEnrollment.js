const mongoose = require("mongoose");

const UserEnrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: [true, "Round is required"],
    },
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: [true, "Track is required"],
    },
    graduated: {
      type: Boolean,
      default: null, // null = not yet determined
    },
  },
  { timestamps: true, versionKey: false }
);

// Unique constraint: one enrollment per user per round (no multiple tracks in same round)
UserEnrollmentSchema.index({ userId: 1, roundId: 1 }, { unique: true });

// Index for querying enrollments by user
UserEnrollmentSchema.index({ userId: 1, createdAt: -1 });

// Index for querying by round (for admin listing/graduation)
UserEnrollmentSchema.index({ roundId: 1, graduated: 1 });

module.exports = mongoose.model("UserEnrollment", UserEnrollmentSchema);
