# CONVERSATION_DETAIL

## Purpose / Goal
Chat in a specific conversation.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Back] [Conversation Name] [Menu ⋮]                 │
│--------------------------------------------------------------│
│ [Messages Thread] (Scrollable, reverse chronological)        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Message Bubble]                                         │ │
│ │  [Sender Avatar] [Content/Text or Image]                 │ │
│ │  [Status] sent/delivered/read; [SeenBy] avatars          │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat bubbles...                                         │
│ [Loader] for older messages (cursor-based)                   │
│--------------------------------------------------------------│
│ [Composer Bar]                                              │
│  [Input] Type a message...  [Button] Attach Image           │
│  [Button Primary] Send                                      │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Messages Thread.
```

## Notes
- Data: GET `/conversations/:conversationId` and GET `/conversations/:conversationId/messages` with `cursor, limit`.
- Message fields: `_id, conversation, sender, content?, image?, status, seenBy[], createdAt`.
- Actions: Send message POST `/conversations/:conversationId/messages` (multipart), mark seen PUT `/conversations/:conversationId/seen`.
- Group admin actions (via menu): add/remove member, leave, update name/image.
- Realtime via WS with fallback polling.

## Navigation
- Entry: Route (TODO, e.g., `/messages/:conversationId`).
- Exit: Back to Messages List.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Conversation Detail:
- Sticky header with name and menu; sticky composer bar at bottom.
- Message bubbles: left/right alignment per sender; status indicators; seenBy avatars.
- Components: Inputs, Buttons, Avatars, Icons; Inter font.
- Colors/spacing per Design System; focus rings; accessible controls.
