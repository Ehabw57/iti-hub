// useFastSearch.js
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import debounce from "lodash.debounce";

export const useFastSearch = (initialQuery = "") => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({
    users: [],
    posts: [],
    communities: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchResults = useMemo(
    () =>
      debounce(async (q) => {
        // لو الكلمة أقل من حرفين، رجع النتائج فاضية
        if (!q || q.length < 2) {
            
          setResults({ users: [], posts: [], communities: [] });
          return;
        }

        setLoading(true);

        try {
          const response = await api.get(`/search/fast?q=${encodeURIComponent(q)}`);
          setResults({
            users: response.data.data.users.slice(0, 3),
            posts: response.data.data.posts.slice(0, 3),
            communities: response.data.data.communities.slice(0, 3),
          });
        } catch (err) {
          console.error("[useFastSearch] Error:", err);
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
