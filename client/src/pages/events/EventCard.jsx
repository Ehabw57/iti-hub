import {
  HiOutlineMapPin,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineUsers,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi2';
import { Chip } from '@components/common';

/**
 * EventCard — expand-in-place detail view for one event row.
 * Shows date, meta, participating branch chips, teaser/description,
 * attendee count, and the Register/Unregister toggle. Past events are
 * dimmed and can't be registered for.
 */
export default function EventCard({
  event,
  content,
  expanded,
  onToggleExpand,
  onToggleRegister,
  registerPending,
  isPast = false,
}) {
  const startDate = new Date(event.endDate || event.date);
  const time = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li
      className={`px-4 sm:px-0 py-4 hover:bg-neutral-100/50 transition-colors ${isPast ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Date block */}

        <div className="min-w-0 flex-1">
          <p className="text-body-1 font-bold text-neutral-900 leading-snug">
            {event.title}
          </p>
          <p className="text-body-2 text-neutral-500 mt-0.5 flex flex-wrap items-center gap-x-2">
            <span>
              {startDate.toLocaleDateString()} · {time}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <HiOutlineMapPin
                  className="w-3.5 h-3.5 inline-block -mt-0.5 rtl:scale-x-[-1]"
                  strokeWidth={1.7}
                />
                {event.location}
              </span>
            )}
          </p>

          {/* Participating branches */}
          {Array.isArray(event.branchIds) && event.branchIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {event.branchIds.map((branch) => (
                <Chip key={branch._id} size="xs">
                  {branch.name}
                </Chip>
              ))}
            </div>
          )}

          {/* Teaser + expand */}
          {!expanded && event.description && (
            <p className="text-body-2 text-neutral-700 mt-2 line-clamp-2">
              {event.description}
            </p>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            {expanded ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
            {expanded ? content.hideDetails.value : content.viewDetails.value}
          </button>

          {expanded && (
            <div className="mt-3 bg-surface-lowest border border-outline rounded-xl p-4">
              {event.description && (
                <p className="text-body-2 text-neutral-700 whitespace-pre-line">
                  {event.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="inline-flex items-center gap-1.5 text-body-2 text-neutral-600">
                  <HiOutlineUsers className="w-4 h-4 text-neutral-400" strokeWidth={1.7} />
                  {event.attendeeCount || 0} {content.attendees.value}
                </span>
                {event.createdBy && (
                  <span className="text-caption text-neutral-500">
                    {content.createdBy.value}{' '}
                    <span className="text-neutral-700 font-medium">
                      {event.createdBy.fullName || `@${event.createdBy.username}`}
                    </span>
                  </span>
                )}
              </div>
              {event.registerUrl && (
                <a
                  href={event.registerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <HiOutlineArrowTopRightOnSquare className="w-4 h-4" strokeWidth={1.7} />
                  {content.externalLink.value}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Register / Unregister */}
        {!isPast && (
          <button
            type="button"
            onClick={onToggleRegister}
            disabled={registerPending}
            className={`shrink-0 h-8 px-4 rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-50 ${
              event.isRegistered
                ? 'border border-outline text-neutral-700 hover:bg-neutral-100'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {event.isRegistered ? content.unregister.value : content.register.value}
          </button>
        )}
      </div>
    </li>
  );
}
