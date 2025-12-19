# NOTIFICATIONS_CENTER

## Purpose / Goal
View and manage notifications.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Notifications                                       │
│--------------------------------------------------------------│
│ [Actions Row] [Button] Mark all as read  [Badge] Unread Count │
│--------------------------------------------------------------│
│ [Notifications List] (paginated)                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Item] [Actor Avatars/Count] [Type] [Target]             │ │
│ │        [Text] Actor(s) did X on [target]                 │ │
│ │        [Meta] isRead • timestamp                         │ │
│ │        [Actions] [Button] Mark as read                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Pagination Loader]                                          │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Notifications list.
```

## Notes
- Data: GET `/notifications` with `page, limit`; GET `/notifications/unread/count`.
- Actions: PUT `/notifications/read` (all), PUT `/notifications/:id/read` (single).
- Notification fields: `_id, recipient, actor, actorCount, type, target?, isRead, createdAt, updatedAt`.
- Grouping behavior per server logic (non-follow, non-repost types).
- Auth required.

## Navigation
- Entry: Route (TODO, e.g., `/notifications`).
- Exit: Navigate to target (e.g., post detail) or back.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Notifications Center:
- List items with actor avatars/count, type, target preview, timestamp, and read state.
- Actions to mark single/all as read; show unread badge in header.
- Components: Avatars, Badges, Buttons, simple list; Inter font.
- Colors/spacing per Design System; focus rings; accessible actions.
