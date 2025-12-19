# USER_PROFILE

## Purpose / Goal
Display a user’s public profile.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Cover Image]                                               │
│ [Profile Row] [Avatar xl] [Full Name] @username [Badge Role] │
│ [Buttons] [Follow/Unfollow] [Block/Unblock] [Message]        │
│ [Meta] Specialization • Location • Role                      │
│ [Counters] Followers | Following | Posts                     │
│ [Bio] (optional)                                             │
│--------------------------------------------------------------│
│ [Tabs] Posts | About (optional)                               │
│--------------------------------------------------------------│
│ [Posts List] (paginated)                                      │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Card: Post]                                             │ │
│ │  [Avatar] [Text/Media] [Actions]                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ...repeat items...                                           │
└──────────────────────────────────────────────────────────────┘

Scrollable regions: Posts List; profile header content on mobile.
```

## Notes
- Data: GET `/users/:username` (optional auth). Fields include `_id, username, fullName, bio?, profilePicture?, coverImage?, specialization?, location?, role, followersCount, followingCount, postsCount, isBlocked?, createdAt, updatedAt` and conditional flags: `isFollowing?`, `followsYou?`.
- Posts: GET `/users/:userId/posts` with `page, limit`.
- Actions: Follow/Unfollow `/users/:userId/follow`, Block/Unblock `/users/:userId/block`.
- Access may be restricted if blocking applies.

## Navigation
- Entry: Route (TODO, e.g., `/user/:username`).
- Exit: Navigate to post detail; open followers/following lists.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity User Profile:
- Large cover image with overlaid avatar; follow/unfollow and block/unblock buttons near profile header.
- Counters presented as badges or inline chips; role badge if applicable.
- Tabs to switch between Posts and About; Posts list uses Card component.
- Use Avatars, Buttons, Badges, Cards per Design System; Inter font.
- Colors: status and role indicators with badges; focus rings and accessible controls.
