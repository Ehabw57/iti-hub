const mongoose = require("mongoose");
const {
  MIN_COMMENT_CONTENT_LENGTH,
  MAX_COMMENT_CONTENT_LENGTH
} = require("../utils/constants");

const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: [MIN_COMMENT_CONTENT_LENGTH, `Content must be at least ${MIN_COMMENT_CONTENT_LENGTH} character`],
      maxlength: [MAX_COMMENT_CONTENT_LENGTH, `Content cannot exceed ${MAX_COMMENT_CONTENT_LENGTH} characters`]
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    editedAt: {
      type: Date
    }
  },
  { timestamps: true, versionKey: false }
);

// Custom validation: prevent nested replies beyond one level
CommentSchema.pre('validate', async function(next) {
  if (this.parentComment) {
    try {
      const parentComment = await mongoose.model('Comment').findById(this.parentComment);
      if (parentComment && parentComment.parentComment) {
        this.invalidate('parentComment', 'Cannot create nested replies beyond one level');
      }
    } catch (error) {
      // If we can't find the parent, let the ref validation handle it
    }
  }
  next();
});

// Indexes for efficient querying
CommentSchema.index({ post: 1, parentComment: 1 });
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });

module.exports = mongoose.model("Comment", CommentSchema);
