const mongoose = require("mongoose");

/**
 * CourseFile - a file uploaded to a track's Files section
 */
const courseFileSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: [true, "File must belong to a track"],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    // Extension: pdf, pptx, zip, docx, ...
    fileType: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    sizeInBytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Shared resources library: file is visible to same-named tracks across branches
    isShared: {
      type: Boolean,
      default: false,
    },
    // Optional folder grouping (TrackFolder of the same track; null = root)
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackFolder",
      default: null,
      index: true,
    },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false } }
);

courseFileSchema.index({ trackId: 1, uploadedAt: -1 });

const CourseFile = mongoose.model("CourseFile", courseFileSchema);

module.exports = CourseFile;