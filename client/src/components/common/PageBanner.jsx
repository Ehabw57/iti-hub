/**
 * NetworkPattern — the connected node-and-line motif borrowed from the
 * ITI logo (work order v2 §1), rendered as a subtle white constellation
 * layered over the gradient banner.
 *
 * - Static SVG, no animation: a decorative texture, kept restrained.
 * - Sits at low opacity in light mode and brightens slightly in dark
 *   mode so the pattern stays legible against the dark gradient.
 */
function NetworkPattern() {
  // Node constellation: [cx, cy, radius]
  const nodes = [
    [36, 42, 3], [118, 22, 2], [204, 58, 3.5], [298, 28, 2],
    [396, 66, 3], [446, 172, 3.5], [316, 196, 2.5], [180, 204, 3],
    [64, 158, 2], [128, 108, 2], [262, 140, 3], [402, 118, 2],
  ];
  // Thin connectors between neighbouring nodes
  const links = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 11], [4, 5], [5, 6], [6, 7],
    [7, 8], [8, 0], [9, 0], [9, 2], [10, 2], [10, 6], [10, 11], [11, 4],
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 240"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.13] dark:opacity-[0.2]"
    >
      {links.map(([a, b], i) => (
        <line
          key={`link-${i}`}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
      {nodes.map(([cx, cy, r], i) => (
        <circle key={`node-${i}`} cx={cx} cy={cy} r={r} fill="currentColor" />
      ))}
    </svg>
  );
}

/**
 * PageBanner — the ITI Hub signature page-header treatment (work order v2 §1).
 *
 * ITI's real identity marks every internal page with a diagonal
 * ink-navy → maroon gradient banner topped by a subtle white
 * network/node line pattern. This component adopts that exact pattern
 * so every major section shares one recognizable header.
 *
 * - Gradient stops are pinned via the --banner-from / --banner-to
 *   tokens and are intentionally NOT remapped in dark mode.
 * - Title/subtitle render in white directly on the gradient, which
 *   passes contrast in both modes.
 * - RTL-safe: symmetric artwork, logical-property padding only.
 *
 * @param {string|import('react').ReactNode} title    Page heading
 * @param {string|import('react').ReactNode} [subtitle] Supporting line
 * @param {import('react-icons/hi2').IconType} [icon] Leading icon chip
 * @param {import('react').ReactNode} [children]    Badges / actions slot
 * @param {boolean} [compact] Tighter padding for nested sub-headers
 * @param {string} [className] Extra classes for the banner root
 * @param {string} [image] Optional background image URL (e.g. branch
 *   coverImage). Rendered under a dark ink-navy scrim so the white
 *   title/subtitle keep WCAG contrast; the gradient stays as fallback.
 */
export default function PageBanner({
  title,
  subtitle,
  icon: Icon,
  children,
  compact = false,
  className = '',
  image,
}) {
  return (
    <header
      className={`relative overflow-hidden rounded-xl bg-brand-gradient shadow-elevation-2 ${className}`}
    >
      {/* Optional branch cover image — dark scrim keeps white text legible */}
      {image && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-ink-navy/80"
          />
        </>
      )}

      {/* Connected node-and-line texture — the ITI network motif */}
      <NetworkPattern />

      {/* Soft light bloom in the leading corner — depth without extra color */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 ltr:-left-24 rtl:-right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />

      <div
        className={`relative z-10 flex flex-wrap items-center gap-4 ${
          compact ? 'p-5 sm:p-6' : 'p-6 sm:p-9'
        }`}
      >
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-heading-2 text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-body-2 text-white/75">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
