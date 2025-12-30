const mongoose = require("mongoose");
const Connection = require("./Connection");
const {
  CONVERSATION_TYPES,
  MIN_GROUP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MIN_CONVERSATION_PARTICIPANTS,
  MAX_GROUP_PARTICIPANTS,
} = require("../utils/constants");

const conversationSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: function () {
        return this.participants.length > 2;
      },
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    name: {
      type: String,
      minlength: MIN_GROUP_NAME_LENGTH,
      maxlength: MAX_GROUP_NAME_LENGTH,
      trim: true,
    },
    image: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: "Invalid image URL format",
      },
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      content: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Indexes
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ participants: 1, type: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ admin: 1 });


// Validation: participants array length
conversationSchema.path("participants").validate(function (value) {
  return (
    value.length >= MIN_CONVERSATION_PARTICIPANTS &&
    value.length <= MAX_GROUP_PARTICIPANTS
  );
}, `Conversation must have between ${MIN_CONVERSATION_PARTICIPANTS} and ${MAX_GROUP_PARTICIPANTS} participants`);

// Validation: group conversations require name and admin
conversationSchema.pre("validate", function (next) {
  if (this.type === CONVERSATION_TYPES.GROUP) {
    if (!this.name || this.name.trim().length === 0) {
      return next(new Error("Group name is required"));
    }
    if (!this.admin) {
      return next(new Error("Group admin is required"));
    }
  }
  next();
});

/**
 * Find conversation by participants and type
 * @param {Array<ObjectId>} participantIds - Array of participant IDs
 * @param {String} type - Conversation type ('individual' | 'group')
 * @returns {Promise<Conversation|null>}
 */
conversationSchema.statics.findByParticipants = async function (
  participantIds,
  type
) {
  const sortedIds = participantIds.map((id) => id.toString()).sort();

  return this.findOne({
    type,
    participants: { $all: sortedIds, $size: sortedIds.length },
  });
};

/**
 * Create or return existing individual conversation
 * @param {ObjectId} userId1 - First user ID
 * @param {ObjectId} userId2 - Second user ID
 * @returns {Promise<Conversation>}
 */
conversationSchema.statics.createIndividual = async function (
  userId1,
  userId2
) {
  // Prevent self-conversation
  if (userId1.toString() === userId2.toString()) {
    throw new Error("Cannot create conversation with yourself");
  }

  // Check for blocking (either direction)
  const user1BlocksUser2 = await Connection.isBlocking(userId1, userId2);
  const user2BlocksUser1 = await Connection.isBlocking(userId2, userId1);

  if (user1BlocksUser2 || user2BlocksUser1) {
    throw new Error("Cannot create conversation with blocked user");
  }

  // Sort participant IDs for consistent querying
  const participants = [userId1, userId2].map((id) => id.toString()).sort();

  // Check if conversation already exists
  const existing = await this.findByParticipants(
    participants,
    CONVERSATION_TYPES.INDIVIDUAL
  );
  if (existing) {
    return existing;
  }

  // Create new conversation
  const conversation = await this.create({
    type: CONVERSATION_TYPES.INDIVIDUAL,
    participants,
  });

  return conversation;
};

/**
 * Create group conversation
 * @param {ObjectId} creatorId - Creator user ID (becomes admin)
 * @param {String} name - Group name
 * @param {Array<ObjectId>} participantIds - Array of participant IDs (excluding creator)
 * @param {String|null} image - Optional group image URL
 * @returns {Promise<Conversation>}
 */
conversationSchema.statics.createGroup = async function (
  creatorId,
  name,
  participantIds,
  image
) {
  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error("Group name is required");
  }

  if (name.trim().length < MIN_GROUP_NAME_LENGTH) {
    throw new Error(
      `Group name must be at least ${MIN_GROUP_NAME_LENGTH} characters`
    );
  }

  if (name.trim().length > MAX_GROUP_NAME_LENGTH) {
    throw new Error(
      `Group name must not exceed ${MAX_GROUP_NAME_LENGTH} characters`
    );
  }

  // Add creator to participants
  const allParticipants = [creatorId, ...participantIds];

  // Remove duplicates
  const uniqueParticipants = [
    ...new Set(allParticipants.map((id) => id.toString())),
  ];

  // Validate participant count
  if (uniqueParticipants.length < 3) {
    throw new Error("Group must have at least 3 participants");
  }

  if (uniqueParticipants.length > MAX_GROUP_PARTICIPANTS) {
    throw new Error("Group cannot have more than 100 participants");
  }

  // Sort participants
  const sortedParticipants = uniqueParticipants.sort();

  // Initialize unread count for all participants
  const unreadCount = new Map();
  sortedParticipants.forEach((participantId) => {
    unreadCount.set(participantId, 0);
  });

  // Create group conversation
  const conversationData = {
    type: CONVERSATION_TYPES.GROUP,
    name: name.trim(),
    admin: creatorId,
    participants: sortedParticipants,
    unreadCount,
  };

  if (image) {
    conversationData.image = image;
  }

  const conversation = await this.create(conversationData);

  return conversation;
};

/**
 * Update unread count for a user in a conversation
 * @param {ObjectId} conversationId - Conversation ID
 * @param {ObjectId} userId - User ID
 * @param {Number} increment - Amount to increment (can be negative)
 * @returns {Promise<void>}
 */
conversationSchema.statics.updateUnreadCount = async function (
  conversationId,
  userId,
  increment
) {
  const conversation = await this.findById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const userIdStr = userId.toString();
  const currentCount = conversation.unreadCount.get(userIdStr) || 0;
  const newCount = Math.max(0, currentCount + increment);

  conversation.unreadCount.set(userIdStr, newCount);
  await conversation.save();
};

module.exports = mongoose.model("Conversation", conversationSchema);
