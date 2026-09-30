import { HiOutlinePhoto, HiOutlineCalendarDays, HiOutlineDocumentText } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import homeContent from '@/content/feed/home.content';
import { UserAvatar } from '../user/UserAvatar';

/**
 * PostComposerTrigger — inline "Start a post..." card at the top of the feed.
 * Matches /screens: avatar + pill input + Media / Event / Article actions.
 */
export default function PostComposerTrigger({ onCreatePost, className = '' }) {
  const content = useIntlayer(homeContent.key);
  const user = useAuthStore((state) => state.user);

  return (
    <div
      className={`bg-neutral-100 border border-outline rounded-2xl p-4 shadow-elevation-1 ${className}`}
    >
      <div className="flex items-center gap-3">
        <UserAvatar src={user?.profilePicture} alt={user?.fullName} size="md" />
        <button
          type="button"
          onClick={onCreatePost}
          className="flex-1 h-11 px-5 rounded-full bg-surface border border-outline text-start text-body-2 text-neutral-500 hover:bg-surface-high transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          {content.startPost?.value || 'Start a post...'}
        </button>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline">
        <button
          type="button"
          onClick={onCreatePost}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-body-2 font-medium text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <HiOutlinePhoto className="w-5 h-5" strokeWidth={1.7} />
          <span>{content.photoVideo?.value || 'Media'}</span>
        </button>
        <button
          type="button"
          onClick={onCreatePost}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-body-2 font-medium text-secondary-700 hover:bg-secondary-50 transition-colors"
        >
          <HiOutlineCalendarDays className="w-5 h-5" strokeWidth={1.7} />
          <span>{content.event?.value || 'Event'}</span>
        </button>
        <button
          type="button"
          onClick={onCreatePost}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-body-2 font-medium text-neutral-600 hover:bg-neutral-200/60 transition-colors"
        >
          <HiOutlineDocumentText className="w-5 h-5" strokeWidth={1.7} />
          <span>{content.article?.value || 'Article'}</span>
        </button>
      </div>
    </div>
  );
}
