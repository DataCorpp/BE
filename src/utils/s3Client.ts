import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Configure S3 client
const s3Config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
};

// Create S3 client instance
export const s3Client = new S3Client(s3Config);

// Function to get signed URL for an S3 object
export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'datacom-uploads',
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Delete an object from S3 bucket
 * @param key - The S3 object key to delete
 * @returns True if deletion was successful, false otherwise
 */
export const deleteObjectFromS3 = async (key: string): Promise<boolean> => {
  try {
    if (!key) {
      console.error('Cannot delete object: No key provided');
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'datacom-uploads',
      Key: key
    });

    await s3Client.send(command);
    console.log(`Successfully deleted object with key: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error deleting object with key ${key}:`, error);
    return false;
  }
};

/**
 * Extract S3 key from a full S3 URL
 * @param url - Full S3 URL
 * @returns The S3 object key or null if unable to extract
 */
export const extractKeyFromUrl = (url: string): string | null => {
  try {
    if (!url) return null;

    // Check if the URL is a relative path (just a key)
    if (!url.includes('http') && !url.includes('amazonaws.com')) {
      return url;
    }
    
    // Try to parse the URL to extract the key
    const urlObj = new URL(url);
    
    // The path without leading slash is the key
    const path = urlObj.pathname;
    if (path.startsWith('/')) {
      // Remove the bucket name if it appears in the path
      const pathParts = path.split('/').filter(Boolean);
      const bucketName = process.env.AWS_S3_BUCKET_NAME || 'datacom-uploads';
      
      if (pathParts[0] === bucketName) {
        // Remove the bucket name from the path
        return pathParts.slice(1).join('/');
      }
      
      return pathParts.join('/');
    }
    
    return path;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};