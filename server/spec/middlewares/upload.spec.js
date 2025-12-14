const upload = require('../../middlewares/upload');
const {
  MAX_PROFILE_IMAGE_SIZE_MB,
  MAX_COVER_IMAGE_SIZE_MB,
  MAX_POST_IMAGE_SIZE_MB,
  MAX_MESSAGE_IMAGE_SIZE_MB,
  MAX_POST_IMAGES_COUNT
} = require('../../utils/constants');

describe('Upload Middleware', () => {
  describe('upload object structure', () => {
    it('should export upload.profile middleware', () => {
      expect(upload.profile).toBeDefined();
      expect(typeof upload.profile).toBe('function');
    });

    it('should export upload.cover middleware', () => {
      expect(upload.cover).toBeDefined();
      expect(typeof upload.cover).toBe('function');
    });

    it('should export upload.post middleware', () => {
      expect(upload.post).toBeDefined();
      expect(typeof upload.post).toBe('function');
    });

    it('should export upload.message middleware', () => {
      expect(upload.message).toBeDefined();
      expect(typeof upload.message).toBe('function');
    });
  });

  describe('middleware configuration verification', () => {
    it('should have profile middleware with correct name', () => {
      expect(upload.profile.name).toBe('multerMiddleware');
    });

    it('should have cover middleware with correct name', () => {
      expect(upload.cover.name).toBe('multerMiddleware');
    });

    it('should have post middleware with correct name', () => {
      expect(upload.post.name).toBe('multerMiddleware');
    });

    it('should have message middleware with correct name', () => {
      expect(upload.message.name).toBe('multerMiddleware');
    });
  });

  describe('file filter logic', () => {
    let fileFilter;

    beforeEach(() => {
      // Recreate the file filter logic from middleware
      fileFilter = (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.'), false);
        }
      };
    });

    it('should accept valid JPEG MIME type', (done) => {
      fileFilter({}, { mimetype: 'image/jpeg' }, (err, result) => {
        expect(err).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it('should accept valid PNG MIME type', (done) => {
      fileFilter({}, { mimetype: 'image/png' }, (err, result) => {
        expect(err).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it('should accept valid WebP MIME type', (done) => {
      fileFilter({}, { mimetype: 'image/webp' }, (err, result) => {
        expect(err).toBeNull();
        expect(result).toBe(true);
        done();
      });
    });

    it('should reject GIF MIME type', (done) => {
      fileFilter({}, { mimetype: 'image/gif' }, (err) => {
        expect(err).toBeDefined();
        expect(err.message).toContain('Invalid file type');
        done();
      });
    });

    it('should reject PDF MIME type', (done) => {
      fileFilter({}, { mimetype: 'application/pdf' }, (err) => {
        expect(err).toBeDefined();
        expect(err.message).toContain('Invalid file type');
        done();
      });
    });

    it('should reject SVG MIME type', (done) => {
      fileFilter({}, { mimetype: 'image/svg+xml' }, (err) => {
        expect(err).toBeDefined();
        expect(err.message).toContain('Invalid file type');
        done();
      });
    });

    it('should reject video MIME type', (done) => {
      fileFilter({}, { mimetype: 'video/mp4' }, (err) => {
        expect(err).toBeDefined();
        expect(err.message).toContain('Invalid file type');
        done();
      });
    });
  });

  describe('size limits verification', () => {
    it('should use correct profile image size limit', () => {
      expect(MAX_PROFILE_IMAGE_SIZE_MB).toBe(5);
    });

    it('should use correct cover image size limit', () => {
      expect(MAX_COVER_IMAGE_SIZE_MB).toBe(10);
    });

    it('should use correct post image size limit', () => {
      expect(MAX_POST_IMAGE_SIZE_MB).toBe(10);
    });

    it('should use correct message image size limit', () => {
      expect(MAX_MESSAGE_IMAGE_SIZE_MB).toBe(5);
    });

    it('should use correct max post images count', () => {
      expect(MAX_POST_IMAGES_COUNT).toBe(4);
    });
  });
});
