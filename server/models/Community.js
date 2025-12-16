const mongoose = require('mongoose');
const { COMMUNITY_TAGS, MIN_COMMUNITY_TAGS, MAX_COMMUNITY_TAGS } = require('../utils/constants');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    minlength: [2, 'Community name must be at least 2 characters'],
    maxlength: [100, 'Community name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Community description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  profilePicture: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  tags: {
    type: [String],
    required: [true, 'At least one tag is required'],
    validate: {
      validator: function(tags) {
        // Check array length
        if (tags.length < MIN_COMMUNITY_TAGS || tags.length > MAX_COMMUNITY_TAGS) {
          return false;
        }
        // Check all tags are valid
        return tags.every(tag => COMMUNITY_TAGS.includes(tag));
      },
      message: props => `Tags must be between ${MIN_COMMUNITY_TAGS} and ${MAX_COMMUNITY_TAGS}, and must be from predefined list`
    }
  },
  memberCount: {
    type: Number,
    default: 0,
    min: [0, 'Member count cannot be negative']
  },
  postCount: {
    type: Number,
    default: 0,
    min: [0, 'Post count cannot be negative']
  },
  owners: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    required: true,
    validate: {
      validator: function(owners) {
        return owners && owners.length > 0;
      },
      message: 'Community must have at least one owner'
    }
  },
  moderators: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: []
  }
}, { 
  timestamps: true 
});

// Indexes for performance
communitySchema.index({ name: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 } // Case-insensitive unique
});
communitySchema.index({ memberCount: -1 }); // For sorting by popularity
communitySchema.index({ createdAt: -1 }); // For sorting by newest
communitySchema.index({ tags: 1 }); // For filtering by tags

// Text index for search functionality (Epic 9)
communitySchema.index(
  { 
    name: 'text', 
    description: 'text',
    tags: 'text'
  },
  {
    weights: {
      name: 10,        // Name highest priority
      tags: 5,         // Tags medium priority
      description: 1   // Description lowest priority
    },
    name: 'community_search_index'
  }
);

// Virtual method to check if a user is an owner
communitySchema.methods.isOwner = function(userId) {
  return this.owners.some(ownerId => ownerId.toString() === userId.toString());
};

// Virtual method to check if a user is a moderator (owners are also moderators)
communitySchema.methods.isModerator = function(userId) {
  const userIdString = userId.toString();
  return this.owners.some(ownerId => ownerId.toString() === userIdString) ||
         this.moderators.some(modId => modId.toString() === userIdString);
};

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
