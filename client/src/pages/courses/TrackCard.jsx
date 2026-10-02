import { useIntlayer } from 'react-intlayer';
import { HiOutlineAcademicCap, HiOutlineUsers } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { Chip } from '@components/common';
import {
  parseTrackDescription,
  getTrackCategory,
  getTrackCategoryStyle,
  getTrackCategoryLabelKey,
  getTrackCategoryIcon,
} from '@/utils/trackCategories';

/**
 * Track card — matches /screens courses mockup.
 * Gradient header band + category chip, white body with title,
 * divider and meta footer.
 */
export default function TrackCard({ track, enrolledCount = 0 }) {
  const content = useIntlayer('courses');
  const navigate = useNavigate();

  // Category comes from the dedicated Track.category field; the legacy
  // "[Category]" description prefix is only a fallback for old records.
  const category = getTrackCategory(track);
  const { text: descriptionText } = parseTrackDescription(track.description);
  const categoryStyle = getTrackCategoryStyle(category);
  const categoryLabelKey = getTrackCategoryLabelKey(category);

  return (
    <button
      type="button"
      onClick={() => navigate(`/tracks/${track._id}`)}
      className="group w-full text-left bg-neutral-100 border border-outline rounded-xl overflow-hidden hover:shadow-elevation-3 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Gradient header band — crimson → maroon diagonal (real palette) */}
      <div className="relative h-28 bg-gradient-to-br from-primary-600 via-secondary-800 to-secondary-900 flex items-center justify-center">
        {/* Decorative rings */}
        <span className="absolute -top-6 ltr:-right-6 rtl:-left-6 w-24 h-24 rounded-full border-[10px] border-white/10" />
        <span className="absolute -bottom-8 ltr:-left-4 rtl:-right-4 w-28 h-28 rounded-full border-[12px] border-black/5" />
        <HiOutlineAcademicCap className="w-12 h-12 text-white/90 relative" strokeWidth={1.3} />
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-heading-6 text-neutral-900 truncate group-hover:text-primary-600 transition-colors">
          {track.name}
        </h3>

        {/* Category chip — color wayfinding per track type */}
        {category && (
          <Chip
            tone={categoryStyle}
            icon={getTrackCategoryIcon(category)}
            className="mt-2"
          >
            {content[categoryLabelKey]?.value ?? category}
          </Chip>
        )}

        {descriptionText && (
          <p className="text-body-2 text-neutral-500 line-clamp-2 mt-1.5 min-h-[2.5rem]">
            {descriptionText}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline text-caption text-neutral-500">
          {track.createdAt && (
            <span>{new Date(track.createdAt).getFullYear()}</span>
          )}
          <span className="flex items-center gap-1">
            <HiOutlineUsers className="w-3.5 h-3.5" />
            {enrolledCount > 0
              ? `${enrolledCount} ${content.enrolledCount?.value ?? 'enrolled'}`
              : content.track?.value || 'Track'}
          </span>
        </div>
      </div>
    </button>
  );
}
