import { useParams, useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { HiArrowLeft, HiOutlineAcademicCap } from 'react-icons/hi2';
import { useRoundTracks, useBranchDetail } from '@hooks/queries/useCourse';
import { Loading, ErrorDisplay, PageBanner, Chip } from '@components/common';
import TrackCard from '../courses/TrackCard';
import branchesContent from '@/content/branches/branches.content';

/** Safe dictionary accessor — never crashes if a key is missing */
const useBranchesContent = () => {
  const content = useIntlayer(branchesContent.key);
  return (key, fallback = '') => content?.[key]?.value ?? fallback;
};

/**
 * Round tracks — third level of the Branches → Rounds → Tracks drill-down.
 * Lists the tracks running inside one round of one branch.
 */
export default function RoundTracksController() {
  const { branchId, roundId } = useParams();
  const navigate = useNavigate();
  const t = useBranchesContent();

  const { data, isLoading, isError, refetch } = useRoundTracks(roundId);
  // Branch name for the breadcrumb (cached from the branch detail page)
  const { data: branchData } = useBranchDetail(branchId);

  const round = data?.data?.data?.round;
  const tracks = data?.data?.data?.tracks ?? [];
  const branch = branchData?.data?.data?.branch;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 flex justify-center">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <ErrorDisplay message={t('errorLoadingTracks', 'Failed to load tracks')} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/branches/${branchId}`)}
        className="flex items-center gap-2 text-body-2 text-neutral-500 hover:text-primary-600 transition-colors mb-6"
      >
        <HiArrowLeft className="w-5 h-5 ltr:rotate-0 rtl:rotate-180" />
        <span>
          {branch?.name ? `${t('backToBranch', 'Back to branch')} — ${branch.name}` : t('backToBranch', 'Back to branch')}
        </span>
      </button>

      {/* Round header — signature gradient banner (work order v2 §1) */}
      <PageBanner
        title={round?.name}
        subtitle={branch?.name}
        icon={HiOutlineAcademicCap}
        className="mb-6"
      >
        <Chip
          onDark
          className={
            round?.isActive
              ? 'bg-emerald-400/25 text-emerald-100 border-emerald-300/50'
              : 'bg-white/10 text-white/75'
          }
        >
          {round?.isActive ? t('active', 'Active') : t('closed', 'Closed')}
        </Chip>
      </PageBanner>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <div className="bg-neutral-100 border border-outline rounded-xl py-16 px-6 text-center">
          <HiOutlineAcademicCap className="w-10 h-10 mx-auto text-neutral-500" strokeWidth={1.3} />
          <h2 className="text-heading-5 text-neutral-900 mt-3 mb-1">{t('noTracksTitle', 'No tracks in this round')}</h2>
          <p className="text-body-2 text-neutral-500">
            {t('noTracksMessage', 'This round has no tracks yet. Check back later!')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <TrackCard
              key={track._id}
              track={track}
              enrolledCount={track.studentCount || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
