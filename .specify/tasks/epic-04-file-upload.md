# Epic 4: File Upload & Media

**Status**: ⬜ Not Started  
**Priority**: P0 (MVP)  
**Effort**: 5-7 days  
**Depends on**: Epic 1 (Authentication)  
**Start Date**: TBD  
**Target Completion**: December 20, 2025

---

## Overview

Implement file upload functionality for user-generated media content using **Sharp for local image processing** and **Cloudinary for storage and CDN delivery**. Support profile pictures, cover images, and post media with automatic optimization and transformation.

### Goals

- ✅ Secure file upload with validation
- ✅ **Sharp-based local image processing** (compress, resize, optimize)
- ✅ Cloudinary integration for storage and CDN delivery
- ✅ Cost-effective approach (free transformations via Sharp)
- ✅ Context-aware upload limits (profile, cover, post)
- ✅ Old media cleanup when replaced

### Non-Goals (Post-MVP)

- ❌ Video upload support
- ❌ GIF support
- ❌ Document upload (PDF, DOCX)
- ❌ Direct storage (S3, local filesystem)
- ❌ Advanced image editing features
- ❌ Cloudinary transformations (handled by Sharp locally)

---

## User Stories

### 1. Upload Profile Picture
**As a** registered user  
**I want to** upload a profile picture  
**So that** I can personalize my account

**Acceptance Criteria:**
- User can upload JPG, PNG, or WebP images
- Maximum file size: 5MB (before processing)
- Image automatically resized to 500x500px (square)
- Compressed to WebP format (quality: 85)
- Metadata stripped for privacy
- Old profile picture deleted from Cloudinary
- Returns new image URL

---

### 2. Upload Cover Image
**As a** registered user  
**I want to** upload a cover image  
**So that** I can customize my profile appearance

**Acceptance Criteria:**
- User can upload JPG, PNG, or WebP images
- Maximum file size: 10MB (before processing)
- Image automatically resized to 1500x500px (3:1 aspect ratio)
- Compressed to WebP format (quality: 85)
- Metadata stripped for privacy
- Old cover image deleted from Cloudinary
- Returns new image URL

---

### 3. Upload Post Images
**As a** registered user  
**I want to** upload images with my posts  
**So that** I can share visual content

**Acceptance Criteria:**
- User can upload up to 4 images per post
- Maximum file size per image: 10MB (before processing)
- Images automatically optimized (max 2000x2000px)
- Compressed to WebP format (quality: 85)
- Metadata stripped for privacy
- Images stored in Cloudinary
- Returns array of image URLs

---

## Technical Architecture

### Hybrid Approach: Sharp + Cloudinary

**Why Sharp for Processing?**
- ⚡ **Fast**: Built on libvips (10-20x faster than ImageMagick)
- 💰 **Cost-effective**: Free transformations, only pay for Cloudinary storage/bandwidth
- 🎛️ **Control**: Full control over compression, formats, quality
- 📦 **Smaller uploads**: Process before upload = less bandwidth
- 🔧 **Flexibility**: Easy to change processing logic

**Why Cloudinary for Storage?**
- 🌍 **Global CDN**: Fast delivery worldwide
- 💾 **Reliable storage**: No need to manage servers
- 🔗 **Simple URLs**: Easy to integrate with frontend
- 📊 **Free tier**: 25GB storage, 25GB bandwidth/month
- 🔄 **Easy migration**: Can add transformations later if needed

**Configuration:**
```javascript
// .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Upload Flow

```
Client → Multer (Memory) → Sharp Processing → Cloudinary Upload → CDN URL
                              ↓
                    (Validate, Resize, Compress, 
                     Convert to WebP, Strip Metadata)
```

### Sharp Processing Pipeline

```javascript
// Example: Profile Picture Processing
const processedBuffer = await sharp(fileBuffer)
  .resize(500, 500, { fit: 'cover', position: 'center' })
  .webp({ quality: 85 })
  .toBuffer();

