const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: false,
    },
    media: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "video", "file"],
          required: true,
        },
      },
    ],
    seen_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversation_id: 1, created_at: -1 });
MessageSchema.index({ sender_id: 1 });

module.exports = mongoose.model("Message", MessageSchema);
