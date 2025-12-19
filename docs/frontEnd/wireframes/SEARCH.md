# SEARCH

## Purpose / Goal
Full search with tabbed results for Users, Posts, and Communities.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Search                                              │
│--------------------------------------------------------------│
│ [Search Bar] [Input] Search... [Button] Submit               │
│ [Filters Row] Specialization? (users) • Type? (posts) • Tags │
│--------------------------------------------------------------│
│ [Tabs] Users | Posts | Communities                            │
│--------------------------------------------------------------│
│ [Results Panel] (per tab, paginated)                         │
│  Users:                                                      │
│   ┌────────────────────────────────────────────────────────┐ │
│   │ [Item] [Avatar] [Full Name] @username [Button] Follow │ │
│   └────────────────────────────────────────────────────────┘ │
│  Posts:                                                      │
│   ┌────────────────────────────────────────────────────────┐ │
│   │ [Card: Post] with text/media/actions                   │ │
│   └────────────────────────────────────────────────────────┘ │
│  Communities:                                                │
│   ┌────────────────────────────────────────────────────────┐ │
│   │ [Card: Community] name, tags, meta, [Join/Leave]      │ │
│   └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Pagination Loader]                                          │
└──────────────────────────────────────────────────────────────┘

Scrollable regions: Results per tab.
```

## Notes
- Users: GET `/search/users` with `q(>=2), specialization?, page, limit`; item fields `_id, username, fullName, profilePicture?`; conditional `isFollowing?`.
- Posts: GET `/search/posts` with `q, type?, communityId?, page, limit`; post fields as per feeds; conditional `hasLiked?/hasSaved?` per API-ROUTES.
- Communities: GET `/search/communities` with `q, tags, page, limit`; fields per directory; conditional `isMember?`.
- Interactions: Debounced input; tab switching; pagination per tab.
- Suggestions/Top Matches endpoint not implemented.

## Navigation
- Entry: Route (TODO, e.g., `/search`).
- Exit: Navigate to user profile, post detail, or community detail.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Search screen:
- Prominent search bar with debounced input; tabs for Users/Posts/Communities with underline style.
- Filters contextual per tab (specialization, type, tags).
- Results panels with appropriate card/list items and CTAs (Follow, Join/Leave, post actions).
- Components: Inputs, Buttons, Tabs, Cards, Avatars, Badges; Inter font.
- Colors/spacing per Design System; focus rings; accessible navigation.
