import React from 'react';
import { 
  HiHeart, 
  HiOutlineHeart,
  HiChatBubbleOvalLeft,
  HiArrowPathRoundedSquare,
  HiArrowUpTray
} from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer'
import { InteractionButton } from '@/components/shared/InteractionButton';
import { RepostMenu } from './RepostMenu';

/**
 * PostInteractions - Complete interaction bar for posts with like, comment, repost, share
 * 
 * @component
 * @example
 * <PostInteractions
 *   likeCount={42}
 *   commentCount={12}
 *   repostCount={5}
 *   isLiked={true}
 *   isReposted={false}
 *   onLike={handleLike}
 *   onComment={handleComment}
 *   onRepost={handleRepost}
 *   onRepostWithComment={handleRepostWithComment}
 *   onShare={handleShare}
 * />
 * 
 * @param {Object} props
 * @param {number} [props.likeCount=0] - Number of likes
 * @param {number} [props.commentCount=0] - Number of comments
 * @param {number} [props.repostCount=0] - Number of reposts
 * @param {boolean} [props.isLiked=false] - Whether current user liked this post
 * @param {boolean} [props.isReposted=false] - Whether current user reposted this
 * @param {Function} props.onLike - Handler for like action
 * @param {Function} props.onComment - Handler for comment action
 * @param {Function} props.onRepost - Handler for instant repost
 * @param {Function} props.onRepostWithComment - Handler for repost with comment
 * @param {Function} props.onShare - Handler for share action
 * @param {string} [props.className] - Additional CSS classes
 */
export function PostInteractions({
  likeCount = 0,
  commentCount = 0,
  repostCount = 0,
  isLiked = false,
  isReposted = false,
  onLike,
  onComment,
  onRepost,
  onRepostWithComment,
  onShare,
  className = '',
}) {
  const content = useIntlayer('post-interactions');

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className='flex items-center gap-2'>
      {/* Like Button */}
      <InteractionButton
        icon={<HiOutlineHeart className="w-5 h-5" />}
        activeIcon={<HiHeart className="w-5 h-5 fill-current" />}
        count={likeCount}
        isActive={isLiked}
        onClick={onLike}
        label={content.like}
        activeColor="text-red-500"
      />

      {/* Comment Button */}
      <InteractionButton
        icon={<HiChatBubbleOvalLeft className="w-5 h-5" />}
        count={commentCount}
        onClick={onComment}
        label={content.comment}
      />

      {/* Repost Menu */}
      <RepostMenu
        repostCount={repostCount}
        isReposted={isReposted}
        onRepost={onRepost}
        onRepostWithComment={onRepostWithComment}
      />
      </div>

      {/* Share Button */}
      <InteractionButton
        icon={<HiArrowUpTray className="w-5 h-5" />}
        onClick={onShare}
        label={content.share}
      />
    </div>
  );
}
