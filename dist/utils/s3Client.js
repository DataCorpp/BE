"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKeyFromUrl = exports.deleteObjectFromS3 = exports.generateSignedUrl = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure S3 client
const s3Config = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
};
// Create S3 client instance
exports.s3Client = new client_s3_1.S3Client(s3Config);
// Function to get signed URL for an S3 object
const generateSignedUrl = (key_1, ...args_1) => __awaiter(void 0, [key_1, ...args_1], void 0, function* (key, expiresIn = 3600) {
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || '',
            Key: key
        });
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn });
        return url;
    }
    catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
});
exports.generateSignedUrl = generateSignedUrl;
/**
 * Delete an object from S3 bucket
 * @param key - The S3 object key to delete
 * @returns True if deletion was successful, false otherwise
 */
const deleteObjectFromS3 = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!key) {
            console.error('Cannot delete object: No key provided');
            return false;
        }
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || 'datacom-imgs',
            Key: key
        });
        yield exports.s3Client.send(command);
        console.log(`Successfully deleted object with key: ${key}`);
        return true;
    }
    catch (error) {
        console.error(`Error deleting object with key ${key}:`, error);
        return false;
    }
});
exports.deleteObjectFromS3 = deleteObjectFromS3;
/**
 * Extract S3 key from a full S3 URL
 * @param url - Full S3 URL
 * @returns The S3 object key or null if unable to extract
 */
const extractKeyFromUrl = (url) => {
    try {
        if (!url)
            return null;
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
    }
    catch (error) {
        console.error('Error extracting key from URL:', error);
        return null;
    }
};
exports.extractKeyFromUrl = extractKeyFromUrl;
