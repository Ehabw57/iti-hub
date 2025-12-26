import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const tab = searchParams.get('tab') || 'posts'; // default to posts

  // local pagination per tab (page number)
  const [pageState, setPageState] = useState({ users: 1, posts: 1, communities: 1 });

  useEffect(() => {
    // Reset pages when new query arrives
    setPageState({ users: 1, posts: 1, communities: 1 });
  }, [q]);

  // Fetch helpers
  const fetchUsers = async ({ queryKey }) => {
    const [_key, q, page] = queryKey;
    const res = await api.get('/search/users', { params: { q, page } });
    return res.data.data; // { users: [], pagination: {} }
  };

  const fetchPosts = async ({ queryKey }) => {
    const [_key, q, page] = queryKey;
    const res = await api.get('/search/posts', { params: { q, page } });
    return res.data.data; // { posts: [], pagination: {} }
  };

  const fetchCommunities = async ({ queryKey }) => {
    const [_key, q, page] = queryKey;
    const res = await api.get('/search/communities', { params: { q, page } });
    return res.data.data; // { communities: [], pagination: {} }
  };

  const usersQuery = useQuery(['search', 'users', q, pageState.users], fetchUsers, {
    enabled: !!q,
    keepPreviousData: true,
  });

  const postsQuery = useQuery(['search', 'posts', q, pageState.posts], fetchPosts, {
    enabled: !!q,
    keepPreviousData: true,
  });

  const communitiesQuery = useQuery([
    'search',
    'communities',
    q,
    pageState.communities,
  ], fetchCommunities, {
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

  // Pagination handlers
  const gotoPage = (t, page) => {
    setPageState((p) => ({ ...p, [t]: page }));
  };

  // If no query, show a small hint
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
        <h2 className="text-2xl font-semibold">Search results for "{q}"</h2>
        <button
          className="text-sm text-neutral-500"
          onClick={() => navigate('/')}
        >
          Back
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-neutral-200">
        <nav className="flex gap-6">
          <TabButton active={tab === 'posts'} onClick={() => goToTab('posts')}>
            Posts
            <CountBadge count={postsQuery.data?.pagination?.total} />
          </TabButton>

          <TabButton active={tab === 'users'} onClick={() => goToTab('users')}>
            Users
            <CountBadge count={usersQuery.data?.pagination?.total} />
          </TabButton>

          <TabButton active={tab === 'communities'} onClick={() => goToTab('communities')}>
            Communities
            <CountBadge count={communitiesQuery.data?.pagination?.total} />
          </TabButton>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading && <p>Loading results...</p>}

        {error && <p className="text-red-600">Error loading results: {error?.response?.data?.error?.message || error?.message}</p>}

        {!isLoading && tab === 'posts' && (
          <ResultsList
            items={postsQuery.data?.posts || []}
            renderItem={(p) => (
              <div key={p._id} className="p-3 border-b">
                <div className="text-sm text-neutral-700">{p.content}</div>
                <div className="text-xs text-neutral-400 mt-1">{p.author?.username}</div>
              </div>
            )}
            pagination={postsQuery.data?.pagination}
            onPageChange={(page) => gotoPage('posts', page)}
          />
        )}

        {!isLoading && tab === 'users' && (
          <ResultsList
            items={usersQuery.data?.users || []}
            renderItem={(u) => (
              <div key={u._id} className="p-3 border-b flex items-center gap-3">
                <img src={u.profilePicture || '/avatar.png'} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold">{u.username}</div>
                  <div className="text-sm text-neutral-500">{u.fullName}</div>
                </div>
                <div className="ml-auto text-sm text-neutral-500">
                  {u.isFollowing ? 'Following' : ''}
                </div>
              </div>
            )}
            pagination={usersQuery.data?.pagination}
            onPageChange={(page) => gotoPage('users', page)}
          />
        )}

        {!isLoading && tab === 'communities' && (
          <ResultsList
            items={communitiesQuery.data?.communities || []}
            renderItem={(c) => (
              <div key={c._id} className="p-3 border-b">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-neutral-500">{c.description}</div>
              </div>
            )}
            pagination={communitiesQuery.data?.pagination}
            onPageChange={(page) => gotoPage('communities', page)}
          />
        )}

        {!isLoading &&
          ( (tab === 'posts' && (postsQuery.data?.posts || []).length === 0) ||
            (tab === 'users' && (usersQuery.data?.users || []).length === 0) ||
            (tab === 'communities' && (communitiesQuery.data?.communities || []).length === 0)
          ) && <p className="text-sm text-neutral-500">No results found.</p>}
      </div>
    </div>
  );
}

/* Small helper components */

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
  if (!count && count !== 0) return null;
  return <span className="ml-1 text-xs text-neutral-400">({count})</span>;
}

function ResultsList({ items, renderItem, pagination, onPageChange }) {
  return (
    <div>
      <div className="border rounded-md overflow-hidden">
        {items.map((it) => renderItem(it))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center gap-2 mt-4">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrevPage}
          >
            Prev
          </button>

          <div className="text-sm text-neutral-500">Page {pagination.page} / {pagination.pages}</div>

          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
            disabled={!pagination.hasNextPage}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
