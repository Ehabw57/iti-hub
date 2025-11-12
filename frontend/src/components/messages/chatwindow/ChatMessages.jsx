import { useIntlayer } from 'react-intlayer';

/**
 * MessageBubble Component
 * Individual message bubble component
 * 
 * @param {Object} message - Message object with text, sender, timestamp, and isUser flag
 */
function MessageBubble({ message }) {
  return (
    <div
      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className="flex items-end gap-2 max-w-[70%]">
        {/* Avatar for received messages */}
        {!message.isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm shadow flex-shrink-0">
            👤
          </div>
        )}

        {/* Message content */}
        <div>
          <div
            className={`rounded-2xl px-4 py-2 shadow-sm ${
              message.isUser
                ? 'bg-pink-500 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
          <p className={`text-xs text-gray-500 mt-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp}
          </p>
        </div>

        {/* Avatar for sent messages */}
        {message.isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm shadow flex-shrink-0">
            👤
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ChatMessages Component
 * Container for displaying all messages in the conversation
 * 
 * @param {Array} messages - Array of message objects
 */
function ChatMessages({ messages }) {
  const content = useIntlayer('chat-messages');
  
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>{content.noMessages}</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
    </div>
  );
}

export default ChatMessages;
