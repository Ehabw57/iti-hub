import { useCommunityFeed } from '@hooks/queries/useCommunity';
import { useIntlayer } from 'react-intlayer';
import communityContent from '@content/community/community.content';
import { PostCard } from '@/components/post/PostCard';
import useIntersectionObserver from '@hooks/useIntersectionObserver';

/**
 * CommunityFeed Component - Part 3
 * Displays chronological feed of posts from the community
 * Uses infinite scroll with Intersection Observer
 */
const CommunityFeed = ({ communityId }) => {
  const  content  = useIntlayer(communityContent.key);

  // Use custom hook for fetching community feed
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityFeed(communityId);

  // Flatten all pages into single posts array
  const posts = data?.pages?.flatMap(page => page.posts || []) || [];
  
  // Debug: Log data structure
  console.log('Community Feed Data:', { data, posts: posts.length });

  // Infinite scroll with Intersection Observer
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage,
  });

  if (isLoading) {
    return (
      <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-8">
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-8">
        <div className="text-center">
          <div className="text-error text-3xl mb-3">⚠️</div>
          <p className="text-body-2 text-neutral-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-neutral-100 rounded-lg shadow-elevation-2 p-8">
        <div className="text-center">
          <div className="text-neutral-400 text-5xl mb-4">📝</div>
          <h3 className="text-heading-5 text-neutral-900 mb-2">
            {content.noPosts}
          </h3>
          <p className="text-body-2 text-neutral-600">
            {content.beFirstToPost}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Posts List */}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
        />
      ))}

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div ref={observerTarget} className="flex justify-center py-6">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-neutral-600">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-body-2">{content.loading}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
