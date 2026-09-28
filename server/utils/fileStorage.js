const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

/**
 * File storage abstraction: Cloudinary when configured, local disk otherwise.
 *
 * The local-disk fallback keeps upload-dependent features (track files,
 * group photos, message images) functional in environments where Cloudinary
 * credentials are absent. Files are written under `server/uploads/<folder>/`
 * and served by the Express static route mounted at `/uploads`.
 */

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Whether Cloudinary credentials are present in the environment.
 * @returns {boolean}
 */
function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Sanitize a folder path for the local filesystem.
 * @param {string} folder - e.g. "iti-hub/tracks/<id>/files"
 * @returns {string}
 */
function sanitizeFolder(folder) {
  return String(folder || 'misc')
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_') || '_')
    .join('/');
}

/**
 * Save a file buffer.
 *
 * @param {Buffer} buffer - File contents
 * @param {Object} options
 * @param {string} options.folder - Storage folder (used for both providers)
 * @param {string} [options.originalName='file'] - Original filename (fallback only)
 * @param {string} [options.resourceType='raw'] - Cloudinary resource type: 'raw' | 'image'
 * @param {boolean} [options.useFilename=true] - Preserve original filename on Cloudinary
 * @returns {Promise<{url: string, storage: 'cloudinary'|'local'}>} Saved file URL
 *   (local URLs are relative — prefix with the server origin before storing)
 */
async function saveFile(
  buffer,
  {
    folder = 'misc',
    originalName = 'file',
    resourceType = 'raw',
    useFilename = true,
  } = {}
) {
  if (isCloudinaryConfigured()) {
    const cloudinary = require('cloudinary').v2;
    const { Readable } = require('stream');
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          ...(useFilename ? { use_filename: true, unique_filename: true } : {}),
        },
        (err, uploadResult) => (err ? reject(err) : resolve(uploadResult))
      );
      Readable.from(buffer).pipe(stream);
    });
    return { url: result.secure_url, storage: 'cloudinary' };
  }

  // ---- Local-disk fallback ----
  const safeFolder = sanitizeFolder(folder);
  const dir = path.join(UPLOAD_ROOT, safeFolder);
  await fsp.mkdir(dir, { recursive: true });

  const ext = path.extname(originalName || '').toLowerCase();
  const base =
    path
      .basename(originalName || 'file', ext)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80) || 'file';
  const filename = `${base}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  await fsp.writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${safeFolder}/${filename}`, storage: 'local' };
}

/**
 * Resolve a stored URL against the request origin when it is relative
 * (local-disk fallback). Absolute URLs (Cloudinary) pass through untouched.
 * Models validate image URLs against ^https?://, so relative local URLs
 * must be made absolute before persisting.
 * @param {Object} req - Express request
 * @param {string} url - Stored URL (absolute or /uploads/... relative)
 * @returns {string}
 */
function absoluteUrl(req, url) {
  if (!url || /^https?:\/\//.test(url)) return url;
  return `${req.protocol}://${req.get('host')}${url}`;
}

/**
 * Delete a locally-stored file (best effort) given its /uploads/... URL.
 * Cloudinary URLs are ignored (handled by deleteFromCloudinary instead).
 * @param {string} url - Stored file URL
 * @returns {Promise<boolean>} True if a local file was removed
 */
async function deleteLocalFile(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
    return false;
  }
  const relative = url.replace('/uploads/', '');
  const filePath = path.join(UPLOAD_ROOT, relative);
  // Guard against path traversal outside the uploads root
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_ROOT))) {
    return false;
  }
  try {
    await fsp.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isCloudinaryConfigured,
  saveFile,
  deleteLocalFile,
  absoluteUrl,
  UPLOAD_ROOT,
};
