# FEED_FOLLOWING

## Purpose / Goal
Chronological feed from followed users/communities (auth required).

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Tabs] Home | Following | Trending                            │
│--------------------------------------------------------------│
│ [Feed List] (Infinite scroll; chronological)                  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Post]                                             │ │
│ │  [Avatar] [Username] (Follow relationship flag)          │ │
│ │  [Time] exact chronological                              │ │
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
- Data: GET `/feed/following` with `page, limit` (auth required).
- Same post field guarantees as FEED_HOME.
- Interactions: Standard post interactions; maintain chronological order.

## Navigation
- Entry: Tab switch or route (TODO, e.g., `/following`).
- Exit: Links to Post Detail, User Profile, Community Detail.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Following Feed:
- Tabs with active state on Following; underline indicator Secondary 600.
- Cards identical to Home but ensure timestamps reflect chronological order.
- Auth-only view; show subtle badge/flag for followed status where applicable.
- Colors/spacing per Design System; Inter typography.
