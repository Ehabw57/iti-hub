# SAVED_POSTS

## Purpose / Goal
Show current user's saved posts.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Title] Saved Posts                                          │
│--------------------------------------------------------------│
│ [Feed/List] (Infinite scroll)                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Post]                                             │ │
│ │  [Avatar] [Username] · [Time]                            │ │
│ │  [Text/Media]                                            │ │
│ │  [Actions] [Unsave] [Like] [Comment] [Repost]            │ │
│ │  [Counts] Likes • Comments • Reposts • Saves             │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Loader/Spinner] when fetching next page                     │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Saved posts list.
```

## Notes
- Data: GET `/posts/saved` (auth required) with `page, limit`.
- Post guarantees as in FEED_HOME; `isSaved` should be true.
- Interactions: Unsave and standard post interactions.

## Navigation
- Entry: Route (TODO, e.g., `/saved`).
- Exit: Open Post Detail or navigate back.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Saved Posts screen:
- List of post cards consistent with feeds; include Unsave action prominently.
- Maintain infinite scroll behavior and layout consistency.
- Components: Cards, Avatars, Buttons, Icons, Badges; Inter font.
- Colors/spacing per Design System; focus rings and accessible hit areas.
