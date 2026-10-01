import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { toast } from 'react-hot-toast';
import { HiArrowLeft, HiOutlineAcademicCap } from 'react-icons/hi2';
import { useTrackDetail, useCheckEnrollment, useCurrentUser, useTrackEnrollRequests } from '@hooks/queries/useCourse';
import { useRequestEnrollment, useCancelEnrollmentRequest, useDecideEnrollmentRequest } from '@hooks/mutations/useCourseMutations';
import useRequireAuth from '@hooks/useRequireAuth';
import { Loading, ErrorDisplay, PageBanner, Chip } from '@components/common';
import BranchCard from './BranchCard';
import TrackMembersPanel from './TrackMembersPanel';
import {
  getTrackCategory,
  getTrackCategoryLabelKey,
} from '@/utils/trackCategories';

export default function TrackDetailController() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const content = useIntlayer('courses');
  const { requireAuth } = useRequireAuth();

  const { data, isLoading, isError, refetch } = useTrackDetail(trackId);
  const { data: enrollmentCheck } = useCheckEnrollment(trackId);
  const { data: currentUserResp } = useCurrentUser();
  const requestMutation = useRequestEnrollment();
  const cancelMutation = useCancelEnrollmentRequest();
  const decideMutation = useDecideEnrollmentRequest();
  const [selectedBranch, setSelectedBranch] = useState('');

  const track = data?.data?.data?.track;
  const branches = data?.data?.data?.branches ?? [];
  const isEnrolled = enrollmentCheck?.data?.data?.isEnrolled ?? false;
  const pendingRequest = enrollmentCheck?.data?.data?.pendingRequest ?? null;

  // Manager detection (same rules as the server's canManageTrack)
  const currentUser = currentUserResp?.data || currentUserResp;
  const isManager =
    !!currentUser &&
    !!track &&
    (currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      (currentUser.role === 'branch_admin' &&
        String(currentUser.branchId?._id || currentUser.branchId || '') === String(track.branchId || '')) ||
      (currentUser.role === 'instructor' &&
        (track.instructorIds || []).some((id) => String(id) === String(currentUser._id))));

  // Manager-only + polled: non-managers would get a 403 on the review
  // endpoint, and polling keeps the pending queue fresh while the page is open.
  const { data: pendingQueueResp } = useTrackEnrollRequests(trackId, 'pending', {
    enabled: isManager,
    poll: isManager,
  });
  const pendingQueue = isManager ? pendingQueueResp?.data?.data?.requests ?? [] : [];

  // Category chip — prefers the dedicated field, falls back to the
  // legacy "[Category]" description prefix (see utils/trackCategories.js).
  const category = getTrackCategory(track);
  const categoryLabelKey = getTrackCategoryLabelKey(category);

  const handleRequestEnroll = () => {
    requireAuth(async () => {
      if (!selectedBranch) {
        toast.error(content.selectBranch.value);
        return;
      }
      try {
        await requestMutation.mutateAsync({ trackId, branchId: selectedBranch });
        toast.success(content.requestSubmitted.value);
      } catch (err) {
        toast.error(err?.response?.data?.error?.message || content.requestError.value);
      }
    });
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest?._id) return;
    try {
      await cancelMutation.mutateAsync(pendingRequest._id);
      toast.success(content.requestCancelled.value);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || content.requestError.value);
    }
  };

  const handleDecide = async (requestId, decision) => {
    try {
      await decideMutation.mutateAsync({ requestId, decision });
      toast.success(decision === 'approved' ? content.requestApproved.value : content.requestRejected.value);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || content.decideError.value);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 flex justify-center">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ErrorDisplay message={content.errorLoadingCourses.value} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/branches')}
        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors mb-6"
      >
        <HiArrowLeft className="w-5 h-5" />
        <span className="text-body-2">{content.allCourses.value}</span>
      </button>

      {/* Track header — signature gradient banner (work order v2 §1) */}
      <PageBanner
        title={track?.name}
        icon={HiOutlineAcademicCap}
        subtitle={
          track?.createdAt &&
          `Created ${new Date(track.createdAt).toLocaleDateString()}`
        }
        className="mb-6"
      >
        {category && (
          <Chip onDark size="sm">
            {content[categoryLabelKey]?.value ?? category}
          </Chip>
        )}
      </PageBanner>

      {/* Enroll Section — request → approval flow (nothing is instant anymore) */}
      {!isEnrolled && !pendingRequest && !isManager && (
        <div className="bg-surface-lowest border border-outline rounded-xl p-6 mb-6 shadow-elevation-1">
          <h2 className="text-heading-5 mb-4">{content.enroll.value}</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="flex-1 h-11 px-3 rounded-xl border border-outline bg-surface-lowest text-neutral-900 text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">{content.selectBranch.value}</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRequestEnroll}
              disabled={requestMutation.isPending || !selectedBranch}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {content.requestEnrollment.value}
            </button>
          </div>
        </div>
      )}

      {/* Pending request banner — request submitted, awaiting manager review */}
      {!isEnrolled && pendingRequest && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
          <span className="flex-1 min-w-0">
            <span className="block text-body-1 font-semibold text-neutral-900">
              {content.requestPending.value}
            </span>
            <span className="block text-body-2 text-neutral-500 mt-0.5">
              {content.requestPendingHint.value}
            </span>
          </span>
          <button
            onClick={handleCancelRequest}
            disabled={cancelMutation.isPending}
            className="px-4 py-2 border border-outline text-neutral-600 rounded-xl text-sm font-medium hover:bg-surface-high transition-colors disabled:opacity-50"
          >
            {content.cancelRequest.value}
          </button>
        </div>
      )}

      {/* Manager: track members panel (work order §5c — direct add/remove) */}
      {isManager && <TrackMembersPanel trackId={trackId} />}

      {/* Manager: pending enrollment requests review queue */}
      {isManager && pendingQueue.length > 0 && (
        <div className="bg-surface-lowest border border-outline rounded-xl p-6 mb-6 shadow-elevation-1">
          <h2 className="text-heading-5 mb-1">{content.pendingRequests.value}</h2>
          <p className="text-caption text-neutral-500 mb-4">
            {pendingQueue.length}
          </p>
          <ul className="flex flex-col gap-3">
            {pendingQueue.map((request) => (
              <li
                key={request._id}
                className="flex flex-wrap items-center gap-3 border border-outline rounded-xl p-3"
              >
                <img
                  src={
                    request.user_id?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      request.user_id?.fullName || request.user_id?.username || '?'
                    )}&background=random`
                  }
                  alt={request.user_id?.fullName || ''}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body-1 font-semibold text-neutral-900 truncate">
                    {request.user_id?.fullName || request.user_id?.username}
                  </p>
                  <p className="text-caption text-neutral-500">
                    {request.branch_id?.name} · {content.requestedAt.value}{' '}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDecide(request._id, 'approved')}
                  disabled={decideMutation.isPending}
                  className="px-4 py-1.5 bg-success text-white rounded-xl text-caption font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {content.approveRequest.value}
                </button>
                <button
                  onClick={() => handleDecide(request._id, 'rejected')}
                  disabled={decideMutation.isPending}
                  className="px-4 py-1.5 border border-outline text-neutral-600 rounded-xl text-caption font-semibold hover:bg-surface-high transition-colors disabled:opacity-50"
                >
                  {content.rejectRequest.value}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enrolled badge + workspace entry */}
      {(isEnrolled || isManager) && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-success font-medium">
            {isManager && !isEnrolled ? content.workspace.value : content.enrolled.value}
          </span>
          <Link
            to={`/tracks/${trackId}/workspace/chat`}
            className="ml-auto px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            {content.openWorkspace.value}
          </Link>
        </div>
      )}

      {/* Branches list */}
      <h2 className="text-heading-4 mb-4">{content.branches.value}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <BranchCard
            key={branch._id}
            branch={branch}
            enrolledCount={branch.enrolledCount || 0}
            isEnrolled={
              data?.data?.data?.myEnrollment?.branch?._id?.toString() === branch._id
            }
          />
        ))}
      </div>

      {branches.length === 0 && (
        <p className="text-body-1 text-neutral-500 text-center py-12">
          {content.noCoursesMessage.value}
        </p>
      )}
    </div>
  );
}
