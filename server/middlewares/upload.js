const multer = require('multer');
const {
  IMAGE_CONFIGS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_POST_IMAGES
} = require('../utils/constants');

// Use memory storage (files stored in memory as Buffer objects)
const storage = multer.memoryStorage();

// File filter to check MIME types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.originalname}. Only JPEG, PNG, and WebP allowed.`), false);
  }
};

// Upload configurations for different contexts
const upload = {
  // Profile picture upload (single file, max 5MB)
  profile: multer({
    storage,
    fileFilter,
    limits: { 
      fileSize: IMAGE_CONFIGS.PROFILE.max_size_mb * 1024 * 1024 
    }
  }).single('image'),

  // Cover image upload (single file, max 10MB)
  cover: multer({
    storage,
    fileFilter,
    limits: { 
      fileSize: IMAGE_CONFIGS.COVER.max_size_mb * 1024 * 1024 
    }
  }).single('image'),

  // Post images upload (multiple files, max 4 files, 10MB each)
  post: multer({
    storage,
    fileFilter,
    limits: {
      fileSize: IMAGE_CONFIGS.POST.max_size_mb * 1024 * 1024,
      files: MAX_POST_IMAGES
    }
  }).array('images', MAX_POST_IMAGES),

  // Message image upload (single file, max 5MB)
  message: multer({
    storage,
    fileFilter,
    limits: { 
      fileSize: IMAGE_CONFIGS.MESSAGE.max_size_mb * 1024 * 1024 
    }
  }).single('image'),

  // Community creation with optional profile and cover images
  communityCreate: multer({
    storage,
    fileFilter,
    limits: { 
      fileSize: IMAGE_CONFIGS.COVER.max_size_mb * 1024 * 1024 // 10MB max (largest)
    }
  }).fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ])
};

// Middleware to handle multer errors
const multerErrorHandler = (err, _, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File size exceeds the allowed limit.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Too many files uploaded.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false,
        message: 'Unexpected field in file upload.' 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: `Upload error: ${err.message}` 
    });
  }
  
  next(err);
};

module.exports = upload;
module.exports.multerErrorHandler = multerErrorHandler;
