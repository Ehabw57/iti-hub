const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    track_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    content: {
      type: String,
      required: true,
    },
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["photo", "video", "file"],
          default: "file",
        },
      },
    ],
    likes_count: {
      type: Number,
      default: 0,
    },
    comments_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Post", PostSchema);
