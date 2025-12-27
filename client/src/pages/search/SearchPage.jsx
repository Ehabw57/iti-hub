import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIntlayer } from 'react-intlayer';
import api from '@/lib/api';
import UserListItem from './UserListItem';
import PostItem from './PostItem';
import CommunityItem from './CommunityItem';

export default function SearchPage() {
    const t = useIntlayer('search-page');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const tab = searchParams.get('tab') || 'posts';

  const [pageState, setPageState] = useState({ users: 1, posts: 1, communities: 1 });

  useEffect(() => {
    setPageState({ users: 1, posts: 1, communities: 1 });
  }, [q]);

  // Fetch functions
  const fetchUsers = async ({ page = 1 }) => {
    const res = await api.get('/search/users', { params: { q, page } });
    return res.data.data;
  };

  const fetchPosts = async ({ page = 1 }) => {
    const res = await api.get('/search/posts', { params: { q, page } });
    return res.data.data;
  };

  const fetchCommunities = async ({ page = 1 }) => {
    const res = await api.get('/search/communities', { params: { q, page } });
    return res.data.data;
  };

  const usersQuery = useQuery({
    queryKey: ['search', 'users', q, pageState.users],
    queryFn: () => fetchUsers({ page: pageState.users }),
    enabled: !!q,
    keepPreviousData: true,
  });

  const postsQuery = useQuery({
    queryKey: ['search', 'posts', q, pageState.posts],
    queryFn: () => fetchPosts({ page: pageState.posts }),
    enabled: !!q,
    keepPreviousData: true,
  });

  const communitiesQuery = useQuery({
    queryKey: ['search', 'communities', q, pageState.communities],
    queryFn: () => fetchCommunities({ page: pageState.communities }),
    enabled: !!q,
    keepPreviousData: true,
  });

  const isLoading = usersQuery.isLoading || postsQuery.isLoading || communitiesQuery.isLoading;
  const error = usersQuery.error || postsQuery.error || communitiesQuery.error;

  const goToTab = (t) => {
    setSearchParams((prev) => {
      if (q) prev.set('q', q);
      prev.set('tab', t);
      return prev;
    });
  };

  const gotoPage = (t, page) => {
    setPageState((p) => ({ ...p, [t]: page }));
  };

  if (!q) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-semibold">Search</h2>
        <p className="mt-2 text-sm text-neutral-600">Type something in the search box and press Enter.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t.searchResultsFor} "{q}"</h2>
        <button className="text-sm text-neutral-500" onClick={() => navigate('/')}>
          {t.back}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-neutral-200">
        <nav className="flex gap-6">
          <TabButton active={tab === 'posts'} onClick={() => goToTab('posts')}>
            {t.postsTab}<CountBadge count={postsQuery.data?.pagination?.total} />
          </TabButton>
          <TabButton active={tab === 'users'} onClick={() => goToTab('users')}>
            {t.usersTab}<CountBadge count={usersQuery.data?.pagination?.total} />
          </TabButton>
          <TabButton active={tab === 'communities'} onClick={() => goToTab('communities')}>
            {t.communitiesTab}<CountBadge count={communitiesQuery.data?.pagination?.total} />
          </TabButton>
        </nav>
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading && <p>{t.loadingResults}...</p>}
        {error && <p className="text-red-600">{t.errorLoadingResults}: {error?.message}</p>}

        {!isLoading && tab === 'posts' && (
          <ResultsList
            items={postsQuery.data?.posts || []}
            renderItem={(p) => <PostItem key={p._id} post={p} />}
            pagination={postsQuery.data?.pagination}
            onPageChange={(page) => gotoPage('posts', page)}
          />
        )}
        {!isLoading && tab === 'users' && (
          <ResultsList
            items={usersQuery.data?.users || []}
            renderItem={(u) => <UserListItem key={u._id} user={u} />}
            pagination={usersQuery.data?.pagination}
            onPageChange={(page) => gotoPage('users', page)}
          />
        )}
        {!isLoading && tab === 'communities' && (
          <ResultsList
            items={communitiesQuery.data?.communities || []}
            renderItem={(c) => <CommunityItem key={c._id} community={c} />}
            pagination={communitiesQuery.data?.pagination}
            onPageChange={(page) => gotoPage('communities', page)}
          />
        )}

        {!isLoading &&
          ((tab === 'posts' && (postsQuery.data?.posts || []).length === 0) ||
            (tab === 'users' && (usersQuery.data?.users || []).length === 0) ||
            (tab === 'communities' && (communitiesQuery.data?.communities || []).length === 0)) && (
            <p className="text-sm text-neutral-500">{t.noResults}.</p>
          )}
      </div>
    </div>
  );
}

// Helpers
function TabButton({ children, active, onClick }) {

  return (
    <button
      onClick={onClick}
      className={`pb-3 ${active ? 'border-b-2 border-red-500 text-red-600' : 'text-neutral-600'}`}
    >
      <div className="flex items-center gap-2">{children}</div>
    </button>
  );
}

function CountBadge({ count }) {
  if (count === undefined || count === null) return null;
  return <span className="ml-1 text-xs text-neutral-400">({count})</span>;
}

function ResultsList({ items, renderItem, pagination, onPageChange }) {
        const t = useIntlayer('search-page');
  return (
    <div>
      <div className="border rounded-md overflow-hidden">{items.map(renderItem)}</div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrevPage}
          >
            {t.prev}
          </button>
          <div className="text-sm text-neutral-500">
            {t.page} {pagination.page} / {pagination.pages}
          </div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
            disabled={!pagination.hasNextPage}
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
