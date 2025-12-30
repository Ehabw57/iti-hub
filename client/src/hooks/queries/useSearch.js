import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import debounce from "lodash.debounce";

export const useSearch = (initialQuery = "") => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({
    users: [],
    posts: [],
    communities: [],
  });
  const [loading, setLoading] = useState(false);

  // الدالة الأساسية للبحث مع debounce
  const fetchResults = useMemo(
    () =>
      debounce(async (q) => {
        if (!q || q.length < 2) {
          setResults({ users: [], posts: [], communities: [] });
          return;
        }

        setLoading(true);

        try {
          // البحث عن ال Users
          const usersPromise = api.get(`/search/users?q=${encodeURIComponent(q)}`);
          // البحث عن ال Posts
          const postsPromise = api.get(`/search/posts?q=${encodeURIComponent(q)}`);
          // البحث عن ال Communities
          const communitiesPromise = api.get(
            `/search/communities?q=${encodeURIComponent(q)}`
          );

          const [usersRes, postsRes, communitiesRes] = await Promise.all([
            usersPromise,
            postsPromise,
            communitiesPromise,
          ]);

          setResults({
            users: usersRes.data.data.users.slice(0, 3),
            posts: postsRes.data.data.posts.slice(0, 3),
            communities: communitiesRes.data.data.communities.slice(0, 3),
          });
        } catch (err) {
          console.error("[useSearch] Error:", err);
          setResults({ users: [], posts: [], communities: [] });
        } finally {
          setLoading(false);
        }
      }, 400),
    []
  );

  useEffect(() => {
    fetchResults(query);
    return fetchResults.cancel;
  }, [query]);

  return { query, setQuery, results, loading };
};
