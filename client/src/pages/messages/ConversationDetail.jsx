import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@store/auth';

// Hooks
import { useMessages } from '@hooks/queries/useMessages';
import { useConversation } from '@hooks/queries/useConversation';
import { useSendMessage } from '@hooks/mutations/useSendMessage';
import { useMarkMessagesAsSeen } from '@hooks/mutations/useMarkMessagesAsSeen';
import { useMessagingSocket } from '@hooks/socket/useMessagingSocket';
import { useTypingSocket } from '@hooks/socket/useTypingSocket';
import { useTypingIndicator } from '@hooks/useTypingIndicator';

// Components
import ConversationHeader from '@components/messaging/ConversationHeader';
import MessageList from '@components/messaging/MessageList';
import MessageInput from '@components/messaging/MessageInput';
import TypingIndicator from '@components/messaging/TypingIndicator';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/common/ErrorDisplay';

/**
 * @fileoverview Conversation detail page
 * Displays messages and allows sending new messages
 */

export function ConversationDetail() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const content = useIntlayer('conversationDetail');
  const currentUser = useAuthStore((state) => state.user);

  const [messageInput, setMessageInput] = useState('');
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  
  // Track if we've already marked messages as seen for this conversation
  const markedAsSeenRef = useRef(null);

  // Fetch conversation
  const {
    data: conversationData,
    isLoading: conversationLoading,
    error: conversationError,
  } = useConversation(conversationId);

  // Fetch messages
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isLoading: messagesLoading,
    isFetchingNextPage,
    error: messagesError,
  } = useMessages(conversationId);

  // Send message mutation
  const sendMessage = useSendMessage();

  // Mark as seen mutation
  const markAsSeen = useMarkMessagesAsSeen();

  // Real-time updates
  useMessagingSocket(conversationId);

  // Typing indicators
  const { typingUsernames, isAnyoneTyping } = useTypingSocket(conversationId);
  const { handleTyping, stopTyping } = useTypingIndicator(
    conversationId,
    currentUser?._id
  );

  // Mark messages as seen when conversation opens (only once per conversation)
  useEffect(() => {
    if (conversationId && currentUser?._id && markedAsSeenRef.current !== conversationId) {
      markedAsSeenRef.current = conversationId;
      markAsSeen.mutate({ conversationId });
    }
  }, [conversationId, currentUser?._id]);

  // Handle send message - MEMOIZED
  const handleSend = useCallback(({ content, image }) => {
    if (!content && !image) return;

    sendMessage.mutate(
      {
        conversationId,
        content,
        image,
      },
      {
        onSuccess: () => {
          setMessageInput('');
          stopTyping();
        },
      }
    );
  }, [conversationId, sendMessage, stopTyping]);

  // Handle retry failed message - MEMOIZED
  const handleRetryMessage = useCallback((messageId) => {
    // TODO: Implement retry logic
    console.log('Retry message:', messageId);
  }, []);

  // Handle image click (open full view) - MEMOIZED
  const handleImageClick = useCallback((imageUrl) => {
    window.open(imageUrl, '_blank');
  }, []);

  // Extract data - MEMOIZED to prevent unnecessary re-renders
  const conversation = useMemo(() => conversationData?.data, [conversationData?.data]);
  const isGroup = useMemo(() => conversation?.isGroup, [conversation?.isGroup]);
  
  // Memoize messages to prevent re-reversing on every render (performance optimization)
  // Reverse messages to show oldest first (backend returns newest first)
  const messages = useMemo(() => {
    return messagesData?.pages
      .flatMap((page) => page.data.messages)
      .reverse() || [];
  }, [messagesData?.pages]);
  
  const participants = useMemo(() => conversation?.participants || [], [conversation?.participants]);

  // Loading state
  if (conversationLoading || (messagesLoading && messages.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading text={content.loadingMessages.value} />
      </div>
    );
  }

  // Error state
  if (conversationError || messagesError) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <ErrorDisplay
          error={{
            message: conversationError
              ? content.errorLoadingMessages.value
              : messagesError?.response?.data?.error?.message ||
                content.errorLoadingMessages.value,
          }}
          onRetry={() => navigate('/messages')}
        />
      </div>
    );
  }

  // No conversation found
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-heading-6 text-neutral-900 mb-4">
            Conversation not found
          </p>
          <button
            onClick={() => navigate('/messages')}
            className="text-secondary-600 hover:text-secondary-700"
          >
            {content.backToMessages.value}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=" flex flex-col h-full bg-white">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        participants={participants}
        currentUserId={currentUser?._id}
        onInfoClick={() => setShowGroupManagement(true)}
      />

      {/* Messages */}
      <MessageList
        items={messages}
        currentUserId={currentUser?._id}
        conversation={conversation}
        participants={participants}
        loading={messagesLoading}
        hasOlderMessages={hasNextPage}
        loadingOlder={isFetchingNextPage}
        onLoadOlder={fetchNextPage}
        onRetryMessage={handleRetryMessage}
        onImageClick={handleImageClick}
      />

      {/* Typing Indicator */}
      {isAnyoneTyping && (
        <TypingIndicator
          typingUsers={typingUsernames}
          isGroup={isGroup}
        />
      )}

      {/* Message Input */}
      <MessageInput
        value={messageInput}
        onChange={setMessageInput}
        onSend={handleSend}
        onTyping={handleTyping}
        sending={sendMessage.isPending}
        disabled={sendMessage.isPending}
      />

      {/* Group Management Modal (TODO: Implement) */}
      {showGroupManagement && (
        <div>Group Management Modal</div>
      )}
    </div>
  );
}

export default ConversationDetail;
