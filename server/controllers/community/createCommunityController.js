const Community = require('../../models/Community');
const CommunityMember = require('../../models/CommunityMember');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { processImage } = require('../../utils/imageProcessor');
const {
  COMMUNITY_TAGS,
  MIN_COMMUNITY_TAGS,
  MAX_COMMUNITY_TAGS,
  COMMUNITY_PROFILE_PICTURE_SIZE,
  COMMUNITY_COVER_IMAGE_SIZE,
  CLOUDINARY_FOLDER_COMMUNITY_PROFILE,
  CLOUDINARY_FOLDER_COMMUNITY_COVER
} = require('../../utils/constants');

/**
 * Create a new community
 * POST /communities
 * @route POST /communities
 * @access Private
 */
async function createCommunity(req, res) {
  try {
    const { name, description } = req.body;
    let { tags } = req.body;
    const userId = req.user._id;

    // Parse tags if it's a JSON string (from multipart/form-data)
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tags format'
        });
      }
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Community name is required'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Community description is required'
      });
    }

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Community tags are required'
      });
    }

    // Validate tags length
    if (tags.length < MIN_COMMUNITY_TAGS || tags.length > MAX_COMMUNITY_TAGS) {
      return res.status(400).json({
        success: false,
        message: `Community must have between ${MIN_COMMUNITY_TAGS} and ${MAX_COMMUNITY_TAGS} tags`
      });
    }

    // Validate tags are from predefined list
    const invalidTags = tags.filter(tag => !COMMUNITY_TAGS.includes(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid tags: ${invalidTags.join(', ')}. Tags must be from predefined list.`
      });
    }

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: 'A community with this name already exists'
      });
    }

    // Process images if uploaded
    let profilePictureUrl = null;
    let coverImageUrl = null;

    if (req.files && req.files.profilePicture && req.files.profilePicture[0]) {
      try {
        const processedImage = await processImage(
          req.files.profilePicture[0].buffer,
          COMMUNITY_PROFILE_PICTURE_SIZE
        );
        
        const uploadResult = await uploadToCloudinary(
          processedImage,
          CLOUDINARY_FOLDER_COMMUNITY_PROFILE
        );
        
        profilePictureUrl = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process profile picture'
        });
      }
    }

    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      try {
        const processedImage = await processImage(
          req.files.coverImage[0].buffer,
          COMMUNITY_COVER_IMAGE_SIZE
        );
        
        const uploadResult = await uploadToCloudinary(
          processedImage,
          CLOUDINARY_FOLDER_COMMUNITY_COVER
        );
        
        coverImageUrl = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process cover image'
        });
      }
    }

    // Create community
    const community = await Community.create({
      name: name.trim(),
      description: description.trim(),
      tags,
      profilePicture: profilePictureUrl,
      coverImage: coverImageUrl,
      owners: [userId],
      moderators: [userId],
      memberCount: 1, // Creator is the first member
      postCount: 0
    });

    // Create membership for creator
    await CommunityMember.create({
      user: userId,
      community: community._id,
      role: 'owner'
    });

    return res.status(201).json({
      success: true,
      message: 'Community created successfully',
      data: {
        community: {
          _id: community._id,
          name: community.name,
          description: community.description,
          profilePicture: community.profilePicture,
          coverImage: community.coverImage,
          tags: community.tags,
          memberCount: community.memberCount,
          postCount: community.postCount,
          owners: community.owners.map(id => id.toString()),
          moderators: community.moderators.map(id => id.toString()),
          createdAt: community.createdAt,
          updatedAt: community.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating community:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the community'
    });
  }
}

module.exports = createCommunity;
