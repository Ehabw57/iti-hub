import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  HiOutlinePlayCircle,
  HiOutlineVideoCamera,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import { useTrackVideos } from '@hooks/queries/useCourse';
import { useAddTrackVideo, useDeleteTrackVideo } from '@hooks/mutations/useCourseMutations';
import { Loading } from '@components/common';
import ConfirmDialog from '@components/common/ConfirmDialog';

/** Format seconds → "1h 05m" / "12m 30s" / "45s"; null stays null. */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/**
 * Videos tab — the track's video library (work order §3). Grid of video
 * cards (thumbnail, title, duration when available) opening the video in a
 * new tab. Managers (instructor / branch admin / super admin) get an
 * add-video form (title + video URL + optional thumbnail) and delete
 * actions; students are view-only.
 */
export default function VideosTab({ trackId, isManager, t }) {
  const { data, isLoading } = useTrackVideos(trackId);
  const addMutation = useAddTrackVideo();
  const deleteMutation = useDeleteTrackVideo();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const videos = data?.data?.data?.videos ?? [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;
    try {
      await addMutation.mutateAsync({
        trackId,
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || null,
      });
      toast.success(t('videoAdded', 'Video added'));
      setTitle('');
      setVideoUrl('');
      setThumbnailUrl('');
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('videoAddError', 'Failed to add video'));
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteMutation.mutateAsync({ id: confirmId });
      toast.success(t('videoDeleted', 'Video deleted'));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || t('videoDeleteError', 'Failed to delete video'));
    } finally {
      setConfirmId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      {/* Manager toolbar + add form */}
      {isManager && !showForm && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 h-10 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            {t('addVideo', 'Add video')}
          </button>
        </div>
      )}
      {isManager && showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 bg-surface-lowest border border-outline rounded-xl p-4 flex flex-col gap-3"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('videoTitle', 'Video title')}
            className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
          />
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={t('videoUrl', 'Video URL (YouTube, Drive, ... )')}
            className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
          />
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder={t('thumbnailUrl', 'Thumbnail URL (optional)')}
            className="h-10 px-3 rounded-xl border border-outline bg-surface-low text-neutral-900 text-sm focus:outline-none focus:border-primary-600"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim() || !videoUrl.trim() || addMutation.isPending}
              className="px-4 h-9 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {t('save', 'Save')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 h-9 border border-outline text-neutral-600 rounded-xl text-sm hover:bg-surface-high transition-colors"
            >
              {t('cancel', 'Cancel')}
            </button>
          </div>
        </form>
      )}

      {videos.length === 0 ? (
        <div className="bg-surface-lowest border border-outline rounded-xl py-12 px-6 text-center">
          <HiOutlineVideoCamera className="w-10 h-10 mx-auto text-neutral-400" strokeWidth={1.3} />
          <p className="text-body-2 text-neutral-500 mt-3">{t('videosEmpty', 'No videos yet.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const duration = formatDuration(video.durationSeconds);
            return (
              <div
                key={video._id}
                className="group relative bg-surface-lowest border border-outline rounded-xl overflow-hidden flex flex-col"
              >
                {/* Clickable thumbnail */}
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video bg-surface-high"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <HiOutlineVideoCamera className="w-10 h-10 text-neutral-400" strokeWidth={1.3} />
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                    <HiOutlinePlayCircle className="w-10 h-10 text-white drop-shadow-lg opacity-90" strokeWidth={1.3} />
                  </span>
                  {duration && (
                    <span className="absolute bottom-1.5 ltr:right-1.5 rtl:left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[11px] font-semibold">
                      {duration}
                    </span>
                  )}
                </a>
                <div className="p-3 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-body-2 font-semibold text-neutral-900 truncate" title={video.title}>
                      {video.title}
                    </p>
                    <p className="text-caption text-neutral-500 mt-0.5 truncate">
                      {video.uploadedBy?.fullName || video.uploadedBy?.username || ''}
                      {video.uploadedAt && ` · ${new Date(video.uploadedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isManager && (
                    <>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1.5 text-neutral-400 hover:text-primary-600 transition-colors"
                        title={t('openVideo', 'Open video')}
                        aria-label={`${t('openVideo', 'Open video')}: ${video.title}`}
                      >
                        <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setConfirmId(video._id)}
                        className="shrink-0 p-1.5 text-neutral-400 hover:text-primary-600 transition-colors"
                        title={t('deleteVideo', 'Delete video')}
                        aria-label={`${t('deleteVideo', 'Delete video')}: ${video.title}`}
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        variant="danger"
        title={t('confirmDeleteTitle', 'Delete?')}
        message={t('confirmDeleteVideo', 'This video will be permanently removed.')}
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
      />
    </div>
  );
}
