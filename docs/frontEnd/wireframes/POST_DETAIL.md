# POST_DETAIL

## Purpose / Goal
View a single post and its comments.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Post Card]                                                  │
│  [Avatar] [Username] · [Time] [Badge: Community/Tag]         │
│  [Text Content]                                              │
│  [Image] (optional)                                          │
│  [Actions] [Like] [Comment] [Repost] [Save]                  │
│  [Counts] Likes • Comments • Reposts • Saves                 │
│--------------------------------------------------------------│
│ [Create Comment]                                             │
│  [Input] Write a comment...                                  │
│  [Button Primary] Comment                                    │
│--------------------------------------------------------------│
│ [Comments List] (Scrollable, paginated)                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Comment Item]                                          │ │
│ │  [Avatar] [Username] · [Time]                           │ │
│ │  [Content]                                              │ │
│ │  [Actions] [Like] [Reply] [Edit] [Delete]               │ │
│ │  [Counts] Likes • Replies                               │ │
│ │  [Replies Thread] (collapsible)                         │ │
│ │   - [Reply Item]                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Loader/Spinner] for pagination                              │
└──────────────────────────────────────────────────────────────┘

Scrollable regions: Comments List; Post content if long.
```

## Notes
- Data: GET `/posts/:id` (optional auth; conditional `isLiked`, `isSaved`).
- Comments: GET `/posts/:postId/comments` with `page, limit, parentCommentId?`.
- Create Comment: POST `/posts/:postId/comments` `{ content, parentCommentId? }`.
- Update/Delete: PUT/DELETE `/comments/:id`.
- Like/Unlike Comment: POST/DELETE `/comments/:id/like`.
- Blocked users' content hidden per server rules.

## Navigation
- Entry: From any feed or deep link (TODO, e.g., `/post/:postId`).
- Exit: Back to previous; links to User Profile / Community Detail.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Post Detail:
- Post card with large media support; actions in consistent order; badge for community/tags.
- Comment composer inline below post; clear CTA; disabled until non-empty.
- Comment items with nested replies; collapsible threads; actions as icons + labels where needed.
- Pagination loader; maintain layout stability.
- Use Cards, Inputs, Buttons, Badges, Avatars per Design System; Inter font; focus rings.
