# ITI Hub user-story gap audit — 2026-09-25

## Scope and evidence

Verification update: see `work-order-verification.md` for the final browser and test evidence. Initial `role-api-audit.json` checks used port 5000, later identified as a different running backend; they are not proof of this checkout's behavior. Subsequent group smoke and browser checks used this checkout on port 5055, client 5175 and admin preview 4205.

This is an implementation and verification audit, not a claim that every journey works. The working tree already contained extensive changes before this work. `hook-consumers.json` records 154 exported query/mutation hooks and their non-hook React consumers (textual scan, not runtime coverage). 34 had no direct consumer at the time of the scan. Angular admin services are separate and can implement the same operations; an unused React hook alone is not a missing feature.

`role-api-audit.json` records live local sign-ins as student, instructor, branch admin and super admin, plus read/access checks. All four authenticated successfully. Student enrollment moderation is denied; instructor and branch-admin queues respond; platform user administration is super-admin only. Browser observations initially covered home, login/Google button, Communities, the new Groups tab, and branch discovery. Browser account switching initially timed out and was retried. Do not interpret API checks as completed browser journeys.

Status: **Implemented** = UI and API exist, still requires the indicated E2E check; **Partial** = a concrete gap; **Missing** = no implementation found; **Fixed** = addressed by this work. External Google consent and delivered-mail reset remain unverified until a real test identity/inbox is available.

## 1. Open group creation

- **Fixed:** `POST /community/groups` accepts every authenticated role; guests still fail authentication. Existing name/specialization validation remains. `createdBy` and creator membership were already set by the controller. Only creator or platform admin can review requests.
- **Fixed:** The described admin creation UI did not exist in this checkout. With explicit user clarification, a shared Groups tab was added to Communities using existing group queries/mutations, creation and owner moderation. The older `/communities` subsystem remains distinct from specialization groups.
- **Partial:** Specialization-group posts/comments/likes have APIs and unused hooks but no routed detail workspace. Creating and approving members does not yet provide that social journey. This is reported, not silently implemented.

## 2. Student journey

| Step | Status | Evidence / remaining gap |
|---|---|---|
| Discover platform | Implemented | Public feed, branches, tracks and community routes; feed and branch cards observed in browser. Many navigation/action accessible names render `[object Object]` (Intlayer values passed as attributes). |
| Register / password login | Implemented | Multi-step registration, availability checks and login controllers; seeded student API login 200. Need complete registration browser journey. |
| Google sign-in | Implemented, external check blocked | GIS button observed; `/auth/google` and verified-token linking tests exist. Real Google account exchange has not been verified in this run. |
| Forgot password | Implemented, delivery check blocked | Gmail SMTP authenticated in preceding work; reset token lifecycle tests exist. Inbox receipt and link round-trip remain unverified. |
| Browse branches → rounds → tracks | Implemented | Routed drill-down plus public APIs; branch catalog rendered. Full drill-down still needs role browser pass. |
| Request enrollment → approval → workspace | Implemented with consistency risk | Enrollment request API, manager queue, Track.studentIds and User.trackIds sync exist. Multiple writes are not transactional; simultaneous decisions/failures can leave partial state. |
| Track chat / records / files / videos | Implemented | Workspace consumers and member/uploader middleware exist. Need upload/download and real-time delivery browser coverage. |
| Progress / leaderboard / shared resources | Partial | API and query hooks exist without React consumers (`useMyReviews`, `useTrackLeaderboard`, `useTrackSharedResources`, `useToggleReview`). |
| Discover / join / create groups | Fixed / Partial | Shared creation and moderation now reachable; specialization-group detail and social actions still absent. Legacy Communities supports feed/join moderation but has no creation consumer. |
| Post / comment / like | Implemented for legacy communities/feed | Existing components/controllers/tests; specialization-group equivalents are API-only. |
| Search | Implemented | Global search UI, queries and backend categories; need all-result navigation browser check. |
| Notifications | Partial verification | Notification types, menu and center exist. Creation during requests is best-effort; delivery failures are logged only. Group notifications need a routed group destination. |
| Message someone | Implemented | Conversation list/detail and socket handlers; delivery between two browsers not verified. |
| Apply to job | Partial by product definition | Job cards link to external `applyUrl`; no internal application model, submission tracking or application status. External completion cannot be established from this app. |
| Register for event | Implemented | Event list + toggle-register API; attendance/capacity/workflow beyond registration not implemented. |
| Profile / settings | Implemented | Profile editing, password change, preferences and account deletion have consumers. Actual notification-preference enforcement requires separate delivery audit. |
| Review/cancel own requests | Partial | Own enrollment/group request hooks and cancellation hooks lack complete dashboard consumers. Track detail may expose enrollment cancellation; no consolidated history. |

