import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import usePost from '@hooks/queries/usePost';
import useFeedHome from '@hooks/queries/useFeedHome';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { PostCard } from '@/components/post/PostCard';
import FeedPostSkeleton from '@components/feed/FeedPostSkeleton';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Post detail controller - shows a featured post with comments auto-expanded,
 * followed by the regular home feed
 * 
 * Features:
 * - Auto-expand comments when navigating from notifications
 * - Scroll to specific comment when hash is present (e.g., #comment-123)
 * - Show fallback error for 404 posts
 */
export default function PostDetailController() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { content } = useIntlayer('feedHome');

  // Fetch the featured post
  const { 
    data: featuredPost, 
    isLoading: isLoadingPost, 
    isError: isErrorPost,
    error: errorPost 
  } = usePost(postId);

  // Fetch the regular home feed
  const { 
    data: feedData, 
    fetchNextPage, 
    hasNextPage, 
    isLoading: isLoadingFeed,
    isFetchingNextPage 
  } = useFeedHome();

  const [expandedComments, setExpandedComments] = useState({ [postId]: true });


  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage
  });

  // Handle comment navigation from notifications (e.g., #comment-123)
  useEffect(() => {
    if (!featuredPost || !location.hash) return;

    // Extract comment ID from hash
    const commentId = location.hash.replace('#comment-', '');
    if (!commentId) return;

    // Auto-expand comments when navigating from notification
    if (!expandedComments[postId]) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: true
      }));
        console.log('expanding comments for post', postId);
    }

    // Scroll to the comment after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const commentElement = document.getElementById(`comment-${commentId}`);
      console.log('scrolling to comment element', commentElement);
      if (commentElement) {
        commentElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a highlight effect
        commentElement.classList.add('highlight-comment');
        setTimeout(() => {
          commentElement.classList.remove('highlight-comment');
        }, 2000);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [featuredPost, location.hash, postId, expandedComments]);


  // Filter out the featured post from feed
  const feedPosts = feedData?.pages.flatMap(page => 
    page.data.posts.filter(post => post._id !== postId)
  ) ?? [];

  if (isLoadingPost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <FeedPostSkeleton />
      </div>
    );
  }

  if (isErrorPost) {
    const is404 = errorPost?.response?.status === 404;
    const errorMessage = errorPost?.response?.data?.error?.message || 
                        (is404 ? 'Post not found' : 'Failed to load post');
    
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          <div className="mb-4">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-neutral-100)' }}
            >
              <svg 
                className="w-8 h-8" 
                style={{ color: 'var(--color-neutral-500)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
          
          <h2 className="text-heading-4 text-neutral-900 mb-2">
            {is404 ? 'Post Not Found' : 'Unable to Load Post'}
          </h2>
          
          <p className="text-body-2 text-neutral-600 mb-6">
            {is404 
              ? 'This post may have been deleted or the link is incorrect.' 
              : errorMessage
            }
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--color-neutral-300)',
                color: 'var(--color-neutral-700)'
              }}
            >
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg transition-colors text-white"
              style={{
                backgroundColor: 'var(--color-primary-500)'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Featured post with comments auto-expanded */}
      {featuredPost && (
        <div className="mb-6">
          <PostCard
            post={featuredPost}
            isCommentsExpanded={expandedComments[featuredPost._id]}
          />
        </div>
      )}

      {/* Divider */}
      {featuredPost && feedPosts.length > 0 && (
        <div className="border-t-2 border-neutral-200 mb-6 pt-6">
          <h2 className="text-heading-5 text-neutral-700 mb-4">More from your feed</h2>
        </div>
      )}

      {/* Regular feed (excluding featured post) */}
      {isLoadingFeed && feedPosts.length === 0 && (
        <>
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </>
      )}

      {feedPosts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          isCommentsExpanded={expandedComments[post._id]}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
