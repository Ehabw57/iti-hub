# AUTH_REGISTER

## Purpose / Goal
Create an account and receive a token for immediate login; navigate to Home feed.

## Wireframe Sketch

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo / App Name]                                            │
│--------------------------------------------------------------│
│                       Create Your Account                     │
│                                                              │
│  [Input] Full Name                                           │
│  [Input] Username                                            │
│  [Input] Email                                               │
│  [Input] Password (min 8, mixed)                             │
│  [Helper Text] Password policy                               │
│                                                              │
│  [Checkbox] Accept Terms & Privacy                           │
│                                                              │
│  [Button Primary] Register                                    │
│                                                              │
│  [Inline Alert/Error]                                         │
│   - VALIDATION_ERROR / duplicate username/email               │
│   - TOO_MANY_REQUESTS → cooldown notice                       │
│                                                              │
│--------------------------------------------------------------│
│  Already have an account? [Link] Login                       │
└──────────────────────────────────────────────────────────────┘

Scrollable: Yes on mobile; desktop card fits typical viewport.
```

## Notes
- Client route: TODO (typically `/register`).
- Required fields: email, password, username, fullName.
- Password policy: min 8 chars with mixed types; show helper text.
- On success: token stored; navigate to Home feed.
- Validation: show field-level errors; avoid celebratory success screens.

## Navigation
- Entry: From Login or guarded routes.
- Exit: Success → Home feed; Link to Login.

## High-Fidelity Prompt (Google Stitch)
Design a high-fidelity AUTH_REGISTER screen following the Design System:
- Card layout with `radius-lg`, elevation-2; white surface over Neutral 50.
- Inputs: 40px height, Neutral 300 borders; focus ring Secondary 600.
- Primary CTA: "Register" button using Primary 600; disabled until terms checkbox is checked.
- Show password policy helper text in Neutral 600; errors in Error color with border change.
- Include terms checkbox with label and a privacy/terms link (Text variant buttons style).
- Typography: H4 title; Body 1 labels; Button text per spec.
- Colors: Primary red (#DC2626) for main CTA; Secondary blue (#2563EB) for links and focus.
- Spacing: 16px gaps between fields; 24px card padding; base unit 4px.
- Accessibility: Focus rings and proper contrast; tab order logically follows inputs.
