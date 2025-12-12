# File Upload & Media Handling Specification

**Project**: ITI Hub Social Media Platform  
**Version**: 1.0 (MVP)  
**Date**: December 12, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Upload Flow](#upload-flow)
3. [File Validation](#file-validation)
4. [Image Processing](#image-processing)
5. [Storage Strategy](#storage-strategy)
6. [Implementation Details](#implementation-details)
7. [Security Considerations](#security-considerations)
8. [Error Handling](#error-handling)

---

## Overview

### Supported File Types

**Images Only** (MVP):
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Future** (Post-MVP):
- GIF (.gif)
- Video formats (MP4, WebM)
- Document formats (PDF, DOCX)

### Upload Contexts

| Context | Max Size | Max Count | Dimensions | Use Case |
|---------|----------|-----------|------------|----------|
| Profile Picture | 2MB | 1 | 500x500px | User avatar |
| Cover Image | 5MB | 1 | 1500x500px | Profile/Community cover |
| Post Images | 5MB each | 10 | 2000x2000px | Post content |
| Message Image | 5MB | 1 | 2000x2000px | Chat images |
| Community Cover | 5MB | 1 | 1500x500px | Community banner |

### File Size Limits

- **Profile Picture**: 2MB maximum
- **All Other Images**: 5MB maximum
- **Total Upload Per Request**: 50MB maximum

---

## Upload Flow

### Storage Provider: Cloudinary

**Chosen Provider**: Cloudinary  
**Rationale**:
- ✅ Built-in CDN for fast global delivery
- ✅ Automatic image optimization and transformations
- ✅ Free tier sufficient for MVP (25 credits/month, ~25GB storage, 25GB bandwidth)
- ✅ Simple SDK integration (cloudinary npm package)
- ✅ No need for separate image processing (Sharp not required)
- ✅ Automatic format conversion (WebP for modern browsers)
- ✅ Easy migration path to paid tier if needed

**Configuration**:
```javascript
// .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### High-Level Process (Simplified with Cloudinary)

```
┌─────────┐         ┌─────────┐         ┌────────────┐
│ Client  │         │  Server │         │ Cloudinary │
└────┬────┘         └────┬────┘         └──────┬─────┘
     │                   │                      │
     │ 1. Select Image   │                      │
     │ 2. POST /upload   │                      │
     ├──────────────────>│                      │
     │                   │                      │
     │                   │ 3. Validate file     │
     │                   │    - Type check      │
     │                   │    - Size check      │
     │                   │                      │
     │                   │ 4. Upload directly   │
     │                   ├─────────────────────>│
     │                   │    (with transforms) │
     │                   │                      │
     │                   │ 5. Get URLs & info   │
     │                   │<─────────────────────┤
     │                   │                      │
     │ 6. Return URLs    │                      │
     │<──────────────────┤                      │
     │                   │                      │
```

**Note**: No temporary file storage or manual image processing needed. Cloudinary handles everything.

### Step-by-Step Flow

1. **Client Preparation**
   - User selects image(s)
   - (Optional) Client-side preview
   - (Optional) Client-side basic validation

2. **HTTP Request**
   - Method: POST
   - Content-Type: multipart/form-data
   - Endpoint: `/api/v1/upload/image`
   - Body: File + metadata (type, context)

3. **Server Validation**
   - Check authentication
   - Validate file type (MIME type + extension)
   - Validate file size
   - Check upload limits (rate limiting)

4. **Temporary Storage**
   - Save to `/tmp` or `/uploads/temp`
   - Generate unique filename

5. **Image Processing**
   - Resize to maximum dimensions
   - Compress (quality: 85%)
   - Generate thumbnail (for applicable contexts)
   - Convert to WebP (optional optimization)

6. **Cloud Upload**
   - Upload processed image(s) to cloud storage
   - Get public URLs

7. **Cleanup**
   - Delete temporary files

8. **Response**
   - Return image URL(s)
   - Return metadata (size, dimensions)

---

## File Validation

### Validation Steps

```javascript
const multer = require('multer');
const path = require('path');

// 1. Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. File Filter
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

// 3. Size Limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files per request
  }
});
```

### Validation Rules by Context

```javascript
const uploadLimits = {
  profile: {
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    dimensions: { width: 500, height: 500 },
    aspectRatio: 1 // Square
  },
  cover: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    dimensions: { width: 1500, height: 500 },
    aspectRatio: 3 // 3:1
  },
  post: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    dimensions: { width: 2000, height: 2000 },
    aspectRatio: null // Any
  },
  message: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    dimensions: { width: 2000, height: 2000 },
    aspectRatio: null // Any
  }
};

function validateUploadContext(type, fileCount, fileSize) {
  const limits = uploadLimits[type];
  
  if (!limits) {
    throw new Error('Invalid upload context');
  }
  
  if (fileCount > limits.maxFiles) {
    throw new Error(`Maximum ${limits.maxFiles} file(s) allowed`);
  }
  
  if (fileSize > limits.maxSize) {
    throw new Error(`File size exceeds ${limits.maxSize / (1024 * 1024)}MB limit`);
  }
  
  return true;
}
```

### MIME Type Detection

```javascript
const fileType = require('file-type');

async function verifyMimeType(filePath) {
  const type = await fileType.fromFile(filePath);
  
  if (!type) {
    throw new Error('Cannot determine file type');
  }
  
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedMimes.includes(type.mime)) {
    throw new Error(`File type ${type.mime} not allowed`);
  }
  
  return type;
}
```

---

## Image Processing

### Processing Pipeline

```javascript
const sharp = require('sharp');

