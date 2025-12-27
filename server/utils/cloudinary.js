const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const mockImageUrl = ['https://i.pinimg.com/1200x/db/60/62/db60629456caec781afd00b629f71230.jpg', 'https://i.pinimg.com/736x/15/33/37/153337ee75ad8c36e5bb8797853d32e3.jpg', 'https://i.pinimg.com/1200x/dd/63/55/dd6355c335941d23542e97a8d6a07800.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHWDBx_zDhQMO8Dl3Nl1qqsBBzZf3vsj68Tg&s']

// Configure Cloudinary (credentials from environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer to upload
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result
 */
function uploadToCloudinary(buffer, folder, publicId) {
  return process.env.NODE_ENV === 'dev' ? new Promise((resolve, reject) => {
    resolve({
      secure_url: mockImageUrl[Math.floor(Math.random() * mockImageUrl.length)],
      public_id: 'folder/image'
    });
  }) : new Promise((resolve, reject) => {
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
