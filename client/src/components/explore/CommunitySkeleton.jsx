/**
 * Skeleton loader for community cards in explore page
 */
export default function CommunitySkeleton() {
  return (
    <div className="rounded-xl shadow-elevation-2 bg-neutral-50 p-0 flex flex-col overflow-hidden animate-pulse">
      {/* Cover image skeleton */}
      <div className="w-full h-32 bg-neutral-200" />
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Profile picture and name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-neutral-200" />
          <div className="flex-1">
            <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
            <div className="flex gap-2">
              <div className="h-5 bg-neutral-200 rounded w-16" />
              <div className="h-5 bg-neutral-200 rounded w-20" />
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-neutral-200 rounded w-full" />
          <div className="h-4 bg-neutral-200 rounded w-5/6" />
          <div className="h-4 bg-neutral-200 rounded w-4/6" />
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="h-4 bg-neutral-200 rounded w-20" />
          <div className="h-4 bg-neutral-200 rounded w-16" />
          <div className="h-4 bg-neutral-200 rounded w-20" />
        </div>
        
        {/* Button */}
        <div className="h-10 bg-neutral-200 rounded mt-auto" />
      </div>
    </div>
  );
}
