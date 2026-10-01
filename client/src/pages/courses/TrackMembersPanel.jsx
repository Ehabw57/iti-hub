import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useIntlayer } from 'react-intlayer';
import { HiOutlineMagnifyingGlass, HiOutlineUserMinus } from 'react-icons/hi2';
import { useTrackMembers, useSearchAssignableUsers } from '@hooks/queries/useCourse';
import { useUpdateTrackMembers } from '@hooks/mutations/useCourseMutations';

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

/**
 * TrackMembersPanel — manager panel on the track detail page (work order §5c).
 * Lists instructors and students, and offers "add by search" (partial,
 * case-insensitive) wired to /tracks/users/search. Instructors/branch
 * admins/super admins all get it — the server scopes results per role.
 */
export default function TrackMembersPanel({ trackId }) {
  const content = useIntlayer('courses');
  // Content accessor with fallbacks — safe against missing keys.
  const t = (key, fallback = '') => content?.[key]?.value ?? fallback;

  const { data: membersData, isLoading } = useTrackMembers(trackId);
  const updateMutation = useUpdateTrackMembers();

  const [searchRole, setSearchRole] = useState('student');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const members = membersData?.data?.data;
  const instructors = members?.instructors ?? [];
  const students = members?.students ?? [];

  // Debounce the search query so typing doesn't spam the endpoint.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResp, isLoading: searching, isError: searchFailed } = useSearchAssignableUsers({
    role: searchRole,
    q: debouncedQuery,
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
  });

  const searchResults = useMemo(() => {
    const users = searchResp?.data?.data?.users ?? [];
    const existing = new Set([
      ...instructors.map((u) => String(u._id)),
      ...students.map((u) => String(u._id)),
    ]);
    return users.filter((u) => !existing.has(String(u._id)));
  }, [searchResp, instructors, students]);

  const handleAssign = async (user) => {
    const patch = searchRole === 'instructor'
      ? { addInstructors: [user._id] }
      : { addStudents: [user._id] };
    try {
      await updateMutation.mutateAsync({ trackId, ...patch });
      toast.success(t('membersUpdated', 'Members updated'));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('membersUpdateError', 'Failed to update members'));
    }
  };

  const handleRemove = async (user, role) => {
    const patch = role === 'instructor'
      ? { removeInstructors: [user._id] }
      : { removeStudents: [user._id] };
    try {
      await updateMutation.mutateAsync({ trackId, ...patch });
      toast.success(t('membersUpdated', 'Members updated'));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('membersUpdateError', 'Failed to update members'));
    }
  };

  return (
    <div className="bg-surface-lowest border border-outline rounded-xl p-6 mb-6 shadow-elevation-1">
      <h2 className="text-heading-5 mb-1">{t('manageMembers', 'Members')}</h2>
      <p className="text-caption text-neutral-500 mb-4">
        {t('manageMembersHint', 'Add or remove students and instructors on this track.')}
      </p>

      {/* Search + role selector */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
          className="sm:w-44 h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
        >
          <option value="student">{t('studentsLabel', 'Students')}</option>
          <option value="instructor">{t('instructorsLabel', 'Instructors')}</option>
        </select>
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchUsers', 'Search users by name or username...')}
            className="w-full h-10 ltr:pl-9 rtl:pr-9 pr-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
          />
        </div>
      </div>

      {/* Search results */}
      {debouncedQuery.length >= MIN_QUERY_LENGTH && (
        <div className="mb-4 border border-outline rounded-xl divide-y divide-outline overflow-hidden">
          {searching ? (
            <p className="px-3 py-3 text-body-2 text-neutral-500">{t('searching', 'Searching...')}</p>
          ) : searchFailed ? (
            <p className="px-3 py-3 text-body-2 text-neutral-500">{t('searchError', 'Search failed')}</p>
          ) : searchResults.length === 0 ? (
            <p className="px-3 py-3 text-body-2 text-neutral-500">{t('noSearchResults', 'No results')}</p>
          ) : (
            searchResults.map((user) => (
              <div key={user._id} className="flex items-center gap-3 px-3 py-2.5 bg-surface-lowest">
                <img
                  src={
                    user.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.fullName || user.username || '?'
                    )}&background=random`
                  }
                  alt={user.fullName || user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body-2 font-semibold text-neutral-900 truncate">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-caption text-neutral-500 truncate">@{user.username} · {user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAssign(user)}
                  disabled={updateMutation.isPending}
                  className="shrink-0 px-3 h-8 bg-primary-600 text-white rounded-full text-caption font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {searchRole === 'instructor'
                    ? t('addAsInstructor', 'Add as instructor')
                    : t('addAsStudent', 'Add as student')}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Member lists */}
      {isLoading ? (
        <p className="text-body-2 text-neutral-500">{t('loadingMembers', 'Loading members...')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MemberList
            title={t('instructorsLabel', 'Instructors')}
            users={instructors}
            role="instructor"
            onRemove={handleRemove}
            updatePending={updateMutation.isPending}
            t={t}
          />
          <MemberList
            title={t('studentsLabel', 'Students')}
            users={students}
            role="student"
            onRemove={handleRemove}
            updatePending={updateMutation.isPending}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function MemberList({ title, users, role, onRemove, updatePending, t }) {
  return (
    <div className="border border-outline rounded-xl overflow-hidden">
      <p className="px-3 py-2 bg-surface-high text-caption font-semibold text-neutral-700">
        {title} ({users.length})
      </p>
      {users.length === 0 ? (
        <p className="px-3 py-3 text-caption text-neutral-500">{t('noMembersYet', 'None yet')}</p>
      ) : (
        <ul className="divide-y divide-outline">
          {users.map((user) => (
            <li key={user._id} className="flex items-center gap-3 px-3 py-2">
              <img
                src={
                  user.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.fullName || user.username || '?'
                  )}&background=random`
                }
                alt={user.fullName || user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-body-2 font-medium text-neutral-900 truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-caption text-neutral-500 truncate">@{user.username}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(user, role)}
                disabled={updatePending}
                className="shrink-0 p-1.5 rounded-full text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
                title={t('remove', 'Remove')}
                aria-label={`${t('remove', 'Remove')}: ${user.fullName || user.username}`}
              >
                <HiOutlineUserMinus className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
