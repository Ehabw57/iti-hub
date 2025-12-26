import api from "@/lib/api";

/**
 * Search posts by query
 * @param {string} query
 * @returns {Promise<Array>} posts array
 */
export default async function searchPosts(query) {
  if (!query) return [];

  try {
    const response = await api.get(`/search/posts?q=${encodeURIComponent(query)}`);
    return response.data.posts || [];
  } catch (error) {
    console.error("[searchPosts] Error:", error);
    return [];
  }
}
