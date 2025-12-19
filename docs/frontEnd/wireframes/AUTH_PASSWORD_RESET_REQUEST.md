# AUTH_PASSWORD_RESET_REQUEST

## Purpose / Goal
Let the user request a password reset email. Always show a generic success message.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo / App Name]                                            │
│--------------------------------------------------------------│
│                    Password Reset                             │
│                                                              │
│  [Body Text] Enter your account email to receive a reset link.│
│                                                              │
│  [Input] Email                                               │
│                                                              │
│  [Button Primary] Send Reset Link                             │
│                                                              │
│  [Inline Alert/Info or Success]                               │
│   - Always show generic success message on success            │
│                                                              │
│  [Inline Alert/Error]                                         │
│   - VALIDATION_ERROR / TOO_MANY_REQUESTS                      │
│                                                              │
│--------------------------------------------------------------│
│  [Link] Back to Login                                        │
└──────────────────────────────────────────────────────────────┘

Scrollable: Minimal.
```

## Notes
- Client route: TODO (typically `/password-reset`).
- Success response: generic message; do not reveal account existence.
- Rate limit: show cooldown and disable button if enforced.
- Validation errors shown inline; keep messages concise.

## Navigation
- Entry: From Login ("Forgot?") link or direct route.
- Exit: Success → Stay on page with success message; Link → Login.

## High-Fidelity Prompt (Google Stitch)
Create a high-fidelity PASSWORD_RESET_REQUEST screen using the Design System:
- Simple centered card (`radius-lg`, elevation-2) with instructions above the email field.
- Input: 40px height, Neutral 300 border; focus ring Secondary 600.
- CTA: "Send Reset Link" as Primary button (Primary 600 → hover 700); disabled during cooldown.
- Alerts: Inline success (Info surface or Success surface per system) and error handling styles.
- Colors and typography per spec: Inter font; H5 title; Body text instructions.
- Spacing: 16px field gaps; 24px card padding.
- Accessibility: Maintain focus rings and semantic labels.
