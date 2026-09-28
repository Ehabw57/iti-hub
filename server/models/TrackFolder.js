const mongoose = require("mongoose");

/**
 * TrackFolder - a named grouping inside one workspace tab: "Files" (kind
 * 'files') or "Records" (kind 'records'). Managers and assigned instructors
 * create folders; members browse by folder. The two kinds never mix — the
 * same name may exist once per tab inside the same track.
 */
const trackFolderSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: [true, "Folder must belong to a track"],
      index: true,
    },
    // Which workspace tab this folder list belongs to: 'files' (Files tab)
    // or 'records' (Records tab). The two lists are fully independent.
    kind: {
      type: String,
      enum: ["files", "records"],
      default: "files",
    },
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: 100,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Folder names are unique per track AND per tab kind
trackFolderSchema.index({ trackId: 1, kind: 1, name: 1 }, { unique: true });

const TrackFolder = mongoose.model("TrackFolder", trackFolderSchema);

module.exports = TrackFolder;