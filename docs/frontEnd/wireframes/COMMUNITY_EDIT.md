# COMMUNITY_EDIT

## Purpose / Goal
Owner-only editing of community details and images.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Edit Community                                      │
│--------------------------------------------------------------│
│ [Form Card]                                                  │
│  [Textarea] Description                                      │
│  [Image Upload] Profile Picture (replace)                    │
│  [Image Upload] Cover Image (replace)                        │
│                                                              │
│  [Button Primary] Save Changes                               │
│  [Button Secondary] Cancel                                   │
│                                                              │
│  [Inline Alert/Error] VALIDATION_ERROR / UPLOAD_ERROR        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Form card.
```

## Notes
- Data: PATCH `/communities/:id` `{ description }`; POST `/communities/:id/profile-picture`; POST `/communities/:id/cover-image`.
- Auth required; user must be owner.
- Name/other fields update not exposed via API.

## Navigation
- Entry: Route (TODO, e.g., `/community/:id/edit`).
- Exit: Success → Community Detail; Cancel → previous.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Community Edit screen:
- Card with description textarea and two image uploaders with previews.
- Save Changes CTA (Primary red) and Cancel secondary.
- Components: Textarea, Inputs, Buttons; Inter font; focus rings.
- Colors/spacing per Design System; clear error messages on uploads.
