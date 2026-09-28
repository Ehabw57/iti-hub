const mongoose = require("mongoose");

/**
 * TrackChatMessage - a message in a track's chat room
 */
const trackChatMessageSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: [true, "Message must belong to a track"],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: 4000,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

trackChatMessageSchema.index({ trackId: 1, createdAt: -1 });

const TrackChatMessage = mongoose.model("TrackChatMessage", trackChatMessageSchema);

module.exports = TrackChatMessage;