import api from "@/lib/api";

/**
 * Search communities by query
 * @param {string} query
 * @returns {Promise<Array>} communities array
 */
export default async function searchCommunities(query) {
  if (!query) return [];

  try {
    const response = await api.get(`/search/communities?q=${encodeURIComponent(query)}`);
    return response.data.communities || [];
  } catch (error) {
    console.error("[searchCommunities] Error:", error);
    return [];
  }
}