/**
 * Process image: resize, compress, optimize
 */
async function processImage(inputPath, context) {
  const limits = uploadLimits[context];
  
  try {
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Create sharp instance
    let pipeline = sharp(inputPath);
    
    // 1. Resize if necessary
    if (metadata.width > limits.dimensions.width || 
        metadata.height > limits.dimensions.height) {
      pipeline = pipeline.resize({
        width: limits.dimensions.width,
        height: limits.dimensions.height,
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true
      });
    }
    
    // 2. Compress
    pipeline = pipeline.jpeg({ 
      quality: 85,
      progressive: true 
    });
    
    // 3. Process
    const processedBuffer = await pipeline.toBuffer();
    
    // 4. Generate filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const outputPath = `uploads/processed/${filename}`;
    
    // 5. Save processed image
    await sharp(processedBuffer).toFile(outputPath);
    
    // 6. Generate thumbnail (for applicable contexts)
    let thumbnailPath = null;
    if (['post', 'cover'].includes(context)) {
      thumbnailPath = await generateThumbnail(processedBuffer, filename);
    }
    
    return {
      originalPath: inputPath,
      processedPath: outputPath,
      thumbnailPath: thumbnailPath,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: processedBuffer.length
      }
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}
```

### Thumbnail Generation

```javascript
async function generateThumbnail(imageBuffer, filename) {
  const thumbnailFilename = `thumb-${filename}`;
  const thumbnailPath = `uploads/thumbnails/${thumbnailFilename}`;
  
  await sharp(imageBuffer)
    .resize({
      width: 300,
      height: 300,
      fit: 'cover'
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
  
  return thumbnailPath;
}
```

## Storage Strategy: Cloudinary

### Why Cloudinary?

**Chosen as primary storage provider for MVP:**
- ✅ **Free Tier**: 25 credits/month = ~25GB storage + 25GB bandwidth
- ✅ **Built-in CDN**: Fast global delivery (150+ PoPs worldwide)
- ✅ **Auto-Optimization**: Automatic WebP conversion, quality optimization
- ✅ **On-the-fly Transformations**: Resize, crop, format conversion via URL
- ✅ **No Processing Needed**: No Sharp or ImageMagick required
- ✅ **Simple API**: Easy upload with Node.js SDK
- ✅ **Backup & Security**: HTTPS, backup copies, DDoS protection

### Cloudinary Setup

**Installation:**
```bash
npm install cloudinary multer
```

**Environment Configuration:**
```bash
# .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Initialization:**
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

### Complete Upload Implementation

```javascript
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/**
 * Configure Multer with Cloudinary Storage
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const { type } = req.body; // 'profile', 'cover', 'post', 'message'
    
    // Define transformations based on context
    const transformations = {
      profile: {
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face'
      },
      cover: {
        width: 1500,
        height: 500,
        crop: 'fill'
      },
      post: {
        width: 2000,
        height: 2000,
        crop: 'limit'
      },
      message: {
        width: 2000,
        height: 2000,
        crop: 'limit'
      }
    };
    
    return {
      folder: `itihub/${type}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        transformations[type] || {},
        { quality: 'auto', fetch_format: 'auto' }
      ]
    };
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

/**
 * Upload Endpoint
 */
router.post('/upload/image', 
  checkAuth, 
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded'
          }
        });
      }
      
      // Cloudinary URL is in req.file
      res.status(200).json({
        success: true,
        data: {
          url: req.file.path, // Cloudinary secure URL
          publicId: req.file.filename,
          size: req.file.size,
          format: req.file.format
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message
        }
      });
    }
  }
);

