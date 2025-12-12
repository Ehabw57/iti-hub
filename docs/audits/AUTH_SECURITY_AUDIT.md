# Auth & Security Audit

Scope
- Files reviewed: `server/controllers/authController.js`, `server/middlewares/checkAuth.js`, `server/models/User.js`
- Goal: compare current implementation to `docs/Authentication-Specification.md` and identify security, correctness, and maintenance gaps. Provide prioritized remediation and test guidance.

Summary of high-risk findings (P0)
- JWT expiry is hard-coded to `2h` in `User.generateAuthToken()`; spec expects `7d` for access tokens (or documented shorter TTL + refresh tokens). This mismatch affects UX and integration.
- Bcrypt salt rounds hard-coded to `8` in `User.pre('save')`; spec recommends 10 (or configurable via env). Low rounds reduce password hashing cost.
- `server/middlewares/checkAuth.js` reads `req.headers.authorization` without verifying the `Bearer ` prefix or trimming; it also falls back to `"test-secret"` when `JWT_SECRET` is missing — this can silently accept tokens signed with the fallback secret in non-test environments.
- No refresh token / token revocation strategy. No persisted refresh tokens or blacklisting means logout and forced logout are not possible.
- No password-reset fields (reset token + expiry) or email verification fields on `User` model; current repo lacks reset endpoints and DB fields required for secure flows.
- `authenticate` middleware sets `req.user` but does not handle token expiration messages distinctly; generic 401 hides useful diagnostics for ops and for tests.

Medium-risk findings (P1)
- No rate-limiting or brute-force protections on auth endpoints (`/login`, `/register`, `/password-reset`), increasing risk of credential stuffing.
- `authorize` middleware does not validate that `req.user.role` exists in allowedRoles robustly (e.g., normalizing casing), and returns 401 when `req.user` missing — minor but OK.
- Password rules are minimal (6 chars); spec recommends stronger password policy and optionally zxcvbn checks.

Low-risk / enhancements (P2)
- No refresh tokens, no device/session tracking, no IP/device metadata logging on login events.
- No audit logging for auth events (failed login, password reset, token refresh).

Concrete recommended fixes (ordered by priority)

P0 — required fixes (small PRs)
1) Make JWT secret REQUIRED and remove silent fallback
   - Rationale: fail-fast if `JWT_SECRET` is missing. Silent fallback to `test-secret` is dangerous in production.
   - Change: throw/exit at app startup if JWT_SECRET not set; remove fallback in `checkAuth.js`.

2) Make salt rounds and JWT expiry configurable; increase defaults
   - Use env vars: `BCRYPT_SALT_ROUNDS` (default 10), `JWT_EXPIRES_IN` (default `7d`), and `JWT_REFRESH_EXPIRES_IN` (default `30d`).
   - Update `server/models/User.js`:

   ```diff
   UserSchema.pre("save", async function (next) {
-  if (!this.isModified("password")) return next();
-
-  try {
-    const salt = await bcrypt.genSalt(8);
-    this.password = await bcrypt.hash(this.password, salt);
-    next();
-  } catch (err) {
-    next(err);
-  }
+  if (!this.isModified("password")) return next();
+
+  try {
+    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
+    const salt = await bcrypt.genSalt(rounds);
+    this.password = await bcrypt.hash(this.password, salt);
+    next();
+  } catch (err) {
+    next(err);
+  }
   });

   UserSchema.methods.generateAuthToken = function () {
-  const token = jwt.sign(
-    { id: this._id, role: this.role },
-    process.env.JWT_SECRET,
-    { expiresIn: "2h" }
-  );
+  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
+  const token = jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn });
    return token;
   };
   ```

3) Harden `authenticate` middleware and accept `Bearer <token>` header
   - Verify header starts with `Bearer ` and extract token. Use `jwt.verify` with the required secret and bubble up expiration errors.
   - Return clearer error codes for `token expired` vs `invalid token` for logging and tests.

   Example replacement for `server/middlewares/checkAuth.js`:

   ```diff
   -const token = req.headers.authorization;
-
   -if (!token) {
   -  return res.status(401).json({ message: "No token provided" });
   -}
-
   -try {
   -  const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret");

   -  req.user = await User.findById(decoded.id).select("-password");

   -  next();
   -} catch (err) {
   -  return res.status(401).json({ message: "Invalid token" });
   -}
   +const authHeader = req.headers.authorization;
   +if (!authHeader || !authHeader.startsWith("Bearer ")) {
   +  return res.status(401).json({ message: "No token provided" });
   +}
   +const token = authHeader.split(" ")[1].trim();
   +try {
   +  const decoded = jwt.verify(token, process.env.JWT_SECRET);
   +  req.user = await User.findById(decoded.id).select("-password");
   +  if (!req.user) return res.status(401).json({ message: "User not found" });
   +  next();
   +} catch (err) {
   +  if (err.name === 'TokenExpiredError') {
   +    return res.status(401).json({ message: 'Token expired' });
   +  }
   +  return res.status(401).json({ message: 'Invalid token' });
   +}
   ```

4) Add password reset and email verification fields to `User` model and endpoints
   - Schema additions:
     - `resetPasswordToken: String`
     - `resetPasswordExpires: Date`
     - `emailVerified: { type: Boolean, default: false }`
     - `emailVerificationToken: String`
   - Implement `POST /auth/password-reset-request`, `POST /auth/password-reset` and `POST /auth/verify-email` with secure, single-use tokens stored hashed in DB (or UUIDs with expiry). Email the token (link) to user.

Note: simplified approach
- Per your preference, we will NOT implement refresh tokens to keep the auth design simpler. Instead the plan is:
   - Issue reasonably long-lived access tokens (default `JWT_EXPIRES_IN=7d`) and document logout as a client-side token removal. If you later want token revocation, we can add short-term tokens + refresh tokens or a simple token blacklist keyed in Redis.

P1 — protections and policies
1) Add rate limiting on auth endpoints
   - Use `express-rate-limit` with conservative defaults for auth routes: e.g., 100 requests per 15 minutes per IP for `/login`, tighter for password reset requests.
2) Implement account lockout / exponential backoff after repeated failed logins
3) Improve password policy on register (min length 8, require variety or check with zxcvbn). Document fallback UX for weak passwords.

P2 — telemetry and logging
1) Add auth event logs (failed / successful login, password changes, refresh token usage)
2) Add optional email notifications for suspicious activity

Tests and acceptance criteria
- Unit tests (Jasmine) for:
  - register: password hashed, user saved, password not returned
  - login: successful login returns token, invalid creds return 401
  - token expiry: expired token returns 401 with 'Token expired'
  - authenticate middleware: rejects missing header, rejects malformed header, accepts `Bearer <token>`
- Integration tests:
  - password reset flow (request -> token issued -> reset -> login with new password)
  - refresh token flow (issue refresh token -> use it to get new access token -> revoke refresh token -> ensure access not issuable)

Deployment & config notes
- Require `JWT_SECRET` in environment for non-dev environments; fail-fast on startup if missing.
- Add env vars with secure defaults: `JWT_EXPIRES_IN=7d`, `JWT_REFRESH_EXPIRES_IN=30d`, `BCRYPT_SALT_ROUNDS=10`.
- Secrets management: use a secrets manager in prod; avoid checking secrets into repo.
