import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { useCommunitiesList } from '@hooks/queries/useCommunity';
import { useUserCommunitiesInfinite } from '@hooks/queries/useUserCommunities';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import { useAuthStore } from '@store/auth';
import CommunityCard from '@components/community/CommunityCard';
import CommunitySkeleton from '@components/explore/CommunitySkeleton';
import { ErrorDisplay } from '@components/common';
import CommunityDirectoryCard from '@components/community/CommunityDirectoryCard';
import CreateCommunity from '@components/community/CreateCommunity';
import groupsContent from '@/content/groups/groups.content';

/**
 * Communities page — consolidated (work-order §2).
 *
 * One page, two tabs:
 *  - All            → every community (public browse grid, same data as the
 *                     former Explore page / Groups page — the communities API
 *                     is the same; GET /communities is optional-auth).
 *  - My Communities → communities the signed-in user joined (the former
 *                     protected "My Communities" page).
 *
 * Individual community detail pages (/community/:id) stay separate and
 * untouched. ?tab=my deep-links straight to the joined list.
 */
const TABS = [
  { id: 'all', labelKey: 'tabAll' },
  { id: 'my', labelKey: 'tabMyCommunities' },
];

export default function CommunitiesController() {
  const content = useIntlayer(groupsContent.key);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'my' ? 'my' : 'all';
  const setActiveTab = (id) => {
    setSearchParams(id === 'all' ? {} : { tab: id }, { replace: true });
  };

  // ---- All tab: full communities browse grid (public) ----
  const allQuery = useCommunitiesList();

  // ---- My Communities tab: joined list (auth) ----
  const myQuery = useUserCommunitiesInfinite();

  const allLoaded = !allQuery.isLoading && !allQuery.isError;
  const allCommunities =
    allLoaded
      ? allQuery.data?.pages?.flatMap((page) => page.data?.communities ?? []) ?? []
      : [];

  const myLoaded = !myQuery.isLoading && !myQuery.isError;
  const myCommunities =
    myLoaded ? myQuery.data?.pages?.flatMap((page) => page.communities ?? []) ?? [] : [];

  // Infinite scroll — only the active tab's query drives the sentinel.
  const activeQuery = activeTab === 'my' ? myQuery : allQuery;
  const { observerTarget } = useIntersectionObserver({
    onIntersect: () => {
      if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
        activeQuery.fetchNextPage();
      }
    },
    enabled: Boolean(activeQuery.hasNextPage) && !activeQuery.isFetchingNextPage,
  });

  const t = (key) => content[key]?.value || key;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-heading-2 text-neutral-900">{t('pageTitle')}</h1>
        <p className="text-body-2 text-neutral-500 mt-1">{t('pageSubtitle')}</p>
        {isAuthenticated && <CreateCommunity />}
      </header>

      {/* Tabs */}
      <nav
        className="flex items-center gap-6 border-b border-outline mb-6"
        aria-label="Communities tabs"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`pb-3 -mb-px text-body-1 font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </nav>


      {/* ---- All tab ---- */}
      {activeTab === 'all' && (
        <>
          {allQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CommunitySkeleton key={i} />
              ))}
            </div>
          )}

          {allQuery.isError && (
            <ErrorDisplay
              message={allQuery.error?.response?.data?.error?.message || t('errorLoading')}
              onRetry={allQuery.refetch}
            />
          )}

          {allLoaded && allCommunities.length === 0 && (
            <div className="py-16 text-center">
              <h2 className="text-heading-4 text-neutral-900 mb-2">{t('noGroupsTitle')}</h2>
              <p className="text-body-1 text-neutral-500">{t('noGroupsMessage')}</p>
            </div>
          )}

          {allLoaded && allCommunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCommunities.map((community) => (
                <CommunityDirectoryCard key={community._id} community={community} />
              ))}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center mt-6">
            {allQuery.isFetchingNextPage && (
              <span className="text-body-2 text-neutral-500">{t('loadingGroups')}</span>
            )}
          </div>
        </>
      )}

      {/* ---- My Communities tab ---- */}
      {activeTab === 'my' && (
        <>
          {/* Guests: the joined list is auth-gated — clean sign-in prompt */}
          {!isAuthenticated && (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <HiOutlineUserGroup className="w-7 h-7 text-primary-600" strokeWidth={1.7} />
              </div>
              <h2 className="text-heading-4 text-neutral-900 mb-2">{t('signInTitle')}</h2>
              <p className="text-body-2 text-neutral-500 mb-6 max-w-md mx-auto">
                {t('signInMessage')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-10 px-5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              >
                {t('signIn')}
              </button>
            </div>
          )}

          {isAuthenticated && myQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CommunitySkeleton key={i} />
              ))}
            </div>
          )}

          {isAuthenticated && myQuery.isError && (
            <ErrorDisplay
              message={myQuery.error?.response?.data?.error?.message || t('errorLoading')}
              onRetry={myQuery.refetch}
            />
          )}

          {isAuthenticated && myLoaded && myCommunities.length === 0 && (
            <div className="py-16 text-center">
              <h2 className="text-heading-4 text-neutral-900 mb-2">
                {t('noMyCommunitiesTitle')}
              </h2>
              <p className="text-body-2 text-neutral-500">{t('noMyCommunitiesMessage')}</p>
            </div>
          )}

          {isAuthenticated && myLoaded && myCommunities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCommunities.map((item) => (
                <Link
                  key={item.community._id}
                  to={`/community/${item.community._id}`}
                  className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <CommunityCard community={item} size="medium" />
                </Link>
              ))}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {isAuthenticated && (
            <div ref={observerTarget} className="h-10 flex items-center justify-center mt-6">
              {myQuery.isFetchingNextPage && (
                <span className="text-body-2 text-neutral-500">{t('loadingGroups')}</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