// Then upload to Cloudinary (just storage, no transformations)
const result = await cloudinary.uploader.upload_stream({
  folder: 'profile-pictures',
  public_id: `user_${userId}_${Date.now()}`,
  resource_type: 'image'
});
```

### File Processing Rules

| Context | Max Upload Size | Output Dimensions | Output Format | Quality | Max Count |
|---------|----------------|-------------------|---------------|---------|-----------|
| Profile Picture | 5MB | 500x500px (square) | WebP | 85 | 1 |
| Cover Image | 10MB | 1500x500px (3:1) | WebP | 85 | 1 |
| Post Images | 10MB each | 2000x2000px (max) | WebP | 85 | 4 |
| Message Image | 5MB | 1200x1200px (max) | WebP | 85 | 1 |

**Allowed Input MIME Types:** `image/jpeg`, `image/png`, `image/webp`  
**Output Format:** Always WebP (better compression, modern browser support)

---

## Implementation Tasks

### Phase 1: Setup & Configuration (1 day)

**T034: Setup Dependencies** (0.5 days)
- Install packages:
  - `sharp` (^0.33.0) - Image processing
  - `cloudinary` (^1.41.0) - Storage/CDN
  - `multer` (^1.4.5-lts.1) - File upload handling
  - `file-type` (^18.7.0) - MIME type detection
- Configure Cloudinary credentials in `.env`
- Verify Sharp installation (native dependencies)

**T035: Create Image Processing Utilities** (0.5 days)
- File: `/server/utils/imageProcessor.js`
- Single function: `processImage(buffer, options)` - Configurable image processing
- Options:
  - `width` - Target width in pixels
  - `height` - Target height in pixels (optional)
  - `quality` - WebP quality (1-100, default: 85)
  - `fit` - Resize strategy: 'cover', 'contain', 'inside' (default: 'inside')
- Function:
  - Resizes image to dimensions
  - Converts to WebP with specified quality
  - Strips metadata (privacy)
  - Returns buffer
- Preset configurations exported for convenience add them in `/server/utils/constant.js`:
  - `PROFILE_OPTIONS` - 500x500, quality 85, fit: cover
  - `COVER_OPTIONS` - 1500x500, quality 85, fit: cover
  - `POST_OPTIONS` - 2000x2000 max, quality 85, fit: inside
  - `MESSAGE_OPTIONS` - 1200x1200 max, quality 85, fit: inside
- Tests: 12+ unit tests

**Example Implementation:**
```javascript
const sharp = require('sharp');

// Configuration presets
const IMAGE_CONFIGS = {
  PROFILE: { width: 500, height: 500, quality: 85, fit: 'cover' },
  COVER: { width: 1500, height: 500, quality: 85, fit: 'cover' },
  POST: { width: 2000, height: 2000, quality: 85, fit: 'inside' },
  MESSAGE: { width: 1200, height: 1200, quality: 85, fit: 'inside' }
};

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
    height = width, // Default to square if height not provided
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

// Convenience wrapper functions using presets
async function processProfilePicture(imageBuffer) {
  return processImage(imageBuffer, IMAGE_CONFIGS.PROFILE);
}

async function processCoverImage(imageBuffer) {
  return processImage(imageBuffer, IMAGE_CONFIGS.COVER);
}

async function processPostImage(imageBuffer) {
  return processImage(imageBuffer, IMAGE_CONFIGS.POST);
}

async function processMessageImage(imageBuffer) {
  return processImage(imageBuffer, IMAGE_CONFIGS.MESSAGE);
}

module.exports = {
  processImage,
  processProfilePicture,
  processCoverImage,
  processPostImage,
  processMessageImage,
  IMAGE_CONFIGS
};
```

---

### Phase 2: Cloudinary & Validation Utilities (1 day)

**T036: Create Cloudinary Upload Utilities** (0.5 days)
- File: `/server/utils/cloudinary.js`
- Functions:
  - `uploadToCloudinary(buffer, folder, publicId)` - Upload processed buffer
  - `deleteFromCloudinary(publicId)` - Delete old image
  - `extractPublicId(url)` - Extract public ID from Cloudinary URL
- Upload via stream (efficient for buffers)
- Tests: 8+ unit tests (mocked Cloudinary)

**Example:**
```javascript
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function uploadToCloudinary(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        format: 'webp' // Ensure WebP format
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
}

