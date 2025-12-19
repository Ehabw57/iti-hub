# Social App Design System

This design system defines color, typography, components, interaction states, and spacing for a social media app UI. It is tailored to use the Inter typeface and the provided brand colors.

Assumptions (explicit):
- Base font size: 16px
- Base spacing unit: 4px
- Type scaling: consistent optical steps suitable for mobile and desktop
- No new components beyond those listed; variants only within each specified component

If you prefer different base sizes or radius presets, say the word and I’ll adapt the tokens accordingly.

## Colors

Given brand colors:
- Primary (brand red): #DC2626
- Secondary (brand blue): #2563EB
- Status: Success #16A34A, Error #DC2626, Warning #FBBF24, Info #3B82F6

Complementary shades (tints/tones) for Primary and Secondary, plus Neutrals:

- Primary Red scale (light → dark):
  - 50: #FEF2F2
  - 100: #FEE2E2
  - 200: #FECACA
  - 300: #FCA5A5
  - 400: #F87171
  - 500: #EF4444
  - 600: #DC2626 (Primary)
  - 700: #B91C1C
  - 800: #991B1B
  - 900: #7F1D1D

- Secondary Blue scale (light → dark):
  - 50: #EFF6FF
  - 100: #DBEAFE
  - 200: #BFDBFE
  - 300: #93C5FD
  - 400: #60A5FA
  - 500: #3B82F6 (Info)
  - 600: #2563EB (Secondary)
  - 700: #1D4ED8
  - 800: #1E40AF
  - 900: #1E3A8A

- Neutrals (gray, light → dark):
  - 50: #F9FAFB
  - 100: #F3F4F6
  - 200: #E5E7EB
  - 300: #D1D5DB
  - 400: #9CA3AF
  - 500: #6B7280
  - 600: #4B5563
  - 700: #374151
  - 800: #1F2937
  - 900: #111827

