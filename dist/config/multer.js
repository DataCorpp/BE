"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.uploadSingle = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const s3Client_1 = require("../utils/s3Client");
// File size limit (10MB) – larger to accommodate high-resolution images
const FILE_SIZE_LIMIT = 10 * 1024 * 1024;
// Allowed file formats
const ALLOWED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];
// ----------------------------
// Storage configuration
// ----------------------------
// 1) S3 (production)
// 2) Local disk (development / when AWS env is missing)
let storage;
if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    // --- S3 storage ---
    storage = (0, multer_s3_1.default)({
        s3: s3Client_1.s3Client,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const timestamp = Date.now().toString();
            const rawName = file.originalname;
            // Normalize and remove unsafe characters to ensure S3 key is URL-safe.
            const sanitizedName = rawName
                .normalize('NFKD') // Decompose accents
                .replace(/[^\w.\-]+/g, '_') // Replace non-word/unapproved chars with _
                .replace(/_+/g, '_') // Collapse consecutive underscores
                .replace(/^_+|_+$/g, ''); // Trim leading/trailing _
            cb(null, `images/${timestamp}_${sanitizedName}`);
        }
    });
    console.log('📦 Multer configured to use S3 bucket:', process.env.AWS_S3_BUCKET_NAME);
}
else {
    // --- Local disk fallback ---
    // Files will be stored in /tmp/uploads inside the container
    const tmpUploadDir = '/tmp/uploads';
    if (!fs_1.default.existsSync(tmpUploadDir)) {
        fs_1.default.mkdirSync(tmpUploadDir, { recursive: true });
    }
    storage = multer_1.default.diskStorage({
        destination: function (req, file, cb) {
            cb(null, tmpUploadDir);
        },
        filename: function (req, file, cb) {
            const timestamp = Date.now().toString();
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const basename = path_1.default.basename(file.originalname, ext);
            cb(null, `${timestamp}_${basename}${ext}`);
        }
    });
    console.warn('⚠️  AWS S3 environment variables are missing. Falling back to local disk storage.');
}
// File filter to check file types
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (ALLOWED_FORMATS.includes(ext)) {
        return cb(null, true);
    }
    cb(new Error('Only .jpg, .jpeg, .png, and .webp formats are allowed'));
};
// Multer instance with enhanced error messages
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: FILE_SIZE_LIMIT,
    },
});
// Export single file upload middleware
const uploadSingle = (fieldName) => exports.upload.single(fieldName);
exports.uploadSingle = uploadSingle;
// Export multiple files upload middleware
const uploadMultiple = (fieldName, maxCount) => exports.upload.array(fieldName, maxCount);
exports.uploadMultiple = uploadMultiple;
