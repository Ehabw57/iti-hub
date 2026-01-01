import { useIntlayer } from 'react-intlayer';
import useFeedHome from '@hooks/queries/useFeedHome';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { PostCard } from '@components/post/PostCard';
import FeedPostSkeleton from '@components/feed/FeedPostSkeleton';
import EmptyFeed from '@components/feed/EmptyFeed';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Home feed controller with infinite scroll and optimistic updates
 */
export default function FeedHomeController() {
  const  content  = useIntlayer('feedHome');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError,
    error,
    refetch,
    isFetchingNextPage 
  } = useFeedHome();
  // console.log(data);

  // Infinite scroll
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage
  });

  // Flatten pages to get all posts
  const posts = data?.pages.flatMap(page => page.data.posts) ?? [];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <FeedPostSkeleton />
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ErrorDisplay 
          message={error?.response?.data?.error?.message || content.errorLoadingFeed}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <EmptyFeed />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto  px-4 py-6 flex flex-col gap-3">
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
        />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
