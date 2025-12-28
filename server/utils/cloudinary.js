const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary lazily (on first use)
let isConfigured = false;
function ensureCloudinaryConfig() {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    isConfigured = true;
  }
}

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer to upload
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
function uploadToCloudinary(buffer, folder, publicId) {
  ensureCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        format: 'webp' // Ensure WebP format
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}


/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Cloudinary deletion result
 */
function deleteFromCloudinary(publicId) {
  ensureCloudinaryConfig();
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} cloudinaryUrl - Cloudinary URL
 * @returns {string|null} Public ID or null if invalid
 */
function extractPublicId(cloudinaryUrl) {
  if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
    return null;
  }

  // Match Cloudinary URL pattern and extract public_id
  // Example: https://res.cloudinary.com/demo/image/upload/v1234/folder/image.webp
  // Returns: folder/image
  const match = cloudinaryUrl.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};
