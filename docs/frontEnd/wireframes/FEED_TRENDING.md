# FEED_TRENDING

## Purpose / Goal
Global trending feed.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Tabs] Home | Following | Trending                            │
│--------------------------------------------------------------│
│ [Feed List] (Infinite scroll; trending signal)                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Post]                                             │ │
│ │  [Avatar] [Username] · [Time]                            │ │
│ │  [Badge] Trending indicator (e.g., badge/tag)            │ │
│ │  [Text Content / Truncated]                              │ │
│ │  [Image] (optional)                                      │ │
│ │  [Actions] [Like] [Comment] [Repost] [Save]              │ │
│ │  [Counts] Likes • Comments • Reposts • Saves             │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Loader/Spinner] when fetching next page                     │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Feed List.
```

## Notes
- Data: GET `/feed/trending` with `page, limit` (optional auth).
- Interactions: Standard; do not reorder on interactions.

## Navigation
- Entry: Tab switch or route (TODO, e.g., `/trending`).
- Exit: Links to Post Detail, User Profile.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Trending Feed:
- Tabs active on Trending; show subtle trending badges/tags on cards.
- Visual hierarchy slightly emphasizes high-engagement posts (counts in Neutral 900).
- Colors, spacing, and components per Design System; Inter typography.