/**
 * Multiple File Upload (for posts)
 */
router.post('/upload/images',
  checkAuth,
  upload.array('files', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES',
            message: 'No files uploaded'
          }
        });
      }
      
      const urls = req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      }));
      
      res.status(200).json({
        success: true,
        data: { images: urls }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message
        }
      });
    }
  }
);
```

### URL Transformations (On-the-fly)

Cloudinary allows image transformations via URL parameters:

**Original URL:**
```
https://res.cloudinary.com/your-cloud/image/upload/v1234/itihub/post/image.jpg
```

**Generate Thumbnail (300x300):**
```
https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill/itihub/post/image.jpg
```

**Responsive Images:**
```javascript
// In your frontend
function getResponsiveImage(publicId, width) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_auto,f_auto/${publicId}`;
}

// Usage
<img 
  src={getResponsiveImage(post.imagePublicId, 800)} 
  srcSet={`
    ${getResponsiveImage(post.imagePublicId, 400)} 400w,
    ${getResponsiveImage(post.imagePublicId, 800)} 800w,
    ${getResponsiveImage(post.imagePublicId, 1200)} 1200w
  `}
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="Post image"
/>
```

### Delete Images (Cleanup)

```javascript
/**
 * Delete image from Cloudinary
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
    return false;
  }
}

/**
 * Delete from Cloudinary
 */
async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
  }
}
```

## Implementation Details

### Upload Middleware

**File**: `middlewares/upload.js`

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
async function ensureUploadDirs() {
  const dirs = [
    'uploads/temp',
    'uploads/processed',
    'uploads/thumbnails'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

ensureUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: 'uploads/temp/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
};

// Create upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB default
    files: 10
  }
});

// Export different upload configurations
module.exports = {
  single: upload.single('file'),
  multiple: upload.array('files', 10),
  profile: upload.single('file'), // 2MB limit handled in route
};
```

### Upload Controller

**File**: `controllers/uploadController.js`

```javascript
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload single image
 */
exports.uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'Please upload an image file'
        }
      });
    }
    
    // Get upload context (profile, cover, post, message)
    const context = req.body.type || 'post';
    
    // Validate context
    const validContexts = ['profile', 'cover', 'post', 'message', 'community'];
    if (!validContexts.includes(context)) {
      await fs.unlink(req.file.path); // Clean up
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTEXT',
          message: 'Invalid upload context'
        }
      });
    }
    
    // Process image
    const processedImage = await processImage(req.file.path, context);
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      processedImage.processedPath,
      {
        folder: `itihub/${context}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
      }
    );
    
    // Upload thumbnail if exists
    let thumbnailUrl = null;
    if (processedImage.thumbnailPath) {
      const thumbResult = await cloudinary.uploader.upload(
        processedImage.thumbnailPath,
        {
          folder: `itihub/${context}/thumbnails`,
          resource_type: 'image'
        }
      );
      thumbnailUrl = thumbResult.secure_url;
    }
    
    // Cleanup temp files
    await cleanupFiles([
      req.file.path,
      processedImage.processedPath,
      processedImage.thumbnailPath
    ]);
    
    // Return URLs
    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        thumbnail: thumbnailUrl,
        publicId: uploadResult.public_id,
        metadata: {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          size: uploadResult.bytes
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Cleanup on error
    if (req.file) {
      await cleanupFiles([req.file.path]);
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'File upload failed'
      }
    });
  }
};

/**
 * Process image helper
 */
async function processImage(inputPath, context) {
  const limits = {
    profile: { width: 500, height: 500 },
    cover: { width: 1500, height: 500 },
    post: { width: 2000, height: 2000 },
    message: { width: 2000, height: 2000 },
    community: { width: 1500, height: 500 }
  };
  
  const limit = limits[context];
  const filename = `processed-${Date.now()}.jpg`;
  const outputPath = `uploads/processed/${filename}`;
  
  // Process
  await sharp(inputPath)
    .resize({
      width: limit.width,
      height: limit.height,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 85, progressive: true })
    .toFile(outputPath);
  
  // Generate thumbnail for applicable contexts
  let thumbnailPath = null;
  if (['post', 'cover', 'community'].includes(context)) {
    thumbnailPath = `uploads/thumbnails/thumb-${filename}`;
    await sharp(inputPath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
  }
  
  return {
    processedPath: outputPath,
    thumbnailPath: thumbnailPath
  };
}

/**
 * Cleanup temp files
 */
async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore errors (file might not exist)
      }
    }
  }
}
```

### Upload Routes

**File**: `routes/uploadRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { single } = require('../middlewares/upload');
const checkAuth = require('../middlewares/checkAuth');

/**
 * POST /api/v1/upload/image
 * Upload single image
 * Auth required
 */
router.post('/image', checkAuth, single, uploadController.uploadImage);

module.exports = router;
```

---

## Security Considerations

### 1. File Type Verification

**Multiple layers:**
```javascript
// 1. Check MIME type from header
// 2. Check file extension
// 3. Verify actual file content (magic numbers)

const fileType = require('file-type');

async function verifyFile(filePath) {
  // Check actual file type
  const type = await fileType.fromFile(filePath);
  
  if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
    throw new Error('Invalid file type');
  }
  
  return type;
}
```

### 2. Filename Sanitization

```javascript
function sanitizeFilename(filename) {
  // Remove special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100); // Limit length
}
```

### 3. Virus Scanning (Optional)

For production, consider using ClamAV:

```javascript
const NodeClam = require('clamscan');

async function scanFile(filePath) {
  const clamscan = await new NodeClam().init();
  const { isInfected, viruses } = await clamscan.isInfected(filePath);
  
  if (isInfected) {
    throw new Error(`Virus detected: ${viruses.join(', ')}`);
  }
}
```

### 4. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many uploads. Please try again later.'
    }
  }
});

