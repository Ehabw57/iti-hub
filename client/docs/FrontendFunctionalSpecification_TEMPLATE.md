    
# Frontend Functional Specification – Step 2

*(Backend already implemented)*

## Context

You have full access to the backend source code, APIs, models, authentication, and business logic.
Your task is **NOT to implement UI** and **NOT to design components**.

Your task is to **translate the existing backend into clear frontend functional requirements**.

---

## Objective

Produce a **Frontend Functional Specification** that defines **how the frontend should behave** based on the existing backend.

This spec will be used later for:

* UI implementation
* State management decisions
* Component architecture

---

## Instructions (Very Important)

* Do NOT invent backend behavior
* Do NOT assume new endpoints
* Do NOT design UI or write CSS
* Use ONLY what already exists in the backend
* Be explicit and detailed
* Prefer clarity over brevity

---

## Output Structure (STRICT)

### 1. Global Application Behavior

Describe:

* Authentication flow (login, logout, token handling, refresh)
* Authorization rules (roles, permissions)
* Global error handling (401, 403, 500)
* Global loading strategy
* Notification strategy (toast / inline / modal)
* Pagination, filtering, and sorting behavior

---

### 2. Screens List

List **all frontend screens/pages** required based on backend capabilities.

For each screen:

```text
Screen Name:
Purpose:
Primary User Role:
```

---

### 3. Screen-Level Functional Requirements

For **EACH screen**, follow this exact format:

```text
Screen Name:

Description:
What problem this screen solves for the user.

Required Backend Endpoints:
- METHOD /endpoint
- METHOD /endpoint

Trigger Conditions:
- When does each request fire?

Data Dependencies:
- Required fields
- Optional fields
- Derived fields (computed on frontend)

Loading State:
- What is shown while loading?
- Is the screen blocked or partial?

Success State:
- How data is displayed logically (not visually)
- What actions become available?

Empty State:
- Conditions for empty state
- User feedback

Error State:
- Error types expected
- User-facing behavior
- Retry logic

Authorization Handling:
- What happens if user is unauthorized?

User Actions:
For each action:
- Trigger
- Backend interaction
- Optimistic or pessimistic
- Success result
- Failure result

Side Effects:
- Cache updates
- Navigation changes
- Global state changes
```

---

### 4. Cross-Screen Behavior

Describe:

* Shared data between screens
* Cache invalidation rules
* Navigation dependencies
* State persistence (refresh, back button)

---

### 5. Edge Cases & Constraints

Explicitly list:

* Null or missing fields
* Partial responses
* Slow network behavior
* Concurrent requests
* Duplicate submissions
* Race conditions

---

### 6. Assumptions (If Any)

If something is unclear in the backend, list:

* Assumption made
* Reason
* Potential impact

---

## Quality Bar (Must Meet)

The final document must allow a frontend developer to:

* Implement all screens without guessing
* Handle all states explicitly
* Match backend behavior 1:1

If anything is ambiguous, clarify it instead of guessing.

---

## Final Output

Produce a **clean, well-structured Frontend Functional Specification** in markdown format.

---

## Reminder

Backend = source of truth
Frontend = behavior + experience
