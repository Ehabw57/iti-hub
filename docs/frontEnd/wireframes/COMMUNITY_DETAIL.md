# COMMUNITY_DETAIL

## Purpose / Goal
View community details and feed.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Back] Community                                    │
│--------------------------------------------------------------│
│ [Cover Image]                                               │
│ [Profile Row] [Avatar xl] [Name] [Tags] [MemberCount]        │
│ [Description] (expanded)                                     │
│ [Actions] [Join/Leave] [Role Badge: Owner/Moderator]         │
│--------------------------------------------------------------│
│ [Tabs] Feed | About (optional)                                │
│--------------------------------------------------------------│
│ [Community Feed] (paginated)                                  │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Post]                                             │ │
│ │  [Author] [Text/Media] [Actions]                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
└──────────────────────────────────────────────────────────────┘

Scrollable regions: Feed; description on mobile.
```

## Notes
- Data: GET `/communities/:id` (optional auth) and GET `/communities/:communityId/feed` with `page, limit`.
- Conditional flags: `isJoined?, role?` when authenticated.
- Actions: Join/Leave; Moderators/owners may remove posts via `DELETE /posts/:id` per permissions.

## Navigation
- Entry: Route (TODO, e.g., `/community/:id`).
- Exit: Open Post Detail; navigate back.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Community Detail:
- Hero with cover and avatar; description and tags; Join/Leave CTA.
- Feed of posts using Card components; include moderator/owner badges and actions if applicable.
- Components: Cards, Badges, Buttons, Avatars; Inter font.
- Colors/spacing per Design System; strong focus indicators.
