import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';

// Hooks
import { useConversations } from '@hooks/queries/useConversations';
import  useMessagingSocket  from '@hooks/socket/useMessagingSocket';

// Components
import ConversationsList from '@components/messaging/ConversationsList';
import NewMessageModal from '@components/messaging/NewMessageModal';
import NewGroupModal from '@components/messaging/NewGroupModal';
import Button from '@components/common/Button';
import { HiOutlinePencilSquare, HiOutlineUserGroup } from 'react-icons/hi2';

/**
 * @fileoverview Messages list page
 * Shows all conversations with search and create actions
 */

export function MessagesList() {
  const navigate = useNavigate();
  const content = useIntlayer('messagesList');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useConversations({ page: 1, limit: 50 });

  // Setup real-time updates
  useMessagingSocket();

  // Extract conversations
  const conversations = conversationsData?.data?.conversations || [];

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    
    // Search by conversation name
    if (conv.name && conv.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search by participant names
    if (conv.participants) {
      return conv.participants.some(
        (p) =>
          p.username?.toLowerCase().includes(query) ||
          p.fullName?.toLowerCase().includes(query)
      );
    }

    return false;
  });

  // Handle conversation click
  const handleConversationOpen = (conversationId) => {
    navigate(`/messages/${conversationId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-3 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-heading-4 font-bold text-neutral-900">
            {content.pageTitle.value}
          </h1>

          <div className="flex items-center gap-2">
            {/* New Message Button */}
            <Button
              variant="text"
              onClick={() => setShowNewMessageModal(true)}
              className="gap-2"
              aria-label={content.newMessage.value}
            >
              <HiOutlinePencilSquare className="w-5 h-5" />
              <span className="hidden sm:inline">{content.newMessage.value}</span>
            </Button>

            {/* New Group Button */}
            <Button
              variant="primary"
              onClick={() => setShowNewGroupModal(true)}
              className="gap-2"
              aria-label={content.newGroup.value}
            >
              <HiOutlineUserGroup className="w-5 h-5" />
              <span className="hidden sm:inline">{content.newGroup.value}</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={content.searchPlaceholder.value}
            className="
              w-full px-4 py-2
              bg-neutral-100
              border border-transparent
              rounded-xl
              text-body-2
              placeholder:text-neutral-500
              focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:bg-white
              transition-colors
            "
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <ConversationsList
          items={filteredConversations}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          onConversationOpen={handleConversationOpen}
        />
      </div>

      {/* Modals */}
      {showNewMessageModal && (
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={() => setShowNewMessageModal(false)}
        />
      )}
      {showNewGroupModal && (
        <NewGroupModal
          isOpen={showNewGroupModal}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}
    </div>
  );
}

export default MessagesList;
