# Frontend Architecture & State Design – Step 3

**(React + React Query + Zustand + i18n + WebSockets)**

---

## Context

The frontend application is a **social media web app** built using:

* React
* React Router DOM
* React Query (Server State)
* Zustand (Global Client State)
* i18n (Arabic / English with RTL & LTR)
* Tailwind CSS
* shadcn/ui + custom components
* react-icons
* WebSockets for real-time features

The backend is fully implemented and already translated into a **Frontend Functional Specification (Step 2)**.

---

## Objective

Define a **clear, scalable frontend architecture and state ownership model** that:

* Separates server state from client state
* Handles soft-authentication (guest & logged-in users)
* Supports real-time updates via WebSockets
* Enforces route and component-level access control
* Enables predictable data flow

⚠️ No UI implementation
⚠️ No styling details
⚠️ No component code

---

## 1. High-Level Frontend Architecture

Describe the application structure in terms of responsibilities:

```text
- App Root
  - App Initialization
  - Auth Bootstrapping
  - Language & Direction Setup

- Router Layer
  - Public Routes
  - Protected Routes
  - Fallback Routes

- Layouts
  - Public Layout
  - Authenticated Layout

- Feature Modules
  - Home
  - Profile
  - Messages
  - Notifications
  - Feed
  - Settings

- Shared UI Layer
  - Reusable UI primitives
  - Icons
  - Utility components

- State Layer
  - Server State (React Query)
  - Global Client State (Zustand)

- API Layer
  - REST API services
  - WebSocket service

- Localization Layer
  - Language files
  - Direction handling
```

---

## 2. Routing & Guard Strategy (React Router DOM)

### Routing Rules

* Application supports **guest browsing**
* Some routes are **restricted to authenticated users**
* Some UI components are conditionally hidden for guests

### Guard Strategy

Use **both route-level and layout-level guards**.

For each route define:

```text
Route Path:
Associated Page:
Access Level: Public / Protected
Guard Type: Route-level / Layout-level
Unauthorized Behavior:
```

Unauthorized behavior:

* Redirect to login page
* OR show access denied message
* OR hide component (based on context)

---

## 3. State Ownership Map (CRITICAL)

### 3.1 Server State – React Query

React Query is the **single source of truth** for all data coming from backend APIs and WebSockets.

Includes:

* Posts
* Comments
* Messages
* Notifications
* User profiles
* Feeds
* Any list or entity fetched from backend

For each server state entity:

```text
Data Name:
Source Endpoint:
Used In Screens:
Caching Strategy:
Refetch Triggers:
Real-time Updates:
- How WebSocket events update the cache
```

📌 WebSocket messages must **update React Query cache**, not duplicate data in Zustand.

---

### 3.2 Global Client State – Zustand

Zustand manages **application-level behavior state**, NOT server data.

Includes:

* Auth status (isLoggedIn)
* Auth user metadata (id, role)
* Token presence (localStorage-based)
* Current language
* Current direction (RTL / LTR)
* WebSocket connection state
* Global UI flags (if needed)

For each state slice:

```text
State Name:
Initial Value:
Who Updates It:
Who Reads It:
Persistence:
```

Auth source of truth:

* Token presence in localStorage
* Fetch authenticated user via API on app load

---

### 3.3 Local State

Local component state includes:

* Form inputs
* Modal open/close
* Dropdown visibility
* Temporary UI toggles

Local state must NOT be shared across routes.

---

## 4. Localization Strategy (i18n)

Define:

* Supported languages: Arabic / English
* Default language
* Language persistence strategy
* Direction switching logic (RTL / LTR)
* Translation file organization

Rules:

* All UI text comes from translation files
* Backend responses remain in English
* No backend value translation required

---

## 5. WebSocket Strategy

WebSockets are used for **real-time updates**, excluding live counters.

Scope:

* Messages
* Notifications
* Online status
* Feed updates

Rules:

* WebSocket connection starts **after successful login**
* WebSocket disconnects on logout
* Events update React Query cache
* Connection state tracked in Zustand

---

## 6. Data Flow Definition

Describe flows using text only:

### App Initialization

```text
App load →
Read token from localStorage →
If token exists:
  Fetch current user →
  Set auth state →
  Connect WebSocket
Else:
  Continue as guest
```

### Authenticated Flow

```text
User navigates →
Route guard checks auth →
Fetch required data →
Render screen →
Subscribe to WebSocket updates
```

### Logout Flow

```text
User logs out →
Clear token →
Reset Zustand state →
Clear React Query cache →
Disconnect WebSocket →
Redirect to public route
```

---

## 7. Global Error & Loading Strategy

Define:

* Screen-level loading (React Query)
* Global loading indicators
* Error boundaries
* Inline vs toast error usage
* Global error page for 500-level errors

---

## 8. UI Foundation Rules

Define architectural usage only:

* shadcn/ui used for base primitives
* Custom components built on top of shadcn
* Tailwind used for layout and spacing
* react-icons used consistently across the app

⚠️ No styling values or classes.

---

## 9. Constraints & Non-Goals

Explicitly exclude:

* SEO optimization
* Server-side rendering (SSR)
* Static site generation
* Offline support

---

## 10. Validation Checklist

The architecture must clearly answer:

* Where each piece of state lives
* Who owns it
* How it updates
* How routing affects access
* How real-time updates propagate

If any answer is ambiguous, refine instead of guessing.

---

## Final Output

Produce a **Frontend Architecture & State Design document** in markdown format.

No UI code
No styling
No components

---

## Reminder

Server defines **data**
Spec defines **behavior**
Architecture defines **responsibility**


