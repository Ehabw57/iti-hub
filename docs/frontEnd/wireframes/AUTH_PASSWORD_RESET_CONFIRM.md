# AUTH_PASSWORD_RESET_CONFIRM

## Purpose / Goal
Allow the user to set a new password using a valid reset token; redirect to Login upon success.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo / App Name]                                            │
│--------------------------------------------------------------│
│                  Set a New Password                          │
│                                                              │
│  [Input] New Password                                        │
│  [Helper Text] Min 8 chars, mixed types                      │
│  [Input] Confirm New Password                                │
│                                                              │
│  [Button Primary] Update Password                             │
│                                                              │
│  [Inline Alert/Error]                                         │
│   - INVALID_TOKEN / TOKEN_EXPIRED / VALIDATION_ERROR          │
│                                                              │
│--------------------------------------------------------------│
│  [Link] Back to Login                                        │
└──────────────────────────────────────────────────────────────┘

Scrollable: Minimal.
```

## Notes
- Client route: TODO (typically `/password-reset/confirm`).
- Token is provided via link; if invalid/expired, show error and optionally disable CTA.
- Validation: password rules and match check; show field-level errors.
- On success: redirect to Login; do not auto-login.

## Navigation
- Entry: Via email link to confirm page.
- Exit: Success → Login; Link → Login.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity PASSWORD_RESET_CONFIRM screen per Design System:
- Card layout with `radius-lg`, elevation-2; white surface.
- Inputs: Two password fields (40px height, Neutral 300 borders); focus ring Secondary 600.
- CTA: "Update Password" as Primary button; disabled until validation passes.
- Error handling: Inline alerts for token errors and field-level validations (Error colors).
- Typography: H5 title; Body 1 labels; helper text Neutral 600.
- Colors: Primary red for CTA; Secondary blue for focus and links.
- Spacing: 16px gaps; 24px padding.
- Accessibility: Strong focus indicators; clear error messaging.
