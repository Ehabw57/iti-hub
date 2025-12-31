import { useIntlayer } from 'react-intlayer';
import { useUserCommunitiesInfinite } from '@hooks/queries/useUserCommunities';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import CommunityCard from '@components/community/CommunityCard';
import CommunitySkeleton from '@components/explore/CommunitySkeleton';
import { Loading, ErrorDisplay } from '@components/common';

/**
 * User communities controller with infinite scroll
 * Displays all communities the user has joined
 */
export default function UserCommunitiesController() {
  const content = useIntlayer('userCommunities');

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError,
    error,
    refetch,
    isFetchingNextPage 
  } = useUserCommunitiesInfinite();

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
  const communities = data?.pages.flatMap(page => page.communities) ?? [];

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
        <div className="text-center py-12">
          <p className="text-body-1 text-neutral-600 mb-4">{content.noCommunities}</p>
          <p className="text-body-2 text-neutral-500">{content.noCommunitiesSubtext}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-heading-3 text-neutral-800 mb-6">{content.pageTitle}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map(item => (
          <CommunityCard
            key={item.community._id}
            community={item}
            size="medium"
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
