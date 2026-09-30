// Conversation controller exports
const { getConversations } = require('./getConversationsController');
const { getConversation } = require('./getConversationController');
const { createConversation } = require('./createConversationController');
const { createGroupConversation } = require('./createGroupConversationController');
const { addGroupMember } = require('./addGroupMemberController');
const { removeGroupMember } = require('./removeGroupMemberController');
const { leaveGroup } = require('./leaveGroupController');
const { updateGroup } = require('./updateGroupController');
const { deleteGroup } = require('./deleteGroupController');
const { markConversationAsSeen } = require('./markAsSeenController');
const { getUnreadMessagesCount } = require('./getUnreadMessagesCountController');

module.exports = {
  getConversations,
  getConversation,
  createConversation,
  createGroupConversation,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  updateGroup,
  deleteGroup,
  markConversationAsSeen,
  getUnreadMessagesCount
};
