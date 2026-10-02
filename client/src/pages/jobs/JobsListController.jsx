import { useNavigate } from 'react-router-dom';
import { HiOutlineBriefcase, HiOutlineMapPin, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import { useJobs } from '@hooks/queries/useCourse';
import { ErrorDisplay, Chip } from '@components/common';

/**
 * JobsListController — X-style job board page.
 * Hairline rows: role/company meta, location + tags, red "Apply" outline pill
 * opening the external apply URL. Data from GET /jobs (auth required) —
 * guests get a sign-in prompt card instead of the list.
 */
export default function JobsListController() {
  const content = useIntlayer('jobs');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, refetch } = useJobs();

  // Envelope: axios response → body {success, data:{jobs}} (sendSuccess)
  const jobs = data?.data?.data?.jobs ?? [];

  // Guests: API is auth-gated — clean sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <HiOutlineBriefcase className="w-6 h-6 text-primary-600" strokeWidth={1.7} />
        </div>
        <h2 className="text-heading-4 text-neutral-900 mb-2 text-center">
          {content.signInToView.value}
        </h2>
        <p className="text-body-2 text-neutral-500 mb-6 text-center">
          {content.signIpRequiredMessage.value}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-10 px-5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
          >
            {content.signIn.value}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-0">
      {/* Page header — X-style: title block above hairline */}
      <header className="border-b border-neutral-200 px-4 sm:px-0 py-4">
        <h1 className="text-heading-2 text-neutral-900">
          {content.pageTitle.value}
        </h1>
        <p className="text-body-2 text-neutral-500 mt-1">
          {content.pageSubtitle.value}
        </p>
      </header>

      {isLoading && (
        <div className="divide-y divide-neutral-200 border-b border-neutral-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 sm:px-0 py-4 animate-pulse">
              <div className="h-4 w-2/5 rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-3/5 rounded bg-neutral-100" />
              <div className="mt-3 flex items-center gap-2">
                <div className="h-6 w-20 rounded-full bg-neutral-100" />
                <div className="h-6 w-24 rounded-full bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="py-10 px-4">
          <ErrorDisplay message={content.errorLoading.value} onRetry={refetch} />
        </div>
      )}

      {!isLoading && !isError && jobs.length === 0 && (
        <div className="py-16 text-center px-4">
          <h2 className="text-heading-4 text-neutral-900 mb-2">
            {content.emptyTitle.value}
          </h2>
          <p className="text-body-2 text-neutral-500">
            {content.emptyMessage.value}
          </p>
        </div>
      )}

      {!isLoading && !isError && jobs.length > 0 && (
        <ol className="divide-y divide-neutral-200 border-b border-neutral-200">
          {jobs.map((job) => (
            <li
              key={job._id}
              className="px-4 sm:px-0 py-4 hover:bg-neutral-100/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-body-1 font-bold text-neutral-900 leading-snug">
                    {job.title}
                  </p>
                  <p className="text-body-2 text-neutral-500 mt-0.5">
                    {job.company}
                    {job.location ? (
                      <>
                        <span className="mx-1">·</span>
                        <HiOutlineMapPin
                          className="w-3.5 h-3.5 inline-block -mt-0.5 rtl:scale-x-[-1]"
                          strokeWidth={1.7}
                        />
                        {job.location}
                      </>
                    ) : null}
                  </p>

                  {job.description && (
                    <p className="text-body-2 text-neutral-700 mt-2 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {Array.isArray(job.tags) && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.tags.map((tag) => (
                        <Chip key={tag} size="xs" hash>
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}

                  {job.postedBy && (
                    <p className="text-caption text-neutral-500 mt-3">
                      {content.postedBy.value}{' '}
                      <span className="text-neutral-700 font-medium">
                        {job.postedBy.fullName || `@${job.postedBy.username}`}
                      </span>
                    </p>
                  )}
                </div>

                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 h-8 px-4 inline-flex items-center gap-1.5 rounded-full border border-primary-600 text-primary-600 text-sm font-semibold hover:bg-primary-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    {content.apply.value}
                    <HiOutlineArrowTopRightOnSquare
                      className="w-4 h-4"
                      strokeWidth={1.7}
                    />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
