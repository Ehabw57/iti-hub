import { useIntlayer } from 'react-intlayer';
import ConversationItem from './ConversationItem';

/**
 * ConversationList Component
 * Renders a list of all conversations
 * 
 * @param {Array} conversations - Array of conversation objects
 * @param {number} selectedChatId - ID of the currently selected chat
 * @param {Function} onSelectChat - Callback when a conversation is selected
 */
function ConversationList({ conversations, selectedChatId, onSelectChat }) {
  const content = useIntlayer('sidebar');
  
  return (
    <div className="overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-gray-400">
          <p>{content.noConversations}</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === selectedChatId}
            onClick={() => onSelectChat(conversation.id)}
          />
        ))
      )}
    </div>
  );
}

export default ConversationList;
