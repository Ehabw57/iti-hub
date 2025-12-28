import { useIntlayer } from 'react-intlayer';
import useSavedPosts from '@hooks/queries/useSavedPosts';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { PostCard } from '@components/post/PostCard';
import FeedPostSkeleton from '@components/feed/FeedPostSkeleton';
import EmptyFeed from '@components/feed/EmptyFeed';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Saved posts controller - shows user's saved posts
 */
export default function SavedPostsController() {
  const content = useIntlayer('feedHome');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError,
    error,
    refetch,
    isFetchingNextPage 
  } = useSavedPosts();

  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage
  });

  const posts = data?.pages.flatMap(page => page.data.posts) ?? [];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto  py-6">
        <FeedPostSkeleton />
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto  py-6">
        <ErrorDisplay 
          message={error?.response?.data?.error?.message || content.errorLoadingFeed}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto  py-6">
        <EmptyFeed 
          title={content.noSavedPostsTitle}
          message={content.noSavedPosts}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto  py-6 flex flex-col gap-3">
      <h1 className="text-heading-2 mb-3">Saved Posts</h1>
      
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
        />
      ))}

      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
