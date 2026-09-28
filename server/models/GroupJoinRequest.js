const mongoose = require("mongoose");

/**
 * GroupJoinRequest - a user's request to join a community (specialization)
 * group.
 *
 * Requests are reviewed by the group's admin (creator) or a super admin.
 * An approval adds the user to CommunityGroup.memberIds — the same effect
 * as the old instant-join flow, but gated behind an admin decision.
 */
const groupJoinRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityGroup",
      required: true,
      index: true,
    },
    // pending -> approved | rejected; cancelled rows are removed entirely
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A user may only have ONE pending request per group
groupJoinRequestSchema.index(
  { user_id: 1, group_id: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "one_pending_request_per_user_group",
  }
);

const GroupJoinRequest = mongoose.model(
  "GroupJoinRequest",
  groupJoinRequestSchema
);

module.exports = GroupJoinRequest;
