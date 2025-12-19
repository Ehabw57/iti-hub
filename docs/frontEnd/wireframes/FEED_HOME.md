# FEED_HOME

## Purpose / Goal
Default landing feed; algorithmic for authenticated users, recent/featured for guests.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Tabs] Home | Following | Trending                            │
│--------------------------------------------------------------│
│ [Feed List] (Infinite scroll)                                 │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Post]                                             │ │
│ │  [Avatar] [Username] · [Time] [Badge: Community/Tag]     │ │
│ │  [Text Content / Truncated 2 lines]                      │ │
│ │  [Image] (optional)                                      │ │
│ │  [Actions] [Like] [Comment] [Repost] [Save]              │ │
│ │  [Counts] Likes • Comments • Reposts • Saves             │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Loader/Spinner] when fetching next page                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Feed List.
```

## Notes
- Data: GET `/feed/home` with `page, limit`. Returns `{ cached, feedType: "home", posts[], pagination }`.
- Post guaranteed fields: `_id, author, likesCount, commentsCount, repostsCount, savesCount, createdAt, updatedAt`; optional: `content, images, tags, community, editedAt`; conditional flags when auth: `isLiked?, isSaved?`.
- Interactions: Like/Unlike, Save/Unsave, Repost. Do not reorder feed on interactions; use optimistic updates.
- Empty state: subtle message when no posts.

## Navigation
- Entry: Default route (TODO, typically `/`).
- Exit: Open Post Detail, User Profile, Community Detail via inline links.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Home Feed with:
- Header with logo and avatar; top tabs (underline style) for Home/Following/Trending.
- Post cards: white surfaces (`radius-lg`, Neutral 200 border, elevation-1), Inter typography.
- Actions as icons with 32–40px hit area; counts in Neutral 600; primary interactions use brand red for active (Like), Secondary for focus.
- Infinite scroll loader; maintain layout stability.
- Colors: Primary #DC2626 (active like/destructive), Secondary #2563EB (focus/tabs), Neutrals per system.
- Spacing: 16–24px card padding; 16px gaps between items; base unit 4px.
- Accessibility: Focus rings on actions; ensure min contrast; keyboard navigable.
