import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import { s3Client } from '../utils/s3Client';

// File size limit (10MB) – larger to accommodate high-resolution images
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;

// Allowed file formats
const ALLOWED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

// ----------------------------
// Storage configuration
// ----------------------------
// 1) S3 (production)
// 2) Local disk (development / when AWS env is missing)

let storage: multer.StorageEngine;

if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  // --- S3 storage ---
  storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const timestamp = Date.now().toString();
      const rawName = file.originalname;

      // Normalize and remove unsafe characters to ensure S3 key is URL-safe.
      const sanitizedName = rawName
        .normalize('NFKD')                // Decompose accents
        .replace(/[^\w.\-]+/g, '_')      // Replace non-word/unapproved chars with _
        .replace(/_+/g, '_')               // Collapse consecutive underscores
        .replace(/^_+|_+$/g, '');          // Trim leading/trailing _

      cb(null, `images/${timestamp}_${sanitizedName}`);
    }
  });

  console.log('📦 Multer configured to use S3 bucket:', process.env.AWS_S3_BUCKET_NAME);
} else {
  // --- Local disk fallback ---
  // Files will be stored in /tmp/uploads inside the container
  const tmpUploadDir = '/tmp/uploads';
  if (!fs.existsSync(tmpUploadDir)) {
    fs.mkdirSync(tmpUploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, tmpUploadDir);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now().toString();
      const ext = path.extname(file.originalname).toLowerCase();
      const basename = path.basename(file.originalname, ext);
      cb(null, `${timestamp}_${basename}${ext}`);
    }
  });

  console.warn('⚠️  AWS S3 environment variables are missing. Falling back to local disk storage.');
}

// File filter to check file types
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ALLOWED_FORMATS.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Only .jpg, .jpeg, .png, and .webp formats are allowed'));
};

// Multer instance with enhanced error messages
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },
});

// Export single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Export multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);