function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

function extractPublicId(cloudinaryUrl) {
  // Extract public_id from URL
  // Example: https://res.cloudinary.com/demo/image/upload/v1234/folder/image.webp
  // Returns: folder/image
  const match = cloudinaryUrl.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}
```

**T037: Create File Validation Utilities** (0.5 days)
- File: `/server/utils/fileValidation.js`
- Functions:
  - `validateFileType(buffer)` - Check MIME type via magic numbers
  - `validateFileSize(file, maxSize)` - Check size before processing
  - `validateImageBuffer(buffer)` - Verify buffer is valid image
- Tests: 10+ unit tests

**Example:**
```javascript
const { fileTypeFromBuffer } = require('file-type');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function validateFileType(buffer) {
  const fileType = await fileTypeFromBuffer(buffer);
  
  if (!fileType) {
    throw new Error('Invalid file type');
  }
  
  if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    throw new Error(`Unsupported file type: ${fileType.mime}`);
  }
  
  return fileType;
}

function validateFileSize(file, maxSizeInMB) {
  const maxBytes = maxSizeInMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    throw new Error(`File too large. Maximum size: ${maxSizeInMB}MB`);
  }
  
  return true;
}

async function validateImageBuffer(buffer) {
  try {
    const sharp = require('sharp');
    await sharp(buffer).metadata();
    return true;
  } catch (error) {
    throw new Error('Invalid image buffer');
  }
}
```

---

### Phase 3: Upload Middleware (1 day)

**T038: Create Upload Middleware** (1 day)
- File: `/server/middlewares/upload.js`
- Setup Multer with memory storage
- Context-aware file limits:
  - `upload.profile` - Single file, max 5MB
  - `upload.cover` - Single file, max 10MB
  - `upload.post` - Array (max 4 files), max 10MB each
  - `upload.message` - Single file, max 5MB
- Error handling:
  - Invalid file type
  - File too large
  - Too many files
  - No file provided
- Tests: 15+ middleware tests

**Implementation:**
```javascript
const multer = require('multer');

const storage = multer.memoryStorage();

// File filter (basic check, detailed validation in controller)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'), false);
  }
};

const upload = {
  profile: multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }).single('image'),
  
  cover: multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  }).single('image'),
  
  post: multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 4 // Max 4 files
    }
  }).array('images', 4),
  
  message: multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }).single('image')
};

module.exports = upload;
```

---

### Phase 4: Profile Picture Upload (1 day)

**T039: Implement Profile Picture Upload Controller** (1 day)
- File: `/server/controllers/user/uploadProfilePictureController.js`
- Route: `POST /users/profile/picture`
- Middleware: `checkAuth`, `upload.profile`

**Implementation Flow:**
1. Validate file exists (`req.file`)
2. Validate file type via magic numbers (Sharp/file-type)
3. Process image with Sharp (500x500, WebP, quality 85)
4. Upload processed buffer to Cloudinary (`profile-pictures` folder)
5. Delete old profile picture from Cloudinary (if exists)
6. Update `user.profilePicture` with new URL
7. Return success response with new URL

**Code Example:**
```javascript
const { processProfilePicture } = require('../../utils/imageProcessor');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../../utils/cloudinary');
const { validateFileType } = require('../../utils/fileValidation');
const User = require('../../models/User');

async function uploadProfilePicture(req, res) {
  try {
    // 1. Check file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // 2. Validate file type
    await validateFileType(req.file.buffer);

    // 3. Process image with Sharp
    const processedBuffer = await processProfilePicture(req.file.buffer);

    // 4. Upload to Cloudinary
    const publicId = `user_${req.userId}_${Date.now()}`;
    const result = await uploadToCloudinary(
      processedBuffer,
      'profile-pictures',
      publicId
    );

    // 5. Delete old profile picture
    const user = await User.findById(req.userId);
    if (user.profilePicture) {
      const oldPublicId = extractPublicId(user.profilePicture);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // 6. Update user
    user.profilePicture = result.secure_url;
    await user.save();

    // 7. Return response
    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: result.secure_url
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture'
    });
  }
}

