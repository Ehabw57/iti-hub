const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: [true, 'Community is required']
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'owner'],
    default: 'member'
  }
}, { 
  timestamps: true 
});

// Compound unique index to prevent duplicate enrollments
communityMemberSchema.index({ user: 1, community: 1 }, { unique: true });

// Index for getting community members
communityMemberSchema.index({ community: 1 });

// Index for getting user's communities
communityMemberSchema.index({ user: 1 });

// Static method to check if a user is enrolled in a community
communityMemberSchema.statics.isEnrolled = async function(userId, communityId) {
  const enrollment = await this.findOne({ user: userId, community: communityId });
  return !!enrollment;
};

// Static method to get user's role in a community
communityMemberSchema.statics.getRole = async function(userId, communityId) {
  const enrollment = await this.findOne({ user: userId, community: communityId });
  return enrollment ? enrollment.role : null;
};

const CommunityMember = mongoose.model('CommunityMember', communityMemberSchema);

module.exports = CommunityMember;
