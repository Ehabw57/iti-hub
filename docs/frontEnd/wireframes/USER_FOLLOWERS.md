# USER_FOLLOWERS

## Purpose / Goal
List followers of a user.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Back] Followers of @username                       │
│--------------------------------------------------------------│
│ [List] (paginated)                                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Item] [Avatar md] [Full Name] @username                 │ │
│ │        [Button] Follow/Unfollow                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
│                                                              │
│ [Pagination Loader]                                          │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Followers list.
```

## Notes
- Data: GET `/users/:userId/followers` with `page, limit`.
- Item fields: `_id, username, fullName, profilePicture?`; conditional `isFollowing?`.
- Interactions: Follow/Unfollow via connection endpoints.

## Navigation
- Entry: Route (TODO, e.g., `/user/:userId/followers`).
- Exit: Back to profile or open user profile.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Followers List:
- Simple list items with avatar, name, handle, and Follow/Unfollow button.
- Use List within Card or simple surface; clear pagination loading.
- Buttons follow design system; Inter font; focus rings.
