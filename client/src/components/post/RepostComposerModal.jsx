import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiXMark } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import useRepost from '@hooks/mutations/useRepost';
import CommunitySelector from './CommunitySelector';
import repostContent from '@/content/post/repost.content';
import { sanitizeContent } from '@/utils/sanitizeContent';

/**
 * Repost composer modal for reposting with optional comment
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.originalPost - Original post to repost
 */
export default function RepostComposerModal({ isOpen, onClose, originalPost }) {
  const content = useIntlayer(repostContent.key);
  const [repostComment, setRepostComment] = useState('');
  const [communityId, setCommunityId] = useState(null);

  const repost = useRepost();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Sanitize comment
    const sanitized = sanitizeContent(repostComment);

    // Validation
    if (sanitized && sanitized.length > 5000) {
      toast.error(content.commentTooLong);
      return;
    }

    // Prepare repost data
    const repostData = {
      postId: originalPost._id,
      comment: sanitized || null,
      communityId: communityId || null,
    };

    repost.mutate(repostData, {
      onSuccess: () => {
        toast.success(content.repostSuccess);
        handleClose();
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.error?.message || content.repostFailed;
        toast.error(errorMessage);
      },
    });
  };

  const handleClose = () => {
    if (repost.isPending) return;
    
    // Reset form
    setRepostComment('');
    setCommunityId(null);
    
    onClose();
  };

  if (!originalPost) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl bg-neutral-200 rounded-lg shadow-elevation-3 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <DialogTitle className="text-heading-4 font-semibold text-neutral-900">
              {content.repost}
            </DialogTitle>
            <button
              onClick={handleClose}
              disabled={repost.isPending}
              className="p-1 rounded-full hover:bg-neutral-100 transition-colors disabled:opacity-50"
              aria-label={content.cancel}
            >
              <HiXMark className="w-6 h-6 text-neutral-600" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Optional comment textarea */}
            <div>
              <label className="block text-body-2 font-medium text-neutral-700 mb-2">
                {content.addACommentOptional}
              </label>
              <textarea
                value={repostComment}
                onChange={(e) => setRepostComment(e.target.value)}
                placeholder={content.writeYourThoughts}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                rows={3}
                maxLength={5000}
              />
              <div className="text-caption text-neutral-500 mt-1 text-end">
                {repostComment.length} / 5000
              </div>
            </div>

            {/* Community selector */}
            <CommunitySelector
              value={communityId}
              onChange={setCommunityId}
            />

            {/* Original post preview */}
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <div className="flex items-start gap-3">
                <img 
                  src={originalPost.author.profilePicture || '/default-avatar.png'}
                  alt={originalPost.author.fullName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900">
                      {originalPost.author.fullName}
                    </span>
                    <span className="text-body-2 text-neutral-600">
                      @{originalPost.author.username}
                    </span>
                  </div>
                  
                  {originalPost.content && (
                    <p className="text-neutral-900 mt-2 whitespace-pre-wrap line-clamp-6">
                      {originalPost.content}
                    </p>
                  )}
                  
                  {originalPost.images && originalPost.images.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {originalPost.images.slice(0, 4).map((img, idx) => (
                        <img 
                          key={idx}
                          src={img}
                          alt=""
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  
                  {originalPost.tags && originalPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {originalPost.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-primary-100 text-primary-600 text-caption rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {originalPost.tags.length > 3 && (
                        <span className="text-caption text-neutral-500">
                          +{originalPost.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={repost.isPending}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {content.cancel}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={repost.isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {repost.isPending ? content.reposting : content.repost}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
