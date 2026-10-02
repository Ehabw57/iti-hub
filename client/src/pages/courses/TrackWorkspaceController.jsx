import { useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import {
  HiArrowLeft,
  HiOutlineChatBubbleOvalLeft,
  HiOutlineVideoCamera,
  HiOutlineFolderOpen,
  HiOutlineAcademicCap,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';
import {
  useTrackDetail,
  useTrackMembers,
  useCheckEnrollment,
  useCurrentUser,
} from '@hooks/queries/useCourse';
import { useAuthStore } from '@store/auth';
import { Loading, ErrorDisplay, Chip } from '@components/common';
import {
  getTrackCategory,
  getTrackCategoryStyle,
  getTrackCategoryLabelKey,
  getTrackCategoryIcon,
} from '@/utils/trackCategories';
import ChatTab from './workspace/ChatTab';
import RecordsTab from './workspace/RecordsTab';
import FilesTab from './workspace/FilesTab';
import VideosTab from './workspace/VideosTab';

const TABS = ['chat', 'records', 'files', 'videos'];
const TAB_KEYS = {
  chat: 'tabChat',
  records: 'tabRecords',
  files: 'tabFiles',
  videos: 'tabVideos',
};
const TAB_ICONS = {
  chat: HiOutlineChatBubbleOvalLeft,
  records: HiOutlineVideoCamera,
  files: HiOutlineFolderOpen,
  videos: HiOutlinePlayCircle,
};

/** Content accessor with fallbacks — safe against missing keys. */
function useCoursesText() {
  const content = useIntlayer('courses');
  return (key, fallback = '') => content?.[key]?.value ?? fallback;
}

/** True when the user can manage this track (review requests, CRUD records/folders):
 *  track instructors, the track's branch admin, super admins. */
function useIsTrackManager(currentUser, track) {
  return useMemo(() => {
    const user = currentUser?.data || currentUser;
    if (!user || !track) return false;
    const role = user?.role;
    const userId = String(user?._id || '');
    if (role === 'super_admin' || role === 'admin') return true;
    if (role === 'branch_admin') {
      return (
        !!track.branchId &&
        String(user.branchId?._id || user.branchId) === String(track.branchId)
      );
    }
    if (role === 'instructor') {
      return (track.instructorIds || []).some((id) => String(id) === userId);
    }
    return false;
  }, [currentUser, track]);
}

/** Extract the user doc from the /users/me response (returned raw). */
function currentUserIdOf(currentUser) {
  const user = currentUser?.data || currentUser;
  return String(user?._id || '');
}

export default function TrackWorkspaceController() {
  const { trackId, tab } = useParams();
  const navigate = useNavigate();
  const t = useCoursesText();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Normalize the tab segment (default chat; unknown tabs fall back to chat)
  const activeTab = TABS.includes(tab) ? tab : 'chat';

  const { data, isLoading, isError, refetch } = useTrackDetail(trackId);
  const { data: currentUser } = useCurrentUser();
  const { data: enrollmentCheck } = useCheckEnrollment(trackId);
  const { data: membersData } = useTrackMembers(trackId);

  const track = data?.data?.data?.track;
  const isEnrolled = enrollmentCheck?.data?.data?.isEnrolled ?? false;
  const isManager = useIsTrackManager(currentUser, track);
  const isMember = (isEnrolled || isManager) && isAuthenticated;

  const members = useMemo(() => {
    const m = membersData?.data?.data;
    return [...(m?.instructors || []), ...(m?.students || [])];
  }, [membersData]);

  const category = track ? getTrackCategory(track) : null;
  const categoryLabelKey = getTrackCategoryLabelKey(category);
  const categoryStyle = getTrackCategoryStyle(category);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col min-h-full">
      <BackButton navigate={navigate} trackId={trackId} name={track?.name} t={t} />
      <IdentityBar
        track={track}
        category={category}
        categoryLabelKey={categoryLabelKey}
        categoryStyle={categoryStyle}
        members={members}
        t={t}
      />
      <TabBar trackId={trackId} tab={tab} t={t} />

      {isError ? (
        <ErrorDisplay message={t('errorLoadingCourses', 'Failed to load track')} onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loading />
        </div>
      ) : !isMember ? (
        <MembersOnlyNotice t={t} />
      ) : (
        <>
          {activeTab === 'chat' && (
            <ChatTab trackId={trackId} currentUserId={currentUserIdOf(currentUser)} t={t} />
          )}
          {activeTab === 'records' && (
            <RecordsTab trackId={trackId} isManager={isManager} t={t} />
          )}
          {activeTab === 'files' && (
            <FilesTab trackId={trackId} isManager={isManager} t={t} />
          )}
          {activeTab === 'videos' && (
            <VideosTab trackId={trackId} isManager={isManager} t={t} />
          )}
        </>
      )}
    </div>
  );
}

function BackButton({ navigate, trackId, name, t }) {
  return (
    <button
      onClick={() => navigate(`/tracks/${trackId}`)}
      className="flex items-center gap-2 text-body-2 text-neutral-500 hover:text-primary-600 transition-colors mb-4"
    >
      <HiArrowLeft className="w-5 h-5 ltr:rotate-0 rtl:rotate-180" />
      <span>{name || t('track', 'Track')}</span>
    </button>
  );
}

function IdentityBar({ track, category, categoryLabelKey, categoryStyle, members, t }) {
  return (
    <div className="bg-surface-lowest border border-outline rounded-xl shadow-elevation-1 p-5 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-600/10">
          <HiOutlineAcademicCap className="h-6 w-6 text-primary-600" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-heading-5 text-neutral-900 truncate">{track?.name}</h1>
          <p className="text-caption text-neutral-500 mt-0.5">
            {t('workspace', 'Workspace')}
          </p>
        </div>
        {category && (
          <Chip tone={categoryStyle} icon={getTrackCategoryIcon(category)} className="shrink-0">
            {t(categoryLabelKey, category)}
          </Chip>
        )}
        {/* Member avatar stack */}
        <div
          className="flex items-center -space-x-2 rtl:space-x-2"
          title={`${members.length} ${t('memberAvatarStack', 'members')}`}
        >
          {members.slice(0, 5).map((m) => (
            <img
              key={m._id}
              src={
                m.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  m.fullName || m.username || '?'
                )}&background=random`
              }
              alt={m.fullName || m.username}
              className="w-8 h-8 rounded-full border-2 border-surface-lowest object-cover"
            />
          ))}
          {members.length > 5 && (
            <span className="w-8 h-8 rounded-full border-2 border-surface-lowest bg-surface-high flex items-center justify-center text-caption font-semibold text-neutral-600">
              +{members.length - 5}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBar({ trackId, tab, t }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-surface border border-outline rounded-xl mb-4 overflow-x-auto no-scrollbar">
      {TABS.map((tabKey) => {
        const Icon = TAB_ICONS[tabKey];
        return (
          <NavLink
            key={tabKey}
            to={`/tracks/${trackId}/workspace/${tabKey}`}
            replace
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-button whitespace-nowrap transition-colors ${
                isActive || (!tab && tabKey === 'chat')
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-600 hover:bg-surface-highest'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {t(TAB_KEYS[tabKey], tabKey)}
          </NavLink>
        );
      })}
    </div>
  );
}

function MembersOnlyNotice({ t }) {
  return (
    <div className="bg-surface-lowest border border-outline rounded-xl p-8 text-center">
      <HiOutlineAcademicCap className="w-10 h-10 mx-auto text-neutral-400" strokeWidth={1.3} />
      <p className="text-body-1 text-neutral-600 mt-3">
        {t('workspaceMembersOnly', 'This workspace is available to approved track members only.')}
      </p>
    </div>
  );
}
