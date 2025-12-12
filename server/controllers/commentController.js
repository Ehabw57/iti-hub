const CommentModel = require("../models/Comment");
const CommentLikeModel = require("../models/CommentLike");
const PostModel = require("../models/Post");

async function getCommentsByPost(req, res) {
  try {
    const postId = req.params.postId;
    const comments = await CommentModel.find({
      post_id: postId,
      parent_comment_id: null,
    }).lean();

    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createComment(req, res) {
  try {
    const post_id = req.params.postId;
    const author_id = req.user.id;
    const { content, parent_comment_id, image_url } = req.body;

    const post = await PostModel.findById(post_id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (parent_comment_id) {
      const parentComment = await CommentModel.findById(parent_comment_id);
      if (!parentComment) {
        return res.status(400).json({ message: "Parent comment not found" });
      } else if (parentComment.post_id.toString() !== post_id) {
        return res
          .status(400)
          .json({ message: "Parent comment does not belong to the same post" });
      } else if (parentComment.parent_comment_id) {
        return res
          .status(400)
          .json({ message: "Cannot reply to a reply comment" });
      }
      parentComment.reply_count += 1;
      await parentComment.save();
    }

    const newComment = await CommentModel.create({
      post_id,
      author_id,
      content,
      parent_comment_id,
      image_url,
    });

    post.comments_count += 1;
    await post.save();

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }

    if (comment.author_id.toString() !== userId) {
      return res.status(403).json({ message: "forbidden" });
    }

    const post = await PostModel.findById(comment.post_id);
    if (post) {
      post.comments_count = Math.max(0, post.comments_count - 1);
      await post.save();
    }

    if (comment.parent_comment_id) {
      const parentComment = await CommentModel.findById(
        comment.parent_comment_id
      );
      if (parentComment) {
        parentComment.reply_count = Math.max(0, parentComment.reply_count - 1);
        await parentComment.save();
      }
    }

    await CommentModel.findByIdAndDelete(commentId);

    const replies = await CommentModel.deleteMany({
      parent_comment_id: commentId,
    });

    await CommentLikeModel.deleteMany({
      comment_id: commentId,
    });

    return res.status(200).json({
      message: `deleted comment and ${replies.deletedCount} replies`,
      id: commentId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateComment(req, res) {
  try {
    const targetID = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    const comment = await CommentModel.findOneAndUpdate(
      { _id: targetID, author_id: userId },
      { content },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }

    return res.status(200).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const toggleLikeComment = async (req, res) => {
  try {
    const { id: comment_id } = req.params;
    const user_id = req.user.id;
    const comment = await CommentModel.findById(comment_id);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }

    const existing = await CommentLikeModel.findOne({
      comment_id,
      user_id,
    });

    const message = existing ? "Comment unliked" : "Comment liked";

    if (existing) {
      await CommentLikeModel.deleteOne({ _id: existing._id });
      comment.likes_count = Math.max(0, comment.likes_count - 1);
    } else {
      comment.likes_count += 1;
      const newLike = await CommentLikeModel.create({
        comment_id,
        user_id,
      });
    }
    await comment.save();
    return res
      .status(200)
      .json({ success: true, message, likes: comment.likes_count });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getCommentLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await CommentModel.findById(id);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }
    const likes = await CommentLikeModel.find({ comment_id: id }).populate(
      "user_id",
      "first_name last_name profile_pic"
    );

    return res.status(200).json({ success: true, data: likes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
  toggleLikeComment,
  getCommentLikes,
};
