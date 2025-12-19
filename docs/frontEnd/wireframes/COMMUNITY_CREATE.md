# COMMUNITY_CREATE

## Purpose / Goal
Create a new community.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] Create Community                                    │
│--------------------------------------------------------------│
│ [Form Card]                                                  │
│  [Input] Name                                                │
│  [Textarea] Description                                      │
│  [Chip Select] Tags                                          │
│  [Image Upload] Profile Picture                              │
│  [Image Upload] Cover Image                                  │
│                                                              │
│  [Button Primary] Create                                     │
│  [Button Secondary] Cancel                                   │
│                                                              │
│  [Inline Alert/Error] VALIDATION_ERROR / UPLOAD_ERROR        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Form card if long.
```

## Notes
- Data: POST `/communities` (multipart). Fields: `name, description, tags[]`; optional images.
- Auth required.
- On success: redirect to community detail.
- Tag fetch endpoint pending.

## Navigation
- Entry: Route (TODO, e.g., `/community/create`).
- Exit: Success → Community Detail; Cancel → previous.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Community Create form:
- Card with inputs and image uploaders; previews; clear error states.
- Primary Create CTA with brand red; Cancel secondary.
- Components: Inputs, Textarea, Badges for tags, Image uploader previews; Inter font.
- Colors/spacing per Design System; focus rings.
