const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    last_message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

conversationSchema
  .path("participants")
  .validate(
    (value) => value.length === 2,
    "A conversation must have exactly 2 participants."
  );

module.exports = mongoose.model("Conversation", conversationSchema);
