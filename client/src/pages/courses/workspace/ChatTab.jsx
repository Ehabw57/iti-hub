import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { HiOutlineTrash } from 'react-icons/hi2';
import { useTrackChat } from '@hooks/queries/useCourse';
import {
  useSendTrackChatMessage,
  useDeleteTrackChatMessage,
} from '@hooks/mutations/useCourseMutations';
import { useSocketEvent } from '@hooks/socket/useSocketEvent';
import { Loading } from '@components/common';

/**
 * Chat tab — the track chat room. Messages load via the REST list endpoint
 * and stay live through the `track:chat:*` socket events, exactly like the
 * server's trackChatController broadcasts.
 */
export default function ChatTab({ trackId, currentUserId, t }) {
  const { data, isLoading, refetch } = useTrackChat(trackId);
  const sendMutation = useSendTrackChatMessage();
  const deleteMutation = useDeleteTrackChatMessage();

  const [draft, setDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState([]);
  const bottomRef = useRef(null);

  const messages = useMemo(() => {
    const base = data?.data?.data?.messages ?? [];
    if (liveMessages.length === 0) return base;
    const seen = new Set(base.map((m) => String(m._id)));
    return [...base, ...liveMessages.filter((m) => !seen.has(String(m._id)))];
  }, [data, liveMessages]);

  // Real-time: new message broadcast
  useSocketEvent(
    'track:chat:message',
    (payload) => {
      if (payload?.trackId === trackId) {
        setLiveMessages((prev) =>
          prev.some((m) => String(m._id) === String(payload.message?._id))
            ? prev
            : [...prev, payload.message]
        );
      }
    },
    [trackId]
  );

  // Real-time: message deleted broadcast
  useSocketEvent(
    'track:chat:deleted',
    (payload) => {
      if (payload?.trackId === trackId) {
        setLiveMessages((prev) =>
          prev.filter((m) => String(m._id) !== String(payload.messageId))
        );
        refetch();
      }
    },
    [trackId, refetch]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    try {
      await sendMutation.mutateAsync({ trackId, content });
    } catch {
      toast.error(t('chatSend', 'Failed to send'));
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMutation.mutateAsync({ messageId });
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-surface-lowest border border-outline rounded-xl shadow-elevation-1 flex flex-col flex-1 min-h-0">
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onDelete={handleDelete}
        t={t}
        bottomRef={bottomRef}
      />
      <Composer
        draft={draft}
        setDraft={setDraft}
        onSubmit={handleSend}
        pending={sendMutation.isPending}
        t={t}
      />
    </div>
  );
}

function MessageList({ messages, currentUserId, onDelete, t, bottomRef }) {
  return (
    <div className="flex flex-col gap-3 p-4 flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {messages.length === 0 && (
        <p className="text-body-2 text-neutral-500 text-center py-8">
          {t('chatEmpty', 'No messages yet — start the conversation.')}
        </p>
      )}
      {messages.map((message) => {
        const sender = message.senderId || {};
        const isMine = String(sender._id || sender) === String(currentUserId);
        return (
          <div key={message._id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
            <img
              src={
                sender.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  sender.fullName || sender.username || '?'
                )}&background=random`
              }
              alt={sender.fullName || sender.username}
              className="w-8 h-8 rounded-full shrink-0 object-cover"
            />
            <div
              className={`group max-w-[80%] rounded-2xl px-3.5 py-2 ${
                isMine
                  ? 'bg-primary-600 text-white rounded-tr-sm'
                  : 'bg-surface-high text-neutral-900 rounded-tl-sm'
              }`}
            >
              {!isMine && (
                <p className="text-caption font-semibold text-neutral-500 mb-0.5">
                  {sender.fullName || sender.username}
                </p>
              )}
              <p className="text-body-2 break-words whitespace-pre-wrap">{message.message}</p>
              <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-start' : 'justify-end'}`}>
                <span className={`text-caption ${isMine ? 'text-white/60' : 'text-neutral-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {isMine && (
                  <button
                    type="button"
                    onClick={() => onDelete(message._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5 text-white/70" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function Composer({ draft, setDraft, onSubmit, pending, t }) {
  return (
    <form onSubmit={onSubmit} className="border-t border-outline p-3 flex items-center gap-2 shrink-0">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t('chatPlaceholder', 'Message the track...')}
        maxLength={4000}
        className="flex-1 h-10 px-3 rounded-xl border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
      />
      <button
        type="submit"
        disabled={!draft.trim() || pending}
        className="px-5 h-10 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('chatSend', 'Send')}
      </button>
    </form>
  );
}