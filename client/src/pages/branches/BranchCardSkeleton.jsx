/**
 * Branch card skeleton — mirrors the final card anatomy
 * (gradient band + body + bordered meta footer) so the loading
 * state previews the real layout instead of a generic block.
 *
 * Uses the theme-aware surface tokens: bg-neutral-100 is white in
 * light mode and the #1c1b1d card layer in dark mode.
 */
export default function BranchCardSkeleton() {
  return (
    <div className="bg-neutral-100 border border-outline rounded-xl overflow-hidden animate-pulse">
      {/* Header band placeholder */}
      <div className="h-28 bg-neutral-300" />

      {/* Body */}
      <div className="p-4 sm:p-6">
        {/* Name */}
        <div className="h-5 bg-neutral-300 rounded w-2/3" />
        {/* Location */}
        <div className="h-3 bg-neutral-300 rounded w-1/2 mt-2.5" />
        <div className="h-3 bg-neutral-300 rounded w-5/6 mt-1.5" />

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline">
          <div className="h-3 bg-neutral-300 rounded w-20" />
          <div className="h-3 bg-neutral-300 rounded w-16" />
        </div>
      </div>
    </div>
  );
}