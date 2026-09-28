const mongoose = require("mongoose");

/**
 * CommunityJoinRequest - a user's request to join a legacy Community.
 *
 * Mirrors GroupJoinRequest (specialization groups): requests are reviewed by
 * the community's owners/moderators (or a super admin). An approval creates
 * the CommunityMember record — the same effect the old instant-join flow had,
 * but gated behind a moderator decision (Round 3 work order §4).
 */
const communityJoinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
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

// A user may only have ONE pending request per community
communityJoinRequestSchema.index(
  { user: 1, community: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "one_pending_request_per_user_community",
  }
);

const CommunityJoinRequest = mongoose.model(
  "CommunityJoinRequest",
  communityJoinRequestSchema
);

module.exports = CommunityJoinRequest;