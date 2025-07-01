import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { s3Client } from '../utils/s3Client';

// File size limit (5MB)
const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

// Allowed file formats
const ALLOWED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

// S3 Storage configuration
const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const timestamp = Date.now().toString();
    const filename = file.originalname;
    cb(null, `images/${timestamp}_${filename}`);
  }
});

// File filter to check file types
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ALLOWED_FORMATS.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Only .jpg, .jpeg, .png, and .webp formats are allowed'));
};

// Configure multer
export const upload = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT
  }
});

// Export single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Export multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);