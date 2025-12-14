const sharp = require('sharp');

/**
 * Process image buffer with Sharp
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {Object} options - Processing options
 * @param {number} options.width - Target width
 * @param {number} [options.height] - Target height (optional, defaults to width)
 * @param {number} [options.quality=85] - WebP quality (1-100)
 * @param {string} [options.fit='inside'] - Resize strategy ('cover', 'contain', 'inside')
 * @returns {Promise<Buffer>} Processed image buffer
 */
async function processImage(imageBuffer, options) {
  const {
    width,
    height = null,
    quality = 85,
    fit = 'inside'
  } = options;

  return await sharp(imageBuffer)
    .resize(width, height, {
      fit,
      position: 'center',
      withoutEnlargement: fit === 'inside' // Only for 'inside' fit
    })
    .webp({ quality })
    .toBuffer();
}


module.exports = {
  processImage,
};
