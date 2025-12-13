const Connection = require('../../models/Connection');
const { validateConnectionAction } = require('../../utils/connectionHelpers');

/**
 * Block User
 * POST /users/:userId/block
 * 
 * Allows authenticated users to block another user
 * Blocking automatically removes any follow relationships in both directions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function blockUser(req, res) {
  try {
    const requesterId = req.user._id;
    const targetId = req.params.userId;
    
    // Validate the block action
    const validation = await validateConnectionAction(requesterId, targetId, 'block');
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // Create block connection (this also removes follow relationships)
    const connection = await Connection.createBlock(requesterId, targetId);
    
    return res.status(200).json({
      success: true,
      message: 'Successfully blocked user',
      data: {
        blockedUserId: targetId,
        blockedAt: connection.createdAt
      }
    });
  } catch (error) {
    console.error('Error in blockUser:', error);
    
    // Handle specific known errors
    if (error.message === 'Cannot block yourself' || 
        error.message === 'Already blocking this user') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Unblock User
 * DELETE /users/:userId/block
 * 
 * Allows authenticated users to unblock another user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function unblockUser(req, res) {
  try {
    const requesterId = req.user._id;
    const targetId = req.params.userId;
    
    // Validate the unblock action
    const validation = await validateConnectionAction(requesterId, targetId, 'unblock');
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // Remove block connection
    const removed = await Connection.removeBlock(requesterId, targetId);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Block relationship not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Successfully unblocked user',
      data: {
        unblockedUserId: targetId
      }
    });
  } catch (error) {
    console.error('Error in unblockUser:', error);
    
    if (error.message === 'Cannot unblock yourself' || 
        error.message === 'Not blocking this user') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  blockUser,
  unblockUser
};
