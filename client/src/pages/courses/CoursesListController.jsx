import { useIntlayer } from 'react-intlayer';
import { useTracks, useMyEnrollments } from '@hooks/queries/useCourse';
import { useAuthStore } from '@store/auth';
import { Loading, ErrorDisplay } from '@components/common';
import CourseSkeleton from './CourseSkeleton';
import TrackCard from './TrackCard';

function MyLearningStrip() {
  const content = useIntlayer('courses');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading } = useMyEnrollments();

  if (!isAuthenticated || isLoading) return null;

  const enrollments = data?.data?.enrollments ?? [];
  if (enrollments.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-heading-5 text-neutral-900 mb-4">
        {content.enrollments?.value || 'My Enrollments'}
      </h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {enrollments.map(({ track, branch }) => (
          <a
            key={track?._id}
            href={`/tracks/${track?._id}`}
            className="shrink-0 w-56 bg-neutral-100 border border-outline rounded-xl p-4 hover:shadow-elevation-2 transition-shadow"
          >
            <p className="text-body-2 font-semibold text-neutral-900 truncate">
              {track?.name}
            </p>
            {branch?.name && (
              <p className="text-caption text-neutral-500 truncate mt-0.5">{branch.name}</p>
            )}
            <span className="inline-block mt-3 text-caption font-semibold text-primary-600">
              {(content.continueLearning?.value) || 'Continue'} →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default function CoursesListController() {
  const content = useIntlayer('courses');
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
  } = useTracks();

  const tracks = data?.pages?.flatMap((page) => page.data?.data?.tracks ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-heading-3 mb-6">{content.allCourses.value}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <ErrorDisplay message={content.errorLoadingCourses.value} onRetry={refetch} />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-heading-3 mb-2">{content.noCoursesTitle.value}</h1>
        <p className="text-body-1 text-neutral-500">{content.noCoursesMessage.value}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-heading-2 text-neutral-900">{content.allCourses.value}</h1>
        <p className="text-body-2 text-neutral-500 mt-1">
          {(content.pageSubtitle?.value) || ''}
        </p>
      </header>

      {/* My Learning (authenticated users with enrollments) */}
      <MyLearningStrip />

      {/* Tracks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <TrackCard
            key={track._id}
            track={track}
            enrolledCount={track.enrolledCount || 0}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-6 py-2.5 bg-surface-lowest border border-outline text-neutral-700 rounded-full hover:bg-surface-low transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? content.loadingMore.value : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
