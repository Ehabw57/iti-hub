// Message controller exports
const { getMessages } = require('./getMessagesController');
const { sendMessage } = require('./sendMessageController');

module.exports = {
  getMessages,
  sendMessage
};
