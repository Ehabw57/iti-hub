# AUTH_LOGIN

## Purpose / Goal
Authenticate the user and obtain a JWT token; on success, store token and navigate to Home feed.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo / App Name]                                            │
│--------------------------------------------------------------│
│                       Login to Your Account                  │
│                                                              │
│  [Input] Email                                               │
│  [Input] Password                                            │
│                                                              │
│  [Checkbox] Remember me                 [Link] Forgot?       │
│                                                              │
│  [Button Primary] Login                                      │
│                                                              │
│  [Inline Alert/Error]                                        │
│   - VALIDATION_ERROR / INVALID_CREDENTIALS / ACCOUNT_BLOCKED │
│   - TOO_MANY_REQUESTS → cooldown notice (disabled button)    │
│                                                              │
│--------------------------------------------------------------│
│  New here? [Link] Register                                   │
└──────────────────────────────────────────────────────────────┘

Scrollable: minimal; content centered (no vertical scroll on desktop; mobile may scroll).
```

## Notes
- Client route: TODO (typically `/login`).
- Error handling: Show messages inline below fields; do not auto-dismiss.
- Rate limit (10/15min): If triggered, disable Login button and show cooldown helper text.
- On success: store token (localStorage) and navigate to Home feed.
- Accessibility: Focus ring on inputs/buttons per design system.

## Navigation
- Entry: Deep links or guarded redirects when unauthenticated.
- Exit: Success → Home feed; Links → Register, Forgot Password.

## High-Fidelity Prompt (Google Stitch)
Create a high-fidelity AUTH_LOGIN screen for a social app using the provided Design System:
- Layout: Centered auth card with `radius-lg`, elevation-2, white background on Neutral 50.
- Typography: H4 for title, Body for labels, Inter font as specified.
- Inputs: 40px height, `radius-md`, Neutral 300 borders; focus ring Secondary 600.
- Primary CTA: "Login" button (Primary 600 bg, white text, hover 700). Disabled state on rate limit.
- Links: Secondary 600 for "Forgot?" and "Register"; hover 700.
- Alert: Inline error with Error surface per design system.
- Colors: Use brand red (#DC2626) for primary, Secondary blue (#2563EB) for focus/links.
- Spacing: Base unit 4px; card padding 24px; field gaps 16px.
- Accessibility: 2px focus ring, minimum contrast rules.
- Do not invent new components; adhere to Buttons, Inputs, Alerts from the system.
