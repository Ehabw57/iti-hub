/**
 * @fileoverview Loading skeleton for notification items
 * Displays animated placeholder while notifications are loading
 */

/**
 * Loading skeleton component for NotificationItem
 * Matches the dimensions and layout of a real notification item
 * 
 * @example
 * {isLoading && (
 *   <>
 *     <NotificationSkeleton />
 *     <NotificationSkeleton />
 *     <NotificationSkeleton />
 *   </>
 * )}
 */
export const NotificationSkeleton = () => {
  return (
    <div 
      className="p-4 border-b animate-pulse" 
      style={{ borderColor: 'var(--color-neutral-200)' }}
    >
      <div className="flex gap-3">
        {/* Avatar skeleton */}
        <div className="shrink-0">
          <div 
            className="w-12 h-12 rounded-full" 
            style={{ backgroundColor: 'var(--color-neutral-300)' }}
          />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          {/* Text lines */}
          <div 
            className="h-4 rounded w-3/4" 
            style={{ backgroundColor: 'var(--color-neutral-300)' }}
          />
          <div 
            className="h-4 rounded w-1/2" 
            style={{ backgroundColor: 'var(--color-neutral-300)' }}
          />
          
          {/* Timestamp */}
          <div 
            className="h-3 rounded w-1/4" 
            style={{ backgroundColor: 'var(--color-neutral-300)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationSkeleton;