## 3. Instructor journey

Inherits student findings above.

| Step | Status | Evidence / remaining gap |
|---|---|---|
| Approve assigned-track requests | Implemented | `canUploadToTrack`, track queue and scoped global queue; live API queue 200. |
| Add/remove track members | Implemented | `updateTrackMembers` and TrackMembersPanel; branch-scoped assignable-user search. Negative scope and membership sync need integration coverage. |
| Upload files/videos/records | Implemented | Existing mutations and workspace forms; member reads vs assigned-uploader writes. External file storage and large uploads not browser verified. |
| Moderate owned groups | Fixed | Shared group-owner request queue. No edit/delete group or post moderation UI/API in specialization subsystem. |
| Manage Messages group | Implemented | Group settings, membership and deletion controls exist. Multi-client effects and removed-member access require E2E coverage. |

## 4. Branch-admin journey

Inherits instructor capabilities only where branch scope allows them.

| Step | Status | Evidence / remaining gap |
|---|---|---|
| Manage own rounds/tracks | Implemented | `canManageBranch`/`canManageTrack`, Angular branch/round pages and routes. Need out-of-branch mutation tests. |
| Assign instructor roles | **Partial / blocked by routing** | Controller has branch-admin assignment logic, but `adminRoutes.js` globally authorizes only `admin`/`super_admin`; Angular `/users` also has platformAdminGuard. Branch-admin UI/API journey cannot reach that logic. Leave permission design for explicit follow-up. |
| Approve branch enrollments | Implemented | Global queue scoped to branch and decision controller checks track permission; API queue responds 200. |
| Content and membership within branch | Implemented | Shared guards and workspace/admin consumers; negative scope verification required. |

## 5. Super-admin journey

| Step | Status | Evidence / remaining gap |
|---|---|---|
| Branch / round / track CRUD | Implemented | Hierarchy controllers and Angular screens. Cascade behavior exists but destructive live tests were not performed on existing data. |
| Jobs / events full CRUD | **Partial** | Routes support list/create/delete (plus event registration), but no update endpoint. “Full CRUD” is therefore not satisfied. |
| Users / roles | Implemented | Platform user routes and UI, including role validation and branch requirement; live `/admin/users` 200. |
| See everything / override scope | Partial | Track helpers explicitly allow super admin; legacy Community owner/moderator middleware must be assessed separately from specialization-group override. No global guarantee inferred. |

## Findings to decide before additional feature work

1. Reconcile legacy Communities with specialization Groups; implement one coherent detail/social/moderation destination and notification links.
2. Expose branch-admin instructor assignment through a deliberately scoped route and UI.
3. Add job/event editing if full CRUD is required.
4. Make enrollment/group decisions atomic and recoverable; test concurrent decisions.
5. Add request history/cancellation, progress and leaderboard consumers only if retained as product features.
6. Fix accessible-label/localization object rendering across navigation and controls.
7. Specify whether job application tracking, event capacity, and notification preference enforcement are required.
8. Correct local-file cleanup: persisted absolute upload URLs do not match the relative-path format accepted by `deleteLocalFile`. Upload middleware can also create a file before folder validation rejects the request. Both paths can leave orphan files.
9. Repair the broad test suite and establish a clean baseline. The complete run had 472 failures and 10 pending specs; the focused work-order suite passed. A missing frontend test setup also limits automated UI coverage.

No broad fixes to these gaps are authorized by the audit itself. Parts 3–5 (tests, auth visuals, real-logo rollout) are separately requested work and proceed after presenting this report.
