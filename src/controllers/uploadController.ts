import { Request, Response } from 'express';
import FoodProduct from '../models/FoodProduct';
import mongoose from 'mongoose';
import { generateSignedUrl, extractKeyFromUrl } from '../utils/s3Client';

/**
 * Upload a single file to S3 and return the signed URL
 * @route POST /api/upload
 * @access Public
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file as any;
    // If using S3 storage, multer-s3 provides `key` and `location`.
    // If using disk storage, fallback to `filename` and build a pseudo key.
    const fileKey: string | undefined = file.key || file.filename;
    
    // Attempt to generate a signed URL that expires in 1 hour (3600 seconds)
    // If this fails (e.g., due to missing AWS permissions), we will still return
    // a successful response containing the fileUrl so that the front-end can
    // continue working.
    let signedUrl: string | null = null;
    if (fileKey) {
      try {
        signedUrl = await generateSignedUrl(fileKey, 3600);
      } catch (signErr) {
        console.error('Failed to generate signed URL:', signErr);
        // Continue without signedUrl; front-end can decide how to handle
      }
    }
    
    // Store original S3 location for database purposes
    const fileLocation = file.location;
    
    // Check if the request has a foodProductId to update
    const { foodProductId, isMainImage } = req.body;
    
    // If foodProductId is provided, update the FoodProduct with the new image URL
    if (foodProductId && mongoose.Types.ObjectId.isValid(foodProductId)) {
      try {
        const foodProduct = await FoodProduct.findById(foodProductId);
        
        if (!foodProduct) {
          return res.status(404).json({ 
            message: 'Food product not found',
            fileUrl: fileLocation,
            signedUrl,
            key: fileKey,
            uploaded: true,
            savedToDb: false
          });
        }
        
        // Initialize images array if it doesn't exist
        if (!foodProduct.images) {
          foodProduct.images = [];
        }
        
        // We store the original S3 URL in the database, not the signed URL
        // Add the new image according to isMainImage parameter
        if (isMainImage === 'true' || isMainImage === true) {
          // Make this image the main one by placing it at the beginning of the array
          foodProduct.images = [fileLocation, ...foodProduct.images.filter(img => img !== fileLocation)];
        } else {
          // Add to the end of the images array if not already included
          if (!foodProduct.images.includes(fileLocation)) {
            foodProduct.images.push(fileLocation);
          }
        }
        
        // The model's pre-save middleware will sync image field with images[0]
        await foodProduct.save();
        
        return res.status(200).json({
          message: 'File uploaded and saved to food product successfully',
          fileUrl: fileLocation,
          signedUrl,
          key: fileKey,
          expiresIn: 3600,
          foodProductId: foodProduct._id,
          images: foodProduct.images,
          mainImage: foodProduct.images[0],
          uploaded: true,
          savedToDb: true
        });
      } catch (dbError) {
        console.error('Error updating food product:', dbError);
        return res.status(200).json({
          message: 'File uploaded but failed to update food product',
          fileUrl: fileLocation,
          signedUrl,
          key: fileKey,
          expiresIn: 3600,
          error: dbError instanceof Error ? dbError.message : 'Database error',
          uploaded: true,
          savedToDb: false
        });
      }
    }

    // If no foodProductId provided or update failed, just return the file URL
    return res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: fileLocation, // Original S3 URL (for database storage)
      signedUrl, // Signed URL for client access (may be null if generation failed)
      key: fileKey, // S3 object key for generating future signed URLs
      expiresIn: 3600,
      mimetype: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      uploaded: true,
      savedToDb: false
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error uploading file',
      error: error instanceof Error ? error.message : 'Unknown error',
      uploaded: false,
      savedToDb: false
    });
  }
};

/**
 * Generate a new signed URL for an existing S3 object
 * @route GET /api/upload/signed-url
 * @access Public
 */
export const getSignedImageUrl = async (req: Request, res: Response) => {
  try {
    const { key, url, expires } = req.query;
    
    // Get the object key, either directly or by extracting it from a URL
    let objectKey: string;
    
    if (key && typeof key === 'string') {
      // Use the key directly if provided
      objectKey = key;
    } else if (url && typeof url === 'string') {
      // Extract key from the URL if provided
      objectKey = extractKeyFromUrl(url);
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Either key or url parameter is required'
      });
    }
    
    // Get expiration time, default to 1 hour (3600 seconds)
    const expirationTime = expires && !isNaN(Number(expires)) 
      ? Number(expires) 
      : 3600;
    
    // Generate a new signed URL
    const signedUrl = await generateSignedUrl(objectKey, expirationTime);
    
    // Return the signed URL and metadata
    return res.status(200).json({
      success: true,
      signedUrl,
      key: objectKey,
      expiresIn: expirationTime
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating signed URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Upload multiple files to S3 and return signed URLs
 * @route POST /api/upload/multiple
 * @access Public
 */
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files as any[];
    const { foodProductId } = req.body;
    
    // Generate signed URLs for each file
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const fileKey: string | undefined = file.key || file.filename;
        const fileLocation = file.location;
        let signedUrl: string | null = null;
        if (fileKey) {
          try {
            signedUrl = await generateSignedUrl(fileKey, 3600);
          } catch (err) {
            console.error('Failed to generate signed URL (multiple):', err);
          }
        }
        
        return {
          fileUrl: fileLocation,
          signedUrl,
          key: fileKey,
          expiresIn: 3600,
          mimetype: file.mimetype,
          size: file.size,
          originalName: file.originalname
        };
      })
    );
    
    // If foodProductId is provided, update the FoodProduct with the new image URLs
    if (foodProductId && mongoose.Types.ObjectId.isValid(foodProductId)) {
      try {
        const foodProduct = await FoodProduct.findById(foodProductId);
        
        if (!foodProduct) {
          return res.status(404).json({ 
            message: 'Food product not found',
            files: uploadResults,
            uploaded: true,
            savedToDb: false
          });
        }
        
        // Initialize images array if it doesn't exist
        if (!foodProduct.images) {
          foodProduct.images = [];
        }
        
        // Get original file locations for database storage
        const fileLocations = uploadResults.map(result => result.fileUrl);
        
        // Add all new images to the product's images array
        // Filter out any duplicates
        foodProduct.images = [
          ...foodProduct.images,
          ...fileLocations.filter(url => !foodProduct.images.includes(url))
        ];
        
        // If the product doesn't have a main image, set the first uploaded image as main
        if (!foodProduct.image && fileLocations.length > 0) {
          foodProduct.image = fileLocations[0];
        }
        
        // Save the updated product
        await foodProduct.save();
        
        return res.status(200).json({
          message: 'Files uploaded and saved to food product successfully',
          files: uploadResults,
          foodProductId: foodProduct._id,
          images: foodProduct.images,
          mainImage: foodProduct.image,
          uploaded: true,
          savedToDb: true
        });
      } catch (dbError) {
        console.error('Error updating food product:', dbError);
        return res.status(200).json({
          message: 'Files uploaded but failed to update food product',
          files: uploadResults,
          error: dbError instanceof Error ? dbError.message : 'Database error',
          uploaded: true,
          savedToDb: false
        });
      }
    }

    // If no foodProductId provided or update failed, just return the file information
    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: uploadResults,
      uploaded: true,
      savedToDb: false
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error uploading files',
      error: error instanceof Error ? error.message : 'Unknown error',
      uploaded: false,
      savedToDb: false
    });
  }
};
