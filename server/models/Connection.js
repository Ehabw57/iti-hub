const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Connection Model
 * Represents relationships between users (follow, block)
 */
const connectionSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['follow', 'block'],
      required: true,
      default: 'follow'
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
connectionSchema.index({ follower: 1, following: 1, type: 1 }, { unique: true });
connectionSchema.index({ following: 1, type: 1 });
connectionSchema.index({ follower: 1, type: 1 });
connectionSchema.index({ createdAt: -1 });

/**
 * Static Method: Create follow relationship
 * @param {ObjectId} followerId - User who follows
 * @param {ObjectId} followingId - User who is followed
 * @returns {Promise<Connection>} The created connection
 */
connectionSchema.statics.createFollow = async function(followerId, followingId) {
  const User = mongoose.model('User');
  
  // Prevent following yourself
  if (followerId.toString() === followingId.toString()) {
    throw new Error('Cannot follow yourself');
  }

  // Check if already following
  const existingFollow = await this.findOne({
    follower: followerId,
    following: followingId,
    type: 'follow'
  });

  if (existingFollow) {
    throw new Error('Already following this user');
  }

  // Create follow connection
  const connection = await this.create({
    follower: followerId,
    following: followingId,
    type: 'follow'
  });

  // Update denormalized counts
  await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

  return connection;
};

/**
 * Static Method: Remove follow relationship
 * @param {ObjectId} followerId - User who follows
 * @param {ObjectId} followingId - User who is followed
 * @returns {Promise<boolean>} True if removed, false if didn't exist
 */
connectionSchema.statics.removeFollow = async function(followerId, followingId) {
  const User = mongoose.model('User');
  
  const result = await this.deleteOne({
    follower: followerId,
    following: followingId,
    type: 'follow'
  });

  if (result.deletedCount > 0) {
    // Update denormalized counts
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
    return true;
  }

  return false;
};

/**
 * Static Method: Create block relationship
 * @param {ObjectId} blockerId - User who blocks
 * @param {ObjectId} blockedId - User who is blocked
 * @returns {Promise<Connection>} The created block connection
 */
connectionSchema.statics.createBlock = async function(blockerId, blockedId) {
  const User = mongoose.model('User');
  
  // Prevent blocking yourself
  if (blockerId.toString() === blockedId.toString()) {
    throw new Error('Cannot block yourself');
  }

  // Check for existing follow relationships BEFORE deleting
  const wasFollowing = await this.findOne({
    follower: blockerId,
    following: blockedId,
    type: 'follow'
  });
  
  const wasFollowingBack = await this.findOne({
    follower: blockedId,
    following: blockerId,
    type: 'follow'
  });

  // Remove any existing follow relationships in both directions
  await this.deleteMany({
    $or: [
      { follower: blockerId, following: blockedId, type: 'follow' },
      { follower: blockedId, following: blockerId, type: 'follow' }
    ]
  });

  // Update counts for removed follows
  if (wasFollowing) {
    await User.findByIdAndUpdate(blockerId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(blockedId, { $inc: { followersCount: -1 } });
  }

  if (wasFollowingBack) {
    await User.findByIdAndUpdate(blockedId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(blockerId, { $inc: { followersCount: -1 } });
  }

  // Create block connection
  const connection = await this.create({
    follower: blockerId,
    following: blockedId,
    type: 'block'
  });

  return connection;
};

/**
 * Static Method: Remove block relationship
 * @param {ObjectId} blockerId - User who blocks
 * @param {ObjectId} blockedId - User who is blocked
 * @returns {Promise<boolean>} True if removed, false if didn't exist
 */
connectionSchema.statics.removeBlock = async function(blockerId, blockedId) {
  const result = await this.deleteOne({
    follower: blockerId,
    following: blockedId,
    type: 'block'
  });

  return result.deletedCount > 0;
};

/**
 * Static Method: Check if user is following another user
 * @param {ObjectId} followerId - User who might be following
 * @param {ObjectId} followingId - User who might be followed
 * @returns {Promise<boolean>} True if following, false otherwise
 */
connectionSchema.statics.isFollowing = async function(followerId, followingId) {
  const connection = await this.findOne({
    follower: followerId,
    following: followingId,
    type: 'follow'
  });

  return !!connection;
};

/**
 * Static Method: Check if user is blocking another user
 * @param {ObjectId} blockerId - User who might be blocking
 * @param {ObjectId} blockedId - User who might be blocked
 * @returns {Promise<boolean>} True if blocking, false otherwise
 */
connectionSchema.statics.isBlocking = async function(blockerId, blockedId) {
  const connection = await this.findOne({
    follower: blockerId,
    following: blockedId,
    type: 'block'
  });

  return !!connection;
};

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
