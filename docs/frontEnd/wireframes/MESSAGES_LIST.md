# MESSAGES_LIST

## Purpose / Goal
Show user’s conversations.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Messages                                            │
│--------------------------------------------------------------│
│ [Actions Row] [Button] New DM  [Button] New Group            │
│--------------------------------------------------------------│
│ [Conversations List] (paginated)                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Item] [Avatar] [Name or Participants]                   │ │
│ │        [LastMessage] content • sender • timestamp        │ │
│ │        [Badge] UnreadCount (per conversation)            │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Conversations list.
```

## Notes
- Data: GET `/conversations` with `page, limit`.
- Conversation fields: `_id, type, participants[], name?, image?, admin?, lastMessage{ content, senderId, timestamp }?, unreadCount(Map), createdAt, updatedAt`.
- Actions: Open conversation; create individual or group.
- Auth required.

## Navigation
- Entry: Route (TODO, e.g., `/messages`).
- Exit: Open Conversation Detail.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Messages List:
- List items with avatar(s), name/participants, last message preview, timestamp, and unread badge.
- New DM/Group buttons visible in header/actions row.
- Components: Avatars, Badges, Buttons, simple list surface; Inter font.
- Colors/spacing per Design System; focus rings; accessible hit areas.
