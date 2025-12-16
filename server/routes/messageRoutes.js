const express = require("express");

// NOTE: Message routes are nested under conversation routes
// See /routes/conversationRoutes.js for:
//   GET    /conversations/:conversationId/messages
//   POST   /conversations/:conversationId/messages
//   PUT    /conversations/:conversationId/seen

const router = express.Router();

module.exports = router;
