const mongoose = require("mongoose");

/**
 * TrackRecord - a session recording / Teams meeting link published by track
 * managers in the workspace "Records" tab. Members read; managers CRUD.
 */
const trackRecordSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: [true, "Record must belong to a track"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Record title is required"],
      trim: true,
      maxlength: 200,
    },
    // Teams / meeting recording link (opens in a new tab on the client)
    teamsUrl: {
      type: String,
      required: [true, "Teams URL is required"],
      trim: true,
      maxlength: 1000,
    },
    // Optional thumbnail image URL for the recording
    thumbnail: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    // Session date (defaults to creation time on the client side)
    sessionDate: {
      type: Date,
      default: null,
    },
    // Optional folder grouping (TrackFolder of the same track; null = root).
    // Mirrors CourseFile.folderId so the Records tab groups recordings the
    // same way the Files tab groups uploads.
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackFolder",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

trackRecordSchema.index({ trackId: 1, sessionDate: -1 });
trackRecordSchema.index({ trackId: 1, createdAt: -1 });

const TrackRecord = mongoose.model("TrackRecord", trackRecordSchema);

module.exports = TrackRecord;