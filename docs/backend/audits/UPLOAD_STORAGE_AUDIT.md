# File Upload & Storage Audit

Scope
- Reviewed: `docs/File-Upload-Specification.md`, `server/middlewares/upload.js`, and searched server routes for upload usage.
- Goal: compare current implementation to spec, list risks/gaps, and provide concrete remediation and small PR tasks.

Current implementation (summary)
- `server/middlewares/upload.js` uses `multer.diskStorage` to write uploads directly to `server/uploads`.
- No fileFilter or MIME/type validation is enforced in middleware.
- No size limits or per-context limits configured (global defaults only).
- No image processing (Sharp) or verification of MIME type beyond original filename.
- No Cloudinary/cloud provider integration present.
- No cleanup, temporary directories, or virus-scan hooks.

Gaps vs spec (high level)
- Spec requires Cloudinary as primary storage and a server-side validation + processing pipeline (resize/compress/thumbnail) or direct upload with client-signed uploads.
- Spec defines context-specific limits (profile, cover, post, message) which are not enforced.
- Spec recommends MIME detection (`file-type`) and safe handling of uploaded files before processing — current code trusts `originalname`.
- Spec expects content-type `multipart/form-data` endpoint at `/api/v1/upload/image` and authentication/ratelimit — no routes found that implement this yet.

Risks
- Malicious uploads: trusting `originalname` and lack of MIME verification allows crafted files to be stored.
- Disk exhaustion: no global/request quotas or cleanup may allow DoS by filling disk.
- Privacy/leak: files stored on local FS without access controls could be publicly accessible if server misconfigured.

Concrete remediation (small, prioritized tasks)

P0 — Required (small PRs)
1) Enforce server-side validation and limits in multer
   - Add `fileFilter` to allow only the MIME types in spec (image/jpeg, image/png, image/webp).
   - Add `limits` to multer: per-file size (5MB default) and max files (10 default). For profile uploads use 2MB and maxFiles=1.

2) Verify actual MIME using `file-type` before trusting the file
   - After multer stores to temp dir, run `file-type.fromFile(file.path)` and reject if type not allowed.

3) Integrate Cloudinary upload (preferred MVP flow)
   - Add Cloudinary SDK config using `CLOUDINARY_*` env vars.
   - Upload processed image buffers to Cloudinary and return secure URLs.
   - Remove long-term reliance on local storage; keep `uploads/temp` for transient processing and delete after upload.

4) Add authentication + rate limiting on upload endpoint
   - Ensure `authenticate` middleware protects `/upload` routes.
   - Add `express-rate-limit` for upload endpoints (e.g., 60 requests per 10 minutes per IP) and tighter for anonymous endpoints.

P1 — Important
1) Image processing pipeline (Sharp) for resizing, compression, and thumbnail generation when needed.
2) Implement cleanup job to remove orphaned temp files older than X minutes.
3) Add server-side checks for total upload per request (50MB limit), and reject if total exceeds.

P2 — Enhancements
1) Consider client-side direct-to-Cloudinary signed uploads to reduce server load.
2) Add optional virus scanning hook (e.g., ClamAV) for uploads before moving to permanent storage.

Example: improved multer + Cloudinary flow (sketch)

1) Multer config (temp storage + fileFilter + limits)

```javascript
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/temp')), filename: (req,file,cb)=> cb(null, Date.now() + '-' + file.originalname) });

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/png','image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5*1024*1024, files: 10 }});
module.exports = upload;
```

2) Route handler (validate MIME, process, upload to Cloudinary, cleanup)

```javascript
const fileType = require('file-type');
const cloudinary = require('cloudinary').v2;
// cloudinary.config(...) at app startup

app.post('/api/v1/upload/image', authenticate, upload.array('images', 10), async (req,res)=>{
  try {
    const results = [];
    for (const file of req.files) {
      const detected = await fileType.fromFile(file.path);
      if (!detected || !['image/jpeg','image/png','image/webp'].includes(detected.mime)) {
        // cleanup file
        // return error
      }

      // optional: process with sharp to desired size/format

      const uploaded = await cloudinary.uploader.upload(file.path, { folder: 'iti-hub' });
      results.push({ url: uploaded.secure_url, width: uploaded.width, height: uploaded.height });
      // delete temp file
    }
    return res.json({ files: results });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
```

Tests and acceptance criteria
- Unit tests:
  - Multer rejects non-image types.
  - Multer enforces per-file size and max files.
  - `file-type` rejection path removes temp file and returns 400.
- Integration tests (Jasmine + Supertest):
  - POST `/api/v1/upload/image` with valid images returns 200 and URLs.
  - POST with invalid mime returns 400 and no file saved permanently.

Operational notes
- Environment variables required: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Ensure `uploads/temp` directory exists and is writable by the server process; create at startup if missing.
- Add a scheduled job (e.g., cron or node-schedule) to purge temp files older than 1 hour.

Suggested small PRs
- PR A: Add multer `fileFilter`, size limits, and move temp path to `uploads/temp` (with startup creation of folder). Add tests.
- PR B: Integrate Cloudinary uploader in upload route, delete temp files after upload, and wire env vars.
- PR C: Add rate-limiting middleware to upload routes and tests.

Next actions I can take
1) Create PR A (multer hardening + tests).
2) Create PR B (Cloudinary upload integration).
3) If you prefer a simpler path, I can implement PR A and keep files on local storage (with strict limits & cleanup) and postpone Cloudinary integration.

If you'd like me to proceed, tell me which PR to implement first (A or B) or say "local-first" to harden local storage and skip Cloudinary for now.
