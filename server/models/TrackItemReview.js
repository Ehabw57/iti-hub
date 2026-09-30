const mongoose = require("mongoose");

/**
 * TrackItemReview - marks a track file/video as "reviewed" by a user.
 * Powers the per-student progress bar on the Track page.
 */
const trackItemReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    itemType: {
      type: String,
      enum: ["file", "video"],
      required: true,
    },
  },
  { timestamps: true }
);

// A user can review an item only once
trackItemReviewSchema.index({ userId: 1, itemId: 1 }, { unique: true });
trackItemReviewSchema.index({ userId: 1, trackId: 1 });

const TrackItemReview = mongoose.model("TrackItemReview", trackItemReviewSchema);

module.exports = TrackItemReview;