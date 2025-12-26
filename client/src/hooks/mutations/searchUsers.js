import api from "@/lib/api";

/**
 * Search users by query
 * @param {string} query
 * @returns {Promise<Array>} users array
 */
export default async function searchUsers(query) {
  if (!query) return [];

  try {
    const response = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
    return response.data.users || [];
  } catch (error) {
    console.error("[searchUsers] Error:", error);
    return [];
  }
}
