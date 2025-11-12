import { useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import ConversationList from './ConversationList';

/**
 * Sidebar Component
 * Main sidebar container with header, search bar, and conversation list
 * 
 * @param {Array} conversations - Array of conversation objects
 * @param {number} selectedChatId - ID of the currently selected chat
 * @param {Function} onSelectChat - Callback when a conversation is selected
 */
function Sidebar({ conversations, selectedChatId, onSelectChat }) {
  const content = useIntlayer('sidebar');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with avatar and title */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-md">
            👤
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={content.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Conversation list */}
      <ConversationList
        conversations={filteredConversations}
        selectedChatId={selectedChatId}
        onSelectChat={onSelectChat}
      />
    </div>
  );
}

export default Sidebar;
