import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import useSearch from '@hooks/queries/useSearch';
import useIntersectionObserver from '@hooks/useIntersectionObserver';
import UserCard from '@/components/user/UserCard';
import CommunityCard from '@/components/community/CommunityCard';
import { PostCard } from '@/components/post/PostCard';
import { Loading, ErrorDisplay } from '@/components/common';

/**
 * SearchPage Component
 * Implements search functionality across users, communities, and posts
 * 
 * Features:
 * - URL query params: ?q=query&tab=users|communities|posts
 * - Three tabs with separate result lists and infinite scroll
 * - All three API calls triggered on search
 * - Loading and error states
 * - i18n support with Intlayer
 * 
 * @example
 * Navigate to: /search?q=react&tab=posts
 */
const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const content = useIntlayer('search');
  
  // Get URL params
  const query = searchParams.get('q') || '';
  let activeTab = searchParams.get('tab') || 'users';
  if (!['users', 'communities', 'posts'].includes(activeTab)) {
    activeTab = 'users';
  }
  
  
  // Fetch data from all three endpoints with infinite scroll
  const { users, posts, communities, isLoading, error } = useSearch({ 
    query,
    limit: 20 
  });
  
  
  // Infinite scroll observers for each tab
  const { observerTarget: usersObserver } = useIntersectionObserver({
    onIntersect: () => {
      if (users.hasNextPage && !users.isFetchingNextPage) {
        users.fetchNextPage();
      }
    },
    enabled: users.hasNextPage && !users.isFetchingNextPage && activeTab === 'users'
  });

  const { observerTarget: postsObserver } = useIntersectionObserver({
    onIntersect: () => {
      if (posts.hasNextPage && !posts.isFetchingNextPage) {
        posts.fetchNextPage();
      }
    },
    enabled: posts.hasNextPage && !posts.isFetchingNextPage && activeTab === 'posts'
  });

  const { observerTarget: communitiesObserver } = useIntersectionObserver({
    onIntersect: () => {
      if (communities.hasNextPage && !communities.isFetchingNextPage) {
        communities.fetchNextPage();
      }
    },
    enabled: communities.hasNextPage && !communities.isFetchingNextPage && activeTab === 'communities'
  });
  
  // Update URL when tab changes
  const handleTabChange = (tab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };
  
  // Extract flattened results from pages
  const userResults = users.data?.pages.flatMap(page => page.data.users) || [];
  const postResults = posts.data?.pages.flatMap(page => page.data.posts) || [];
  const communityResults = communities.data?.pages.flatMap(page => page.data.communities) || [];
  
  // Calculate counts for tab badges (from first page)
  const userCount = users.data?.pages[0]?.data?.pagination?.total || 0;
  const postCount = posts.data?.pages[0]?.data?.pagination?.total || 0;
  const communityCount = communities.data?.pages[0]?.data?.pagination?.total || 0;
  
  // Tab configuration
  const tabs = [
    { id: 'users', label: content.usersTab, count: userCount },
    { id: 'communities', label: content.communitiesTab, count: communityCount },
    { id: 'posts', label: content.postsTab, count: postCount },
  ];
  
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-3">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {query && (
            <h2 className="text-heading-5 text-neutral-900 mb-3">
              {content.searchResultsFor} "{query}"
            </h2>
          )}
          
          {/* Tabs */}
          <div className="flex gap-1 border-b border-neutral-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  {tab.label}
                  {query && tab.count > 0 && (
                    <span className="ml-2 text-caption px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 lg:px-26  py-6">
        {/* Empty state - no query */}
        {!query && (
          <div className="text-center py-12">
            <HiMagnifyingGlass className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-heading-4 text-neutral-700 mb-2">{content.emptyStateTitle}</h3>
            <p className="text-body-2 text-neutral-600">
              {content.emptyStateDescription}
            </p>
          </div>
        )}
        
        {/* Loading state - initial load */}
        {query && isLoading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}
        
        {/* Error state */}
        {query && error && !isLoading && (
          <ErrorDisplay 
            message={content.errorLoadingResults} 
            onRetry={() => window.location.reload()}
          />
        )}
        
        {/* Results */}
        {query && !isLoading && !error && (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {userResults.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-body-1 text-neutral-600">
                      {content.noUsersFound} "{query}"
                    </p>
                  </div>
                ) : (
                  <>
                    {userResults.map((user) => (
                      <UserCard key={user._id} user={user} size="medium" />
                    ))}
                    {/* Infinite scroll sentinel */}
                    <div ref={usersObserver} className="h-10 flex items-center justify-center">
                      {users.isFetchingNextPage && <Loading />}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div className="space-y-4">
                {communityResults.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-body-1 text-neutral-600">
                      {content.noCommunitiesFound} "{query}"
                    </p>
                  </div>
                ) : (
                  <>
                    {communityResults.map((community) => (
                      <CommunityCard key={community._id} community={community} size="large" />
                    ))}
                    {/* Infinite scroll sentinel */}
                    <div ref={communitiesObserver} className="h-10 flex items-center justify-center">
                      {communities.isFetchingNextPage && <Loading />}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {postResults.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-body-1 text-neutral-600">
                      {content.noPostsFound} "{query}"
                    </p>
                  </div>
                ) : (
                  <>
                    {postResults.map((post) => (
                      <PostCard 
                        key={post._id} 
                        post={post}
                        onPostClick={(postId) => navigate(`/posts/${postId}`)}
                      />
                    ))}
                    {/* Infinite scroll sentinel */}
                    <div ref={postsObserver} className="h-10 flex items-center justify-center">
                      {posts.isFetchingNextPage && <Loading />}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Query too short */}
        {query && query.length < 2 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-body-1 text-neutral-600">
              {content.queryTooShort}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
