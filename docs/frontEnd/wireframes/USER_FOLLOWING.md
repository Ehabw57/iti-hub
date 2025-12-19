# USER_FOLLOWING

## Purpose / Goal
List accounts the user is following.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Back] Following of @username                       │
│--------------------------------------------------------------│
│ [List] (paginated)                                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Item] [Avatar md] [Full Name] @username                 │ │
│ │        [Button] Unfollow                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Pagination Loader]                                          │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Following list.
```

## Notes
- Data: GET `/users/:userId/following` with `page, limit`.
- Item fields: `_id, username, fullName, profilePicture?`; conditional `isFollowing?`.
- Interactions: Follow/Unfollow.

## Navigation
- Entry: Route (TODO, e.g., `/user/:userId/following`).
- Exit: Back to profile or open user profile.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Following List:
- Similar to Followers; primary action is Unfollow.
- Components: Avatars, Buttons, simple list with clear spacing.
- Inter font; focus rings; accessible hit areas.