Recommended usage:
- Text primary: Neutral 900; secondary: Neutral 600; disabled: Neutral 400
- Background base: #FFFFFF; alt surfaces: Neutral 50 / 100
- Borders/dividers: Neutral 200 / 300
- Focus ring: Secondary 500/600
- Links: Secondary 600 (hover 700)
- Destructive actions: Primary 600 (hover 700)
- Subtle status backgrounds (use opacity of base status color or light tints):
  - Success surface: Success @ 10–12% opacity over white (or #ECFDF5)
  - Error surface: Error @ 10–12% opacity over white (or #FEF2F2)
  - Warning surface: Warning @ 16–20% opacity over white (or #FFFBEB)
  - Info surface: Info @ 10–12% opacity over white (or #EFF6FF)

## Typography

- Font family: Inter, with safe stack: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"`
- Font weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

Hierarchy (sizes in px / line-height in px; rem shown for 16px base):
- H1: 32 / 40 (2.0rem) — 700
- H2: 28 / 36 (1.75rem) — 700
- H3: 24 / 32 (1.5rem) — 600
- H4: 20 / 28 (1.25rem) — 600
- H5: 18 / 26 (1.125rem) — 600
- H6: 16 / 24 (1.0rem) — 600
- Body 1: 16 / 24 (1.0rem) — 400
- Body 2: 14 / 20 (0.875rem) — 400
- Caption: 12 / 16 (0.75rem) — 400
- Button text: 14 / 20 (0.875rem) — 600

Typographic rules:
- Headings use tight tracking, no forced uppercase.
- Paragraph spacing: at least 8–12px between blocks.
- Truncation: use 1–2 line clamp where needed in lists.

## Components

Each component lists Purpose, Variants, Styles (key tokens), and Usage notes.

### Buttons
- Purpose: Trigger actions; emphasize primary flow with brand red.
- Variants: Primary (filled), Secondary (filled), Text (link-style)
- Styles:
  - Size (default): height 40px; padding X: 16px; padding Y: 10px
  - Radius: 8px; Border: 1px solid transparent (Text: transparent)
  - Typography: Inter 14/20, 600
  - Primary: bg Primary 600; text #FFFFFF; hover Primary 700; active Primary 800; disabled bg Neutral 200, text Neutral 500
  - Secondary: bg Secondary 600; text #FFFFFF; hover Secondary 700; active Secondary 800; disabled as above
  - Text: text Secondary 600; hover underline or subtle bg Secondary 50; active Secondary 700; disabled text Neutral 400
  - Focus: 2px focus ring Secondary 500/600, 2px offset
- Usage notes:
  - Keep labels concise (2–3 words). Avoid all caps.
  - For destructive actions, use Primary variant; confirm with modal when impactful.

### Inputs / Forms
- Purpose: Collect user data (text, email, password, search).
- Controls: Text Field, Textarea, Select (native), Checkbox, Radio (as needed)
- Styles:
  - Field height: 40px (Textarea auto height with min 80px)
  - Padding: 10px Y, 12px X; Radius: 8px
  - Border: 1px Neutral 300; hover Neutral 400; focus ring Secondary 500; focus border Secondary 600
  - Placeholder: Neutral 400; Text: Neutral 900; Helper text: Neutral 600
  - Error: Border Error (Primary 600), helper text Error; Success: Border Success 600
  - Disabled: bg Neutral 100; text Neutral 500; border Neutral 200
- Validation states:
  - Error appears below field; do not auto-dismiss on blur.
  - Success state is subtle (border/indicator), avoid celebratory UI for routine inputs.
- Usage notes:
  - Group labels and helper text consistently; left-align labels.
  - Use clear error messages mapping to validation.

### Cards
- Purpose: Container for posts, lists, or groupings.
- Styles:
  - Background: #FFFFFF; Text: Neutral 900
  - Border: 1px Neutral 200; Radius: 12px
  - Shadow: `0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)`
  - Padding: 16–24px depending on density
- Usage notes:
  - Use Card headers with H5/H6; keep actions in the top-right area.

### Avatars / Profile Images
- Purpose: Represent users/communities.
- Variants (size): sm 24px, md 32px, lg 40px, xl 64px
- Styles:
  - Shape: Circle; Radius: 9999px
  - Border: 1px Neutral 200 on light surfaces
  - Fallback: Initials on Neutral 200 bg, text Neutral 700
- Usage notes:
  - Prefer square sources; cover-fit; avoid stretching.

### Badges / Tags
- Purpose: Metadata chips (e.g., tags, counts, states).
- Variants: Solid, Subtle (soft background)
- Styles:
  - Height: 24px; Padding X: 8px; Radius: 9999px; Typography: 12/16, 600
  - Solid: bg uses brand/status; text #FFFFFF
  - Subtle: text uses brand/status; bg uses corresponding 50 tint; border 0 or 1px corresponding 200 tint
- Usage notes:
  - Keep labels short; avoid line wrapping.

### Notifications / Alerts
- Purpose: Inline system messages.
- Variants: Success, Error, Warning, Info
- Styles:
  - Layout: Left icon (24px), content, optional close
  - Background: use subtle status surface (see Colors)
  - Border-left: 3px status base color; Text: Neutral 900; Title weight 600
  - Padding: 12–16px; Radius: 8px
- Usage notes:
  - Keep messages actionable; include a clear CTA when appropriate.

### Modals / Dialogs
- Purpose: Confirmations and focused tasks.
- Styles:
  - Overlay: rgba(0,0,0,0.4)
  - Container: bg #FFFFFF; Radius 12px; Shadow elevation-3
  - Header (H5/H6), body (Body 1), footer with actions
  - Padding: 20–24px; Button spacing: 8px
- Usage notes:
  - Primary action right-aligned; destructive uses Primary color.

### Navigation / Tabs
- Purpose: Switch between sections (e.g., Home/Following/Trending; Search tabs).
- Variants: Top Tabs (underline), Pills
- Styles:
  - Inactive: text Neutral 600
  - Active: text Neutral 900; indicator Secondary 600 (2px underline) or pill bg Secondary 50
  - Padding: 8–12px; Radius (pills): 9999px
- Usage notes:
  - Persist active state; ensure focus indicator on keyboard/tab navigation.

### Icons
- Purpose: Visual affordances for actions and metadata.
- Guidelines:
  - Grid: 24px; Stroke: 1.5px; Corner joins rounded
  - Color: `currentColor` from context (Primary/Secondary/Neutral)
  - Hit area: min 32–40px for touch
- Usage notes:
  - Pair with clear labels where ambiguity exists.

## States & Interactions

General rules:
- Hover: darken bg by one shade or raise shadow subtly; for Text buttons, underline or tint bg 50.
- Active/Pressed: darken by two shades, reduce elevation.
- Focus: 2px ring using Secondary 500/600 with 2px offset; ensure 3:1 contrast on ring vs background.
- Disabled: lower contrast (text Neutral 400–500), remove shadows and interactivity, use Neutral 100/200 backgrounds.
- Forms:
  - Success: subtle border Success 600 and optional icon; avoid green backgrounds for routine success.
  - Error: border and helper text in Error color; keep message concise.
- Badges/Status indicators:
  - Use small 8px dot in status color positioned top-right of avatar for presence if needed.

Accessibility:
- Minimum contrast 4.5:1 for body text; 3:1 for large text and UI components.
- Never convey information by color alone; pair icons/labels for status.

## Spacing & Layout

- Base unit: 4px
- Scale (multiples): 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64
- Container paddings: 16–24px
- Component paddings (defaults):
  - Button: 10px vertical / 16px horizontal
  - Input: 10px vertical / 12px horizontal
  - Card: 16–24px
- Border radius tokens:
  - `radius-sm`: 4px
  - `radius-md`: 8px
  - `radius-lg`: 12px
  - `radius-xl`: 16px
  - `radius-full`: 9999px (avatars, pills)
- Shadows:
  - Elevation-1: `0 1px 2px rgba(0,0,0,0.06)`
  - Elevation-2: `0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)`
  - Elevation-3 (modal): `0 8px 24px rgba(0,0,0,0.18)`

---

If you want size variants (sm/md/lg) formalized for Buttons, Inputs, and Avatars, or prefer different line-heights, tell me your preference and I’ll extend the tokens accordingly without changing the established colors or components.
