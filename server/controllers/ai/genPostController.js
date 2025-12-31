// const { generatePostFromText } = require("../../utils/aipostGen");
// const { asyncHandler } = require("../../middlewares/errorHandler");
// const { ValidationError } = require("../../utils/errors");
// const { sendSuccess } = require("../../utils/responseHelpers");

// const generatePost = asyncHandler(async (req, res) => {
//   const {
//     text,
//     tone = "professional",
//     withHashtags = true,
//     withEmojis = false
//   } = req.body;

//   if (!text || text.trim().length < 5) {
//     throw new ValidationError("Text is too short to generate a post");
//   }

//   const content = await generatePostFromText(text.trim(), {
//     tone,
//     withHashtags,
//     withEmojis
//   });

//   sendSuccess(res, { content }, "Post generated successfully");
// });

// module.exports = generatePost;
const Post = require("../../models/Post");
const { generatePostFromText } = require("../../utils/aipostGen"); // الكود اللي كتبناه للـ fetch

// Route 1: جلب البوستات من الداتا بيز
const getPostsFromDB = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, message: "Posts retrieved successfully", data: posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Route 2: إنشاء بوست من نص اليوزر
const createPostFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const newPost = await Post.create({ author: req.user._id, content: text });

    res.json({ success: true, message: "Post created successfully", data: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Route 3: توليد بوست باستخدام AI بدون حفظه في DB
const generatePost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Text is required" });

    const aiContent = await generatePostFromText(text);

    res.json({
      success: true,
      message: "AI Post generated successfully",
      data: { content: aiContent },
    });
  } catch (err) {
  console.error("FULL ERROR:", err);
  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack
  });
}

};

module.exports = { getPostsFromDB, createPostFromText, generatePost };
