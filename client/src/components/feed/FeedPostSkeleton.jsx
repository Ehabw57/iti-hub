/**
 * Loading skeleton for feed post item
 */
export default function FeedPostSkeleton() {
  return (
    <article className="bg-neutral-100 rounded-lg shadow-sm mb-4 max-w-2xl mx-auto animate-pulse">
      {/* Post header */}
      <div className="p-4 flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 rounded-full bg-neutral-200" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Name skeleton */}
              <div className="h-4 w-32 bg-neutral-200 rounded mb-2" />
              {/* Username & timestamp skeleton */}
              <div className="h-3 w-40 bg-neutral-200 rounded" />
            </div>
            {/* Menu skeleton */}
            <div className="w-5 h-5 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 pb-3">
        {/* Text skeleton - 3 lines */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-neutral-200 rounded w-full" />
          <div className="h-3 bg-neutral-200 rounded w-11/12" />
          <div className="h-3 bg-neutral-200 rounded w-9/12" />
        </div>

        {/* Image skeleton */}
        <div className="w-full h-64 bg-neutral-200 rounded-lg mb-3" />

        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-neutral-200 rounded-full" />
          <div className="h-6 w-20 bg-neutral-200 rounded-full" />
          <div className="h-6 w-14 bg-neutral-200 rounded-full" />
        </div>
      </div>

      {/* Interaction bar */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-neutral-200 rounded" />
          <div className="w-8 h-4 bg-neutral-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-neutral-200 rounded" />
          <div className="w-8 h-4 bg-neutral-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-neutral-200 rounded" />
          <div className="w-8 h-4 bg-neutral-200 rounded" />
        </div>
        <div className="w-5 h-5 bg-neutral-200 rounded" />
      </div>
    </article>
  );
}
