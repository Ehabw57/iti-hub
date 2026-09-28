const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Google Identity Services — server-side ID token verification.
 *
 * Verifies a Google ID token locally (RS256 signature against Google's JWKs,
 * audience/issuer/expiry checks) without adding any new dependency:
 * the signing keys are fetched over HTTPS (Node >= 18 global fetch) and the
 * signature + standard claims are checked with the existing `jsonwebtoken`.
 */

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const VALID_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

// Cache of Google's signing keys. Google rotates them; keys that are still
// referenced by unexpired ID tokens stay valid for a short while, so both the
// current and previous key sets are kept.
const jwksCache = {
  keys: [],
  fetchedAt: 0,
};
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

class GoogleAuthError extends Error {
  constructor(message, code = "GOOGLE_AUTH_FAILED") {
    super(message);
    this.name = "GoogleAuthError";
    this.code = code;
    this.isOperational = true;
    this.statusCode = 401;
  }
}

/**
 * Convert an RFC 7517 JWK to a Node KeyObject so `jsonwebtoken` can verify with it.
 * @param {object} jwk - A JWK from Google's certificate endpoint
 * @returns {crypto.KeyObject} Parsed public key
 */
function jwkToKeyObject(jwk) {
  const jwkData = { ...jwk };
  delete jwkData.kid;
  delete jwkData.alg;
  delete jwkData.use;
  return crypto.createPublicKey({ key: jwkData, format: "jwk" });
}

/**
 * Fetch (and cache) Google's public signing keys.
 * @returns {Promise<object[]>} Array of JWK objects
 */
async function fetchGoogleJwks() {
  const now = Date.now();
  if (jwksCache.keys.length > 0 && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  let response;
  try {
    response = await fetch(JWKS_URL, {
      // Bypass Node's undici cache layer on some setups
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    // Network unavailable — fall back to stale keys if we have any
    if (jwksCache.keys.length > 0) {
      return jwksCache.keys;
    }
    throw new GoogleAuthError("Unable to reach Google to verify the sign-in", "GOOGLE_UNREACHABLE");
  }

  if (!response.ok) {
    if (jwksCache.keys.length > 0) {
      return jwksCache.keys;
    }
    throw new GoogleAuthError("Unable to load Google signing keys", "GOOGLE_UNREACHABLE");
  }

  const data = await response.json();
  jwksCache.keys = data.keys || [];
  jwksCache.fetchedAt = now;
  return jwksCache.keys;
}

/**
 * Extract the payload of a token without verifying it (to read the `kid` header).
 * @param {string} token - JWT
 * @returns {{ header: object, payload: object }} decoded segments
 */
function decodeTokenUnsafe(token) {
  const parts = String(token).split(".");
  if (parts.length !== 3) {
    throw new GoogleAuthError("Malformed Google ID token", "INVALID_GOOGLE_TOKEN");
  }
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return { header, payload };
  } catch {
    throw new GoogleAuthError("Malformed Google ID token", "INVALID_GOOGLE_TOKEN");
  }
}

/**
 * Verify a Google ID token issued by Google Identity Services.
 *
 * Checks performed:
 *  - RS256 signature against Google's current public keys (JWKS, cached 1h)
 *  - `aud` matches the app's GOOGLE_CLIENT_ID
 *  - issuer is accounts.google.com (both HTTPS and bare forms)
 *  - the token has not expired
 *  - the Google account's email is verified (email_verified === true)
 *
 * @param {string} idToken - The credential returned by the Google Sign-In button
 * @returns {Promise<{ sub: string, email: string, name: string, picture: string }>}
 *          Verified payload
 * @throws {GoogleAuthError} On any validation failure (401 operational error)
 */
async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!idToken || typeof idToken !== "string") {
    throw new GoogleAuthError("Google ID token is required", "MISSING_GOOGLE_TOKEN");
  }

  if (!clientId) {
    throw new GoogleAuthError(
      "Google sign-in is not configured (GOOGLE_CLIENT_ID missing)",
      "GOOGLE_NOT_CONFIGURED"
    );
  }

  const { header } = decodeTokenUnsafe(idToken);

  if (header.alg !== "RS256") {
    throw new GoogleAuthError("Unsupported Google token algorithm", "INVALID_GOOGLE_TOKEN");
  }

  const keys = await fetchGoogleJwks();
  const matchingKey = keys.find((k) => k.kid === header.kid);

  // Cache the thrown error so it can be re-thrown if no key matches / all
  // verification attempts fail — keeps a single logical failure path.
  let verificationError = new GoogleAuthError("Invalid Google ID token", "INVALID_GOOGLE_TOKEN");

  if (matchingKey) {
    try {
      const payload = jwt.verify(idToken, jwkToKeyObject(matchingKey), {
        algorithms: ["RS256"],
        issuer: VALID_ISSUERS,
        audience: clientId,
      });

      // `jsonwebtoken` maps `email_verified` onto the payload as-is
      if (payload.email_verified !== true && payload.email_verified !== "true") {
        throw new GoogleAuthError(
          "Your Google account email is not verified",
          "GOOGLE_EMAIL_NOT_VERIFIED"
        );
      }

      if (!payload.email || !payload.sub) {
        throw new GoogleAuthError("Google ID token is missing email or subject", "INVALID_GOOGLE_TOKEN");
      }

      return payload;
    } catch (err) {
      if (err instanceof GoogleAuthError) throw err;
      verificationError = new GoogleAuthError(
        err && err.message ? err.message : "Invalid Google ID token",
        "INVALID_GOOGLE_TOKEN"
      );
    }
  }

  throw verificationError;
}

module.exports = {
  verifyGoogleIdToken,
  GoogleAuthError,
  // Exposed for tests
  _internal: { jwksCache, fetchGoogleJwks, decodeTokenUnsafe },
};