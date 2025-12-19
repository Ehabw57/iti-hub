# COMMUNITIES_DIRECTORY

## Purpose / Goal
Discover and filter communities.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Communities                                         │
│--------------------------------------------------------------│
│ [Filters Row]                                                │
│  [Input] Search communities...   [Chip Select] Tags          │
│--------------------------------------------------------------│
│ [Grid/List] (paginated)                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Community]                                       │ │
│ │  [Avatar] [Name]                                        │ │
│ │  [Description] (truncated)                              │ │
│ │  [Tags] [Badge] [Badge]                                 │ │
│ │  [Meta] Members • Posts                                 │ │
│ │  [Actions] [Join/Leave]                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Pagination Loader]                                          │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Grid/List.
```

## Notes
- Data: GET `/communities` with `page, limit, search, tags`.
- Fields: `_id, name, description, tags[], profilePicture?, coverImage?, memberCount, postCount, owners[], moderators[], createdAt, updatedAt`; conditional `isJoined?, role?` when authenticated.
- Actions: Join/Leave.
- Tag fetch endpoint is not implemented (per flows TODO); tags input may be static or freeform.

## Navigation
- Entry: Route (TODO, e.g., `/communities`).
- Exit: Open Community Detail.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Communities Directory:
- Filter row with search input and tag chips; responsive grid of community cards.
- Card components with names, descriptions, tags badges, meta counts, and Join/Leave CTA.
- Components: Cards, Inputs, Badges, Buttons, Avatars; Inter font.
- Colors/spacing per Design System; focus rings; accessible filters and CTAs.