module.exports = uploadProfilePicture;
```

**Tests:**
- Upload valid JPEG image
- Upload valid PNG image
- Upload valid WebP image
- Reject invalid file type
- Reject oversized file (> 5MB)
- Reject no file provided
- Update user model correctly
- Delete old image from Cloudinary
- Handle Sharp processing errors
- Handle Cloudinary upload errors
- Require authentication
- Tests: 12+ controller tests

---

### Phase 5: Cover Image Upload (0.5 days)

**T040: Implement Cover Image Upload Controller** (0.5 days)
- File: `/server/controllers/user/uploadCoverImageController.js`
- Route: `POST /users/profile/cover`
- Middleware: `checkAuth`, `upload.cover`
- Similar to T039 but:
  - Process with `processCoverImage` (1500x500, WebP)
  - Upload to `cover-images` folder
  - Update `user.coverImage` field
  - Max file size: 10MB
- Tests: 10+ controller tests

---

### Phase 6: Post Images Upload (1.5 days)

**T041: Update Create Post Controller for Media** (1.5 days)
- Update: `/server/controllers/post/createPostController.js`
- Route: `POST /posts` (multipart/form-data)
- Middleware: `checkAuth`, `upload.post`

**Implementation Flow:**
1. Check `req.files` array exists
2. Validate at least content or images provided
3. Validate file types for all images
4. Process all images in parallel with Sharp
5. Upload all processed buffers to Cloudinary in parallel
6. Get array of secure URLs
7. Create post with `media` array
8. Return post with media URLs

**Code Example:**
```javascript
const { processPostImage } = require('../../utils/imageProcessor');
const { uploadToCloudinary } = require('../../utils/cloudinary');
const { validateFileType } = require('../../utils/fileValidation');
const Post = require('../../models/Post');

async function createPost(req, res) {
  try {
    const { content } = req.body;
    const files = req.files || [];

    // 1. Validate content or images provided
    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post must have content or images'
      });
    }

    let mediaUrls = [];

    if (files.length > 0) {
      // 2. Validate all file types
      await Promise.all(files.map(file => validateFileType(file.buffer)));

      // 3. Process all images in parallel
      const processedBuffers = await Promise.all(
        files.map(file => processPostImage(file.buffer))
      );

      // 4. Upload all to Cloudinary in parallel
      const uploadPromises = processedBuffers.map((buffer, index) => {
        const publicId = `post_${req.userId}_${Date.now()}_${index}`;
        return uploadToCloudinary(buffer, 'post-images', publicId);
      });

      const results = await Promise.all(uploadPromises);
      mediaUrls = results.map(r => r.secure_url);
    }

    // 5. Create post
    const post = await Post.create({
      author: req.userId,
      content: content || '',
      media: mediaUrls
    });

    await post.populate('author', 'username fullName profilePicture');

    // 6. Return response
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
}

module.exports = createPost;
```

**Tests:**
- Create post with single image
- Create post with multiple images (2-4)
- Create post with content only (no images)
- Create post with images only (no content)
- Reject more than 4 images
- Reject invalid file types
- Reject oversized files (> 10MB)
- Handle partial upload failure (rollback)
- Verify all images processed correctly
- Verify parallel upload works
- Require authentication
- Tests: 15+ tests

---

### Phase 7: Routes & Integration (1.5 days)

**T042: Create Upload Routes** (0.5 days)
- Update: `/server/routes/userRoutes.js`
- Routes:
  - `POST /users/profile/picture` → uploadProfilePicture (checkAuth, upload.profile)
  - `POST /users/profile/cover` → uploadCoverImage (checkAuth, upload.cover)

**T043: Create File Upload Integration Tests** (1 day)
- File: `/server/spec/integration/fileUpload.integration.spec.js`
- Tests: 25+ end-to-end tests

**Test Scenarios:**
- Upload profile picture (JPEG, PNG, WebP)
- Upload cover image
- Upload post with 1 image
- Upload post with 4 images
- Verify images processed correctly (WebP, correct dimensions)
- Verify old imagesu deleted when replaced
- Reject invalid file types
- Reject oversized files
- Verify Cloudinary URLs returned
- Test authentication required
- Test parallel image processing
- Test error handling (Cloudinary failure, Sharp failure)

---

## Data Models

### User Model Updates

```javascript
// /server/models/User.js
{
  profilePicture: String,  // Cloudinary URL (WebP)
  coverImage: String,      // Cloudinary URL (WebP)
  // ... existing fields
}
```

### Post Model Updates

```javascript
// /server/models/Post.js
{
  media: [String],  // Array of Cloudinary URLs (WebP, max 4)
  // ... existing fields
}
```

---

## API Endpoints

### Upload Profile Picture

```http
POST /users/profile/picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- image: File (JPEG/PNG/WebP, max 5MB)

