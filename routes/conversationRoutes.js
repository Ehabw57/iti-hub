const express = require("express");
const {
  getConversations,
  createConversation,
  getConversationById,
  deleteConversation
} = require("../controllers/conversationController");

const router = express.Router();

// GET /conversations → getConversations
router.get("/api/conversations", getConversations);

// POST /conversations → createConversation
router.post("/api/conversations", createConversation);

// GET /conversations/:id → getConversationById
router.get("/api/conversations/:id", getConversationById);

// DELETE /conversations/:id → deleteConversation
router.delete("/api/conversations/:id", deleteConversation);

module.exports = router;
