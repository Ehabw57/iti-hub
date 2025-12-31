import { useIntlayer } from 'react-intlayer';
import { useCommunitiesList } from '@hooks/queries/useCommunity';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import CommunityCard from '@components/community/CommunityCard';
import CommunitySkeleton from '@components/explore/CommunitySkeleton';
import EmptyExplore from '@components/explore/EmptyExplore';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * Explore communities controller with infinite scroll
 */
export default function ExploreController() {
  const content = useIntlayer('exploreCommunities');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError,
    error,
    refetch,
    isFetchingNextPage 
  } = useCommunitiesList();

  // Infinite scroll
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage
  });

  // Flatten pages to get all communities
  const communities = data?.pages.flatMap(page => page.data.communities) ?? [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-heading-3 text-neutral-800 mb-6">{content.pageTitle}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CommunitySkeleton />
          <CommunitySkeleton />
          <CommunitySkeleton />
          <CommunitySkeleton />
          <CommunitySkeleton />
          <CommunitySkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-heading-3 text-neutral-800 mb-6">{content.pageTitle}</h1>
        <ErrorDisplay 
          message={error?.response?.data?.error?.message || content.errorLoadingCommunities}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-heading-3 text-neutral-800 mb-6">{content.pageTitle}</h1>
        <EmptyExplore />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-heading-3 text-neutral-800 mb-6">{content.pageTitle}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map(community => (
          <CommunityCard
            key={community._id}
            community={community}
            size="large"
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center mt-6">
        {isFetchingNextPage && <Loading />}
      </div>
    </div>
  );
}