Response 200:
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "https://res.cloudinary.com/.../profile-pictures/user_123_1234567890.webp"
  }
}
```

### Upload Cover Image

```http
POST /users/profile/cover
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- image: File (JPEG/PNG/WebP, max 10MB)

Response 200:
{
  "success": true,
  "message": "Cover image uploaded successfully",
  "data": {
    "coverImage": "https://res.cloudinary.com/.../cover-images/user_123_1234567890.webp"
  }
}
```

### Create Post with Images

```http
POST /posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- content: String (optional if images provided)
- images: File[] (max 4, 10MB each, JPEG/PNG/WebP)

Response 201:
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "_id": "...",
      "content": "Check out these photos!",
      "media": [
        "https://res.cloudinary.com/.../post-images/post_123_1234567890_0.webp",
        "https://res.cloudinary.com/.../post-images/post_123_1234567890_1.webp"
      ],
      "author": { ... },
      "createdAt": "..."
    }
  }
}
```

---

## Error Handling

### Common Upload Errors

| Error Code | Message | Cause |
|------------|---------|-------|
| 400 | Invalid file type | Non-image file or unsupported format |
| 400 | File too large | Exceeds context size limit |
| 400 | Too many files | Exceeds max file count (4 for posts) |
| 400 | No file provided | Missing file in request |
| 400 | Post must have content or images | Both content and images empty |
| 401 | Authentication required | Missing or invalid token |
| 413 | Payload too large | Total request size exceeds limit |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Image processing failed | Sharp error (corrupt image) |
| 500 | Upload failed | Cloudinary error or network issue |

---

## Testing Strategy

### Unit Tests (70+ tests)

**Image Processing (12 tests):**
- Profile picture processing (500x500, WebP)
- Cover image processing (1500x500, WebP)
- Post image processing (max 2000x2000, WebP)
- Metadata stripping
- Quality settings
- Error handling (invalid buffers)

**Cloudinary Utilities (8 tests):**
- Upload buffer to Cloudinary
- Delete image from Cloudinary
- Extract public ID from URL
- Handle upload errors
- Handle delete errors

**File Validation (10 tests):**
- Valid JPEG/PNG/WebP accepted
- Invalid file types rejected
- File size validation
- Buffer validation
- Magic number verification

**Upload Middleware (15 tests):**
- Single file upload (profile, cover)
- Multiple file upload (posts)
- File count limits enforced
- Size limits enforced
- MIME type validation
- Error handling

**Controllers (25+ tests):**
- Profile picture upload (12 tests)
- Cover image upload (10 tests)
- Post images upload (15+ tests)

### Integration Tests (25+ tests)

**End-to-End Upload Flows:**
- Complete profile picture flow (3 file types)
- Complete cover image flow
- Post with 1-4 images
- Verify Sharp processing applied
- Verify WebP output format
- Verify correct dimensions
- Old media cleanup verified
- Authentication checks
- Validation errors
- Cloudinary integration (real or mocked)
- Parallel processing performance
- Error rollback (failed uploads)

---

## Performance Considerations

### Processing Optimization

- **Memory storage (Multer)**: No disk I/O overhead
- **Sharp processing**: 10-20x faster than ImageMagick
- **Parallel uploads**: Process and upload multiple images simultaneously
- **Buffer streaming**: Efficient memory usage
- **WebP format**: ~30% smaller than JPEG at same quality

### Expected Performance

| Operation | Time (Single Image) | Time (4 Images) |
|-----------|-------------------|-----------------|
| Sharp processing | < 100ms | < 400ms (parallel) |
| Cloudinary upload | < 1s | < 2s (parallel) |
| **Total** | **< 2s** | **< 3s** |

### Memory Usage

- Profile picture: ~500KB processed (from ~2-3MB original)
- Cover image: ~800KB processed (from ~5-8MB original)
- Post image: ~500KB-2MB processed (from ~5-10MB original)
- Peak memory: ~50MB for 4 concurrent uploads

---

## Security Considerations

### File Validation

- ✅ MIME type validation via magic numbers (file-type)
- ✅ File size limits before and after processing
- ✅ Sharp validates image integrity during processing
- ✅ Metadata stripped (EXIF, location data)
- ✅ No user-controlled file paths

### Cloudinary Security

- ✅ API credentials in environment variables
- ✅ Folder organization prevents overwrites
- ✅ Public ID includes user ID and timestamp
- ✅ No sensitive data in filenames
- ✅ Signed URLs (optional, for private content)

### Processing Security

- ✅ Sharp handles malformed images safely
- ✅ Memory limits prevent DOS attacks
- ✅ File type verified before processing
- ✅ No command injection vulnerabilities

---

## Cost Analysis

### Sharp vs Cloudinary Transformations

**Example: 10,000 profile picture uploads/month**

| Approach | Cost |
|----------|------|
| **Sharp processing** (our approach) | $0 (local processing) + Cloudinary storage |
| Cloudinary transformations | ~$50-100/month (transformation credits) |

**Monthly Savings:** ~$50-100/month

### Cloudinary Free Tier

- 25 GB storage
- 25 GB bandwidth/month
- **No transformation costs** (handled by Sharp)
- Estimated capacity: ~50,000 images/month

### When to Upgrade

- Storage > 25GB
- Bandwidth > 25GB/month
- Need advanced features (video, AI)

---

## Cleanup Tasks

**Orphaned Images:**
- Scheduled job to find images not referenced by any user/post
- Delete from Cloudinary after 30 days

**Deleted Users:**
- Cascade delete all user images (profile, cover, posts)

**Failed Uploads:**
- Retry logic for transient failures
- Clean up partial uploads after 24 hours

---

## Future Enhancements (Post-MVP)

- [ ] Video upload with transcoding
- [ ] GIF support with optimization
- [ ] Progressive image loading (LQIP - Low Quality Image Placeholder)
- [ ] Client-side image compression before upload
- [ ] Direct browser-to-Cloudinary upload (for large files)
- [ ] Image filters and effects (via Sharp)
- [ ] Thumbnail generation for galleries
- [ ] AVIF format support (better than WebP)
- [ ] Automatic image tagging (AI/ML)
- [ ] User storage quotas

---

## Dependencies

**Epic 1**: Authentication (checkAuth middleware)  
**Epic 3**: Posts system (for post images)

**External Services:**
- Cloudinary account and API credentials

**NPM Packages:**
- `sharp` (^0.33.0) - Local image processing
- `cloudinary` (^1.41.0) - Storage and CDN
- `multer` (^1.4.5-lts.1) - File upload handling
- `file-type` (^18.7.0) - MIME type detection

---

## Success Criteria

- [ ] All 10 tasks completed (T034-T043)
- [ ] All 70+ unit tests passing
- [ ] All 25+ integration tests passing
- [ ] Sharp processing working correctly (WebP, correct dimensions)
- [ ] Cloudinary integration working in dev and production
- [ ] Profile picture upload functional (WebP output)
- [ ] Cover image upload functional (WebP output)
- [ ] Post images upload functional (max 4, WebP output)
- [ ] File validation preventing invalid uploads
- [ ] Old images properly deleted when replaced
- [ ] Metadata stripped from all images
- [ ] Upload performance acceptable (< 2s for single image, < 3s for 4 images)
- [ ] Memory usage within limits
- [ ] API documentation complete
- [ ] Manual testing with real images successful
- [ ] Free tier usage within limits (25GB storage/bandwidth)
- [ ] No Cloudinary transformation costs incurred

---

**Epic Owner**: TBD  
**Review Date**: December 20, 2025  
**Status**: Not Started
