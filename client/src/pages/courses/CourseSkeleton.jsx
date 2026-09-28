export default function CourseSkeleton() {
  return (
    <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-lg bg-neutral-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-neutral-200 rounded w-2/3" />
          <div className="h-3 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 rounded w-full" />
        <div className="h-3 bg-neutral-200 rounded w-3/4" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 bg-neutral-200 rounded-full w-20" />
        <div className="h-8 bg-neutral-200 rounded-full w-16" />
      </div>
    </div>
  );
}
