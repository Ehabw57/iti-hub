# Work-order verification

## Latest direction: restore desktop, improve mobile

The user selected the original desktop sidebar layout. The subsequent horizontal navigation, campus banner, colored auth panels and palette changes were removed. Login/registration use the original centered-card layout, while the real logo and Community creation remain. Mobile has a compact header and collapsible navigation. Its search icon opens and focuses an inline search panel rather than navigating immediately. Browser checks confirmed the input opens at narrow mobile width, and entering React then Enter navigates to `/search?q=React`. Desktop community browsing was visually checked with the restored sidebar. The Google button now measures available width and updates on resize to avoid clipping on small screens.

## User correction: Communities and campus redesign

The user clarified that creation must target the existing Community model, not specialization Groups. The earlier Groups-tab outcome below is historical and has been superseded. The Groups tab and its added component were removed. A shared Create community form now calls `POST /communities`, validates required text and 1-3 supported topics, refreshes community lists and opens the created community. Browser verification as Student 5 created `Community creation QA 2026-09-26` (id `6ab768f5cc5479a7f3c59dec`); its page showed one member, Student 5 as owner/moderator, and Manage controls. This test community remains in the development database.

The app now has horizontal navigation, a learning-focused home introduction, community discovery cards and a warm/forest-green visual identity. Login and registration use separate rounded story/form panels. Password login succeeded after the redesign; the registration first step and Google button render. This does not establish external Google or email verification.

Cleanup removed the specialization creation component, four obsolete sidebar/navigation files, and 34 unused exported hooks from the course query/mutation modules after checking references throughout client source. The misleading GroupCard name was changed to CommunityDirectoryCard. Home suggestions now use actual Communities rather than specialization Groups. Existing backend specialization APIs and stored data were not deleted merely because their frontend consumers were removed; those endpoints still have server tests/scripts and require a separate compatibility decision before retirement. No claim is made that every unused line across all three applications has been eliminated.

## Outcome by requested part

1. **Open groups implemented and verified.** Every authenticated role can create a specialization group through the shared Communities Groups tab. The creator owns the group and reviews requests. Guest access and unrelated-user moderation remain denied. In the browser, Student 5 created `Audit group 2026-09-25`, instructor Ahmed Hassan requested membership, and the owner approved it: the UI showed two members and no pending requests. This demonstration group remains in the development database.
2. **Role audit delivered, with explicit limits.** See `work-order-audit.md` and `hook-consumers.json`. Code inspection covers each requested journey, and browser checks sampled all four seeded roles. This is not a claim of exhaustive end-to-end verification of every journey. Initial `role-api-audit.json` results came from port 5000, subsequently found to run a different backend; use the later evidence below for this checkout.
3. **Coverage added and executed.** Twenty new specs cover permissions/validation (7), integration workflows (10), and email generation/error handling (3). The selected suite, including existing register/login/Google/reset tests, passed 67 specs. Live open-group smoke passed 15 checks. The complete server run reported 1475 specs, 472 failures and 10 pending. No clean baseline was run, so these failures cannot all be classified as pre-existing. They remain unresolved and full coverage is not claimed.
4. **Auth design implemented; external verification blocked.** Login/register share the refreshed responsive layout. All four seeded roles signed in through the client. Registration's initial step and Google button render. The Forgot Password link opens the reset request form. Actual Google consent/sign-in and a received-email password-reset round trip have not been verified.
5. **Real logo applied.** The provided PNG is used in client navigation/sidebar, auth, loading state, admin branding, favicons and email header. Email tests verify the inline CID image and unchanged reset URL. Client production build and admin development build passed; the client has a large-bundle warning.

## Browser evidence

- Student: password login, group creation and owner approval completed.
- Instructor: password login, group join request completed; admin portal opens branch discovery without platform-user management.
- Branch admin: password login, Alexandria-only admin branch list, enrollment queue empty state; client Alexandria / Round 45 / Front-End Development drill-down and member/workspace controls rendered.
- Super admin: client password login and event discovery rendered. Destructive platform CRUD was not exercised against existing records.
- Register and Forgot Password pages retain their entry points after the visual change. New account registration, cross-client messaging, external applications, and complete uploads/downloads in the browser remain unverified.

## Repeatable checks

From `server`, run `node scripts/smokeAudit.js` for the focused 67-spec suite against the test database. Run `node scripts/smokeOpenGroups.js http://localhost:5055` against a development backend with the seeded test accounts for the 15 live checks. The latter removes only its own generated groups, requests and notifications.

Integration tests exercise enrollment request/approval/membership synchronization, group ownership/request decisions, invalid and out-of-scope actions, and folder/record/local-file operations. Google verification is mocked and SMTP MIME generation uses a stream transport: neither proves external delivery or Google account consent. Concurrency, cloud storage, comprehensive frontend automation and real-time multi-client delivery are outside the added coverage.

## Runtime and remaining blockers

Port 5000 was occupied by a different `node src/server.js` process. Verification used this checkout's backend on 5055 and client on 5175. Admin preview on 4205 served the built bundle with its API URL changed in memory to 5055. These are temporary process overrides; backend/frontend environment files were not changed. Reset links still use the configured `FRONTEND_BASE_URL`.

Gmail SMTP uses Nodemailer with `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD` and `EMAIL_FROM_ADDRESS`; configuration is read at send time and no secrets are embedded. Earlier SMTP connection/authentication verification succeeded. No Resend dependency remains. A designated real test identity with accessible inbox is still required to prove receipt, click the actual email link, change the password and reject the old password. No real inbox was accessed, and SMTP authentication is not delivery verification. A Google test identity/session is also needed for the requested real sign-in.

The role audit reports additional product gaps before implementation, as requested: specialization-group social/detail UI, branch-admin instructor assignment, job/event editing, transactional decisions, unused request/progress consumers and accessible-label rendering. Those broader feature changes have not been silently included.
