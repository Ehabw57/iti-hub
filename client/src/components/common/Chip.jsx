/**
 * Chip — ITI Hub's single, branded chip/tag/badge style (reissued work
 * order §3). A "dot-slug" chip: small 6px-radius pill with a hairline
 * tinted border and a leading colored dot. The default tone carries the
 * ITI-red brand; callers keep their color-coding by passing a `tone`
 * (e.g. the cat-* category classes from utils/trackCategories.js) — the
 * shape changes, the color-coding doesn't.
 */
export default function Chip({
  children,
  tone,
  dot = true,
  dotColor,
  hash = false,
  size = 'sm',
  icon: Icon,
  onRemove,
  removeLabel = 'Remove',
  onDark = false,
  className = '',
  ...rest
}) {
  const sizeClasses = size === 'xs' ? 'px-2 h-6 text-[11px]' : 'px-2.5 h-7 text-caption';

  // Shape — the site's chip language: 6px radius + hairline border
  const shapeClasses = 'inline-flex items-center gap-1.5 rounded-md border font-semibold';

  // Tone — a caller-provided tone wins outright (category colors, solid
  // fills, success/error states) so color utilities never conflict.
  const toneClasses =
    tone ||
    (onDark
      ? 'bg-white/15 text-white border-white/25 backdrop-blur-sm'
      : 'border-primary-600/25 bg-primary-600/10 text-primary-600');

  const dotClasses = size === 'xs' ? 'w-1.5 h-1.5' : 'w-[6px] h-[6px]';

  return (
    <span className={`${shapeClasses} ${sizeClasses} ${toneClasses} ${className}`} {...rest}>
      {Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        dot && (
          <span
            className={`${dotClasses} rounded-full shrink-0 ${dotColor || 'bg-current'}`}
            aria-hidden="true"
          />
        )
      )}
      {hash && <span aria-hidden="true">#</span>}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="ltr:-mr-1 rtl:-ml-1 flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors shrink-0"
        >
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