router.post('/image', uploadLimiter, checkAuth, single, uploadController.uploadImage);
```

### 5. Access Control

```javascript
// Only allow authenticated users to upload
router.post('/image', checkAuth, single, uploadController.uploadImage);

// Store uploader ID with image metadata
const imageRecord = {
  url: uploadResult.secure_url,
  uploadedBy: req.userId,
  uploadedAt: new Date(),
  context: context
};
```

---

## Error Handling

### Common Errors

| Error Code | HTTP Status | Message | Cause |
|------------|-------------|---------|-------|
| NO_FILE_UPLOADED | 400 | Please upload an image file | No file in request |
| INVALID_FILE_TYPE | 400 | Only JPEG, PNG, WebP allowed | Wrong file type |
| FILE_TOO_LARGE | 413 | File exceeds size limit | File > limit |
| INVALID_CONTEXT | 400 | Invalid upload context | Wrong context value |
| PROCESSING_FAILED | 500 | Image processing failed | Sharp error |
| UPLOAD_FAILED | 500 | File upload failed | Cloud storage error |
| RATE_LIMIT_EXCEEDED | 429 | Too many uploads | Rate limit hit |

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit",
    "details": {
      "maxSize": 5242880,
      "receivedSize": 6291456
    }
  }
}
```

---

## Testing

### Unit Tests

```javascript
describe('Image Processing', () => {
  it('should resize large image', async () => {
    const result = await processImage('test-large.jpg', 'post');
    expect(result.processedPath).toBeDefined();
    
    const metadata = await sharp(result.processedPath).metadata();
    expect(metadata.width).toBeLessThanOrEqual(2000);
    expect(metadata.height).toBeLessThanOrEqual(2000);
  });
  
  it('should generate thumbnail', async () => {
    const result = await processImage('test.jpg', 'post');
    expect(result.thumbnailPath).toBeDefined();
    
    const metadata = await sharp(result.thumbnailPath).metadata();
    expect(metadata.width).toBe(300);
    expect(metadata.height).toBe(300);
  });
});
```

### Integration Tests

```javascript
describe('POST /api/v1/upload/image', () => {
  it('should upload valid image', async () => {
    const response = await request(app)
      .post('/api/v1/upload/image')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('file', 'test-images/valid.jpg')
      .field('type', 'post');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.url).toBeDefined();
  });
  
  it('should reject invalid file type', async () => {
    const response = await request(app)
      .post('/api/v1/upload/image')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('file', 'test-images/document.pdf');
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

---

**End of File Upload & Media Handling Specification**
