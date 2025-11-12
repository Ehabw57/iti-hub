/**
 * ConversationItem Component
 * Displays a single conversation preview with avatar, name, last message, and timestamp
 * 
 * @param {Object} conversation - The conversation data
 * @param {boolean} isActive - Whether this conversation is currently selected
 * @param {Function} onClick - Callback when the conversation is clicked
 */
function ConversationItem({ conversation, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        isActive ? 'bg-pink-50 border-l-4 border-pink-500' : ''
      }`}
    >
      {/* Avatar with online status indicator */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl shadow-md">
          {conversation.avatar}
        </div>
        {/* Online status indicator */}
        {conversation.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Chat info - name, timestamp, and last message */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold text-gray-900 truncate">
            {conversation.name}
          </h3>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {conversation.timestamp}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate mt-1">
          {conversation.lastMessage}
        </p>
      </div>
    </div>
  );
}

export default ConversationItem;
