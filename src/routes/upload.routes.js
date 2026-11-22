const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage keeps files in RAM so malicious files are never placed on disk unverified
const storage = multer.memoryStorage();

// Dangerous extensions commonly used in web shells, remote code execution & script injection
const DANGEROUS_EXTENSIONS = [
  '.php', '.php2', '.php3', '.php4', '.php5', '.phtml', '.phps', '.phar',
  '.asp', '.aspx', '.cer', '.asa', '.asax',
  '.jsp', '.jspx', '.jsw', '.jsv', '.jspf',
  '.sh', '.bash', '.csh', '.zsh', '.ksh',
  '.exe', '.com', '.bat', '.cmd', '.vbs', '.vbe', '.ws', '.wsf', '.msi',
  '.js', '.mjs', '.cjs', '.ts',
  '.py', '.pyc', '.pyo', '.pyd',
  '.pl', '.pm', '.cgi',
  '.html', '.htm', '.xhtml', '.shtml', '.hta',
  '.svg', '.xml', // SVG can execute malicious embedded JavaScript / XSS
  '.htaccess', '.htpasswd', '.config', '.env', '.ini'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif'];

// Magic bytes validation for true binary image signatures
function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'gif';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return false;
}

// Multer upload with strict file filtering
const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const originalName = (file.originalname || '').toLowerCase();
    const ext = path.extname(originalName);

    // 1. Block dangerous shell extensions (including double extension attacks e.g. shell.php.jpg)
    const hasDangerousExtension = DANGEROUS_EXTENSIONS.some((dangerExt) =>
      originalName.includes(dangerExt)
    );

    if (hasDangerousExtension) {
      return cb(
        new Error(
          'Security Alert: Executable script or shell extensions are strictly forbidden.'
        )
      );
    }

    // 2. Check whitelist extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new Error(
          'Invalid file type. Only image files (jpg, jpeg, png, webp, gif) are accepted.'
        )
      );
    }

    // 3. Check MIME type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Uploaded file is not a valid image MIME type.'));
    }

    cb(null, true);
  }
});

// Single file upload route with Shell Sanitization & WebP Conversion
router.post('/', (req, res) => {
  const uploadHandler = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]);

  uploadHandler(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload rejected for security validation.'
      });
    }

    const uploadedFile = req.files?.image?.[0] || req.files?.file?.[0];

    if (!uploadedFile || !uploadedFile.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded.'
      });
    }

    // Step 1: Deep Binary Signature (Magic Byte) Inspection
    const detectedFormat = validateImageMagicBytes(uploadedFile.buffer);
    if (!detectedFormat) {
      return res.status(400).json({
        success: false,
        message:
          'Security Block: File header does not match a valid image signature. Possible fake image or disguised script.'
      });
    }

    try {
      // Step 2: Pixel Re-encoding & Sanitization with Sharp
      // Re-encoding decodes the raw image pixels and re-compresses them from scratch into WebP.
      // Any embedded shell scripts, PHP tags, or malicious EXIF payloads are permanently destroyed.
      const safeRandomName = `img-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
      const targetFilePath = path.join(uploadsDir, safeRandomName);

      const convertedBuffer = await sharp(uploadedFile.buffer)
        .rotate() // auto-orient based on EXIF before stripping
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: 85,
          effort: 4
        })
        .toBuffer();

      // Write strictly sanitized, converted WebP to disk
      await fs.promises.writeFile(targetFilePath, convertedBuffer);

      // Step 3: Construct clean URL for database storage (handles SSL reverse proxy)
      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
      const host = req.get('host');
      const fileUrl = `${protocol}://${host}/uploads/${safeRandomName}`;

      res.status(200).json({
        success: true,
        message: 'Image securely validated, converted to WebP, and saved.',
        data: {
          url: fileUrl,
          filename: safeRandomName,
          format: 'webp',
          size: convertedBuffer.length,
          originalName: path.basename(uploadedFile.originalname)
        }
      });
    } catch (sharpError) {
      console.error('Image re-encoding error:', sharpError.message);
      return res.status(400).json({
        success: false,
        message:
          'Image processing failed. The file appears to be corrupted, malformed, or contains non-image data.'
      });
    }
  });
});

module.exports = router;
