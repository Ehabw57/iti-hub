const Post = require("../../models/Post");
const { generatePostFromText, answerFromPosts } = require("../../utils/aipostGen");

/**
 * Generate a post using AI from user's text/idea
 * POST /api/ai/generate-post
 * @requires authentication
 */
const generatePost = async (req, res) => {
  try {
    const { text, tone, withEmojis } = req.body;
    
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Text is required and must be at least 5 characters" 
      });
    }

    const result = await generatePostFromText(text.trim(), {
      tone: tone || "professional",
      withEmojis: withEmojis === true
    });

    res.json({
      success: true,
      message: "AI Post generated successfully",
      data: { 
        content: result.content,
        hashtags: result.hashtags 
      }
    });
  } catch (err) {
    console.error("Generate post error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate post"
    });
  }
};

/**
 * Answer a user question based on posts in the database (like Ask Reddit)
 * POST /api/ai/ask
 * @public - no authentication required
 */
const askFromPosts = async (req, res) => {
  try {
    const { question, limit = 50 } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Question is required and must be at least 3 characters"
      });
    }

    // Fetch recent posts with author info
    const posts = await Post.find({ content: { $exists: true, $ne: "" } })
      .populate("author", "username fullName profilePicture")
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();

    if (posts.length === 0) {
      return res.json({
        success: true,
        message: "No posts available",
        data: {
          answer: "There are no posts available to answer your question.",
          referencedPosts: []
        }
      });
    }

    const result = await answerFromPosts(question.trim(), posts);

    res.json({
      success: true,
      message: "Answer generated successfully",
      data: result
    });
  } catch (err) {
    console.error("Ask from posts error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to generate answer"
    });
  }
};

module.exports = { generatePost, askFromPosts };
