const express = require("express");
const {
  getAllMessages,
  getMessagesByConversation,
  sendMessage,
  updateMessage,
  deleteMessage
} = require("../controllers/messageController");

const router = express.Router();

router.get("/api/messages", getAllMessages);
router.get("/api/conversations/:id/messages", getMessagesByConversation);
router.post("/api/conversations/:id/messages", sendMessage);
router.patch("/api/messages/:id", updateMessage);
router.delete("/api/messages/:id", deleteMessage);

module.exports = router;
