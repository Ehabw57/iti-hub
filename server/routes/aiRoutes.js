const express = require("express");
const { checkAuth } = require("../middlewares/checkAuth");
const { generatePost, askFromPosts } = require("../controllers/ai/genPostController");

const router = express.Router();

// Generate post from user idea (requires auth)
router.post("/generate-post", checkAuth, generatePost);

// Ask a question and get answer from posts (public - no auth required)
router.post("/ask", askFromPosts);

module.exports = router;
