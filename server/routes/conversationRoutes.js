const express = require("express");
const { checkAuth } = require("../middlewares/checkAuth");
const upload = require("../middlewares/upload");

// Import conversation controllers
const {
  getConversations,
  getConversation,
  createConversation,
  createGroupConversation,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  updateGroup,
  markConversationAsSeen
} = require("../controllers/conversation");

// Import message controllers
const {
  getMessages,
  sendMessage
} = require("../controllers/message");

const conversationRoutes = express.Router();

// Conversation routes
conversationRoutes.get("/", checkAuth, getConversations);
conversationRoutes.get("/:conversationId", checkAuth, getConversation);
conversationRoutes.post("/", checkAuth, createConversation);
conversationRoutes.post("/group", checkAuth, createGroupConversation);

// Group management routes
conversationRoutes.post("/:conversationId/members", checkAuth, addGroupMember);
conversationRoutes.delete("/:conversationId/members/:userId", checkAuth, removeGroupMember);
conversationRoutes.post("/:conversationId/leave", checkAuth, leaveGroup);
conversationRoutes.patch("/:conversationId", checkAuth, upload.message, updateGroup);

// Message routes (nested under conversations)
conversationRoutes.get("/:conversationId/messages", checkAuth, getMessages);
conversationRoutes.post("/:conversationId/messages", checkAuth, upload.message, sendMessage);

// Message status routes
conversationRoutes.put("/:conversationId/seen", checkAuth, markConversationAsSeen);

module.exports = conversationRoutes;
