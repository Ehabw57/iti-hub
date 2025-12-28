// NavbarSearch.jsx
import { useFastSearch } from "@/hooks/mutations/useFastSearch";
import { Link } from "react-router-dom";

export default function NavbarSearch() {
  const { query, setQuery, results, loading } = useFastSearch();

  return (
    <div className="relative w-72">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />

      {query && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded shadow z-50">
          {loading && <p className="p-2 text-sm">Searching...</p>}

          {!loading && (
            <>
              {results.users.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-bold text-neutral-500">Users</p>
                  {results.users.map((u) => (
                    <Item key={u._id} to={`/users/${u._id}`} text={u.username} />
                  ))}
                </>
              )}

              {results.posts.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-bold text-neutral-500">Posts</p>
                  {results.posts.map((p) => (
                    <Item key={p._id} to={`/posts/${p._id}`} text={p.content.slice(0, 30)} />
                  ))}
                </>
              )}

              {results.communities.length > 0 && (
                <>
                  <p className="px-3 py-1 text-xs font-bold text-neutral-500">Communities</p>
                  {results.communities.map((c) => (
                    <Item key={c._id} to={`/communities/${c._id}`} text={c.name} />
                  ))}
                </>
              )}

              {results.users.length === 0 &&
               results.posts.length === 0 &&
               results.communities.length === 0 && (
                <p className="p-2 text-sm text-neutral-500">No results</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Item({ to, text }) {
  return (
    <Link to={to} className="block px-3 py-2 text-sm hover:bg-gray-100">
      {text}
    </Link>
  );
}
