# POST_COMPOSER

## Purpose / Goal
Create a new post with text and/or images.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Header] [Logo]                                   [Avatar]   │
│--------------------------------------------------------------│
│ [Composer Card]                                              │
│  [Textarea] What's new? (optional content)                   │
│  [Chip Select] Tags (optional)                               │
│  [Select] Community (optional)                               │
│  [Image Upload] [Button] Add Images (multiple)               │
│  [Image Preview Grid] [Image] [Image] [Image]                │
│                                                              │
│  [Button Primary] Post                                       │
│  [Button Secondary] Cancel                                   │
│                                                              │
│  [Inline Alert/Error] UPLOAD_ERROR / VALIDATION_ERROR        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Scrollable region: Composer card (if previews overflow).
```

## Notes
- Data: POST `/posts` (multipart). Body fields: `content?, tags?, community?, images[]?`.
- Success: returns `{ post }` with post guarantees; redirect to Home feed; new post appears at top.
- Handle upload failures; provide clear inline error messages.
- Auth required.

## Navigation
- Entry: Route or modal (TODO, e.g., `/compose`).
- Exit: Post → Home feed; Cancel → previous screen.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity Post Composer:
- Card with `radius-lg`, elevation-2; textarea with 2–4 line auto height; 40px inputs.
- Image uploader uses previews in a responsive grid; deletable thumbnails.
- Primary "Post" button in brand red; disabled until at least one of content/images is present.
- Secondary "Cancel" in Secondary 600 or Text variant.
- Tags as chips (Badges component, subtle variant) and Community as Select.
- Error states for uploads and validation (Error border, helper text). Focus rings per system.
- Spacing: 16px gaps; 24px padding; Inter font.
