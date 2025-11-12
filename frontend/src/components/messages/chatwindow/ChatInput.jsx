import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';

/**
 * ChatInput Component
 * Message input field with emoji, attachment, and send buttons
 */
function ChatInput() {
  const content = useIntlayer('chat-input');
  const [message, setMessage] = useState('');

  /**
   * Handle sending a message
   */
  const handleSend = () => {
    if (message.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  /**
   * Handle Enter key press to send message
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-white shadow-lg">
      <div className="flex items-center gap-2">
        {/* Emoji button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          aria-label={content.addEmoji}
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Attachment button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          aria-label={content.attachFile}
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        {/* Text input */}
        <input
          type="text"
          placeholder={content.placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={`p-3 rounded-full transition-colors flex-shrink-0 ${
            message.trim()
              ? 'bg-pink-500 hover:bg-pink-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-label={content.sendMessage}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
