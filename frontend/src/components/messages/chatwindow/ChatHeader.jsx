import { useIntlayer } from 'react-intlayer';

/**
 * ChatHeader Component
 * Top section of chat window with contact info and action buttons
 * 
 * @param {Object} conversation - The current conversation data
 * @param {Function} onBack - Callback for back button (mobile only)
 */
function ChatHeader({ conversation, onBack }) {
  const content = useIntlayer('chat-header');
  
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b border-gray-200 bg-white shadow-sm">
      {/* Back button - Only visible on mobile */}
      <button
        onClick={onBack}
        className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={content.backButton}
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Contact avatar and info */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-lg shadow-md">
          {conversation.avatar}
        </div>
        {conversation.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      <div className="flex-1">
        <h2 className="font-semibold text-gray-900">{conversation.name}</h2>
        <p className="text-xs text-green-500">
          {conversation.online ? content.online : content.offline}
        </p>
      </div>

      {/* Action buttons - Video, Voice, More */}
      <div className="flex gap-2">
        {/* Video call button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={content.videoCall}
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Voice call button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={content.voiceCall}
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
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </button>

        {/* More options button */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={content.moreOptions}
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
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
