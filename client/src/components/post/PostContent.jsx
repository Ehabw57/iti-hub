import React from 'react';
import { CommunityBadge } from '@/components/community/CommunityBadge';
import { TextContent } from '@/components/shared/TextContent';
import ImageCarousel from '@/components/shared/ImageCarousel';
import { TagList } from '@/components/shared/TagList';

/**
 * PostContent - Composes all content display components for a post
 * 
 * @component
 * @example
 * <PostContent
 *   community={post.community}
 *   content={post.content}
 *   images={post.images}
 *   tags={post.tags}
 *   onCommunityClick={handleCommunityClick}
 * />
 * 
 * @param {Object} props
 * @param {Object} [props.community] - Community object if community post
 * @param {string} [props.content] - Post text content
 * @param {Array} [props.images] - Array of image URLs
 * @param {Array} [props.tags] - Array of tag strings
 * @param {Function} [props.onCommunityClick] - Handler for community badge click
 * @param {number} [props.maxWords=10] - Maximum words before truncation
 * @param {number} [props.maxVisibleTags=5] - Maximum visible tags
 * @param {string} [props.className] - Additional CSS classes
 */
export function PostContent({
  community,
  content,
  images,
  tags,
  onCommunityClick,
  maxWords = 13,
  maxVisibleTags = 5,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Community Badge */}
      {community && (
        <CommunityBadge
          community={community}
          onClick={onCommunityClick}
        />
      )}

      {/* Text Content */}
      {content && (
        <TextContent
          content={content}
          maxWords={maxWords}
        />
      )}

      {/* Image Carousel */}
      {images && images.length > 0 && (
        <ImageCarousel images={images} />
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <TagList
          tags={tags}
          maxVisible={maxVisibleTags}
        />
      )}
    </div>
  );
}
