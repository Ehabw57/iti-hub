# COMMUNITY_MODERATION

## Purpose / Goal
Owner/moderator management.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Moderation                                          │
│--------------------------------------------------------------│
│ [Section] Moderators                                         │
│  [Input] Add user by ID                                      │
│  [Button Primary] Add Moderator                               │
│  [List] Current Moderators                                   │
│   - [Item] [Avatar] [Username] [Button] Remove               │
│--------------------------------------------------------------│
│ [Section] Content Moderation                                 │
│  [List] Recent Posts (with remove action)                    │
│   - [Item] [Post Title/Excerpt] [Button] Remove              │
└──────────────────────────────────────────────────────────────┘

Scrollable regions: Lists.
```

## Notes
- Data: POST `/communities/:id/moderators` `{ userId }`; DELETE `/communities/:id/moderators/:userId`.
- Post removal via `DELETE /posts/:id` per permissions.
- Member removal endpoint not defined.
- Auth required; appropriate role.

## Navigation
- Entry: Route (TODO, e.g., `/community/:id/moderation`).
- Exit: Back to Community Detail.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Community Moderation screen:
- Two sections: moderator management and content moderation.
- Use Inputs, Buttons, Lists, Avatars; Cards if needed.
- Colors/spacing per Design System; strong focus indicators; destructive actions use brand red.
