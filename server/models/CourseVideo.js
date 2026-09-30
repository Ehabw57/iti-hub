const mongoose = require("mongoose");

/**
 * CourseVideo - a video entry in a track's Videos section
 * videoUrl can be an external link (YouTube/Vimeo/Drive) or a storage URL
 */
const courseVideoSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: [true, "Video must belong to a track"],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    durationSeconds: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false } }
);

courseVideoSchema.index({ trackId: 1, uploadedAt: -1 });

const CourseVideo = mongoose.model("CourseVideo", courseVideoSchema);

module.exports = CourseVideo;