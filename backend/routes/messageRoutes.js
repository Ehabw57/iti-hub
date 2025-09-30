const express = require("express");
const {
  getMessagesByConversation,
  sendMessage,
  updateMessage,
  deleteMessage
} = require("../controllers/messageController");

const router = express.Router();

router.get("/api/conversations/:id/messages", getMessagesByConversation);
router.post("/api/conversations/:id/messages", sendMessage);
router.put("/api/messages/:id", updateMessage);
router.delete("/api/messages/:id", deleteMessage);

module.exports = router;
