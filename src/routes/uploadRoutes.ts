import express from 'express';
import { uploadFile, getSignedImageUrl, uploadMultipleFiles } from '../controllers/uploadController';
import { upload } from '../config/multer';

const router = express.Router();

// Using any to bypass type issues
const uploadMiddleware: any = upload.single('image');
const uploadMultipleMiddleware: any = upload.array('images', 6); // Allow up to 6 images

/**
 * @route   POST /api/upload
 * @desc    Upload a single image and optionally associate it with a food product
 * @access  Public
 * @params  
 *  - image: File (required) - The image file to upload
 *  - foodProductId: String (optional) - ID of the food product to update with the image
 *  - isMainImage: Boolean (optional) - Whether this image should be the main product image
 */
router.post('/', uploadMiddleware, uploadFile);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple images (up to 6) and optionally associate them with a food product
 * @access  Public
 * @params  
 *  - images: Files (required) - Up to 6 image files to upload
 *  - foodProductId: String (optional) - ID of the food product to update with the images
 */
router.post('/multiple', uploadMultipleMiddleware, uploadMultipleFiles);

/**
 * @route   GET /api/upload/signed-url
 * @desc    Get a fresh signed URL for an existing S3 object
 * @access  Public
 * @params
 *  - key: String (required) - The S3 object key
 *  - expires: Number (optional) - Number of seconds until the URL expires (default: 3600)
 */
router.get('/signed-url', getSignedImageUrl);

export default router;