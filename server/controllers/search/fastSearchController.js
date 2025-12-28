const User = require("../../models/User");
const Post = require("../../models/Post");
const Community = require("../../models/Community");

const fastSearch = async (req, res, next) => {
  try {
    // 1️⃣ قراءة الكويري
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Search query must be at least 2 characters",
        },
      });
    }

    // 2️⃣ Users search
    const users = await User.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .select("username fullName profilePicture followersCount")
      .limit(3);

    // 3️⃣ Posts search
    const posts = await Post.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(3);

    // 4️⃣ Communities search
    const communities = await Community.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .select("name profilePicture memberCount")
      .limit(3);

    // 5️⃣ Response واحد
    return res.status(200).json({
      success: true,
      data: {
        users,
        posts,
        communities,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { fastSearch };
