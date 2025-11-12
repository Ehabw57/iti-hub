import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

/**
 * ChatWindow Component
 * Main chat window container that combines header, messages, and input
 * 
 * @param {Object} conversation - The current conversation data
 * @param {Array} messages - Array of message objects for this conversation
 * @param {Function} onBack - Callback for back button (mobile only)
 */
function ChatWindow({ conversation, messages, onBack }) {
  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader conversation={conversation} onBack={onBack} />
      <ChatMessages messages={messages} />
      <ChatInput />
    </div>
  );
}

export default ChatWindow;
