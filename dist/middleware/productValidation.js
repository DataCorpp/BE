"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateProduct = exports.validateCreateProduct = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const { body, validationResult } = require('express-validator');
// Validation rules for creating a product
exports.validateCreateProduct = [
    body('name')
        .notEmpty()
        .withMessage('Product name is required')
        .trim(),
    body('productType')
        .notEmpty()
        .withMessage('Product type is required')
        .trim(),
    body('description')
        .notEmpty()
        .withMessage('Description is required')
        .trim(),
    body('manufacturer')
        .notEmpty()
        .withMessage('Manufacturer is required')
        .custom((value) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid manufacturer ID');
        }
        return true;
    }),
    body('minOrderQuantity')
        .notEmpty()
        .withMessage('Minimum order quantity is required')
        .isInt({ min: 1 })
        .withMessage('Minimum order quantity must be at least 1'),
    // Optional fields validation
    body('category')
        .optional()
        .trim(),
    body('originCountry')
        .optional()
        .trim(),
    body('price')
        .optional()
        .isNumeric()
        .withMessage('Price must be a valid number')
        .custom((value) => {
        if (value < 0) {
            throw new Error('Price cannot be negative');
        }
        return true;
    }),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code')
        .trim(),
    body('pricePerUnit')
        .optional()
        .isNumeric()
        .withMessage('Price per unit must be a valid number')
        .custom((value) => {
        if (value < 0) {
            throw new Error('Price per unit cannot be negative');
        }
        return true;
    }),
    body('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),
    body('reviewsCount')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reviews count cannot be negative'),
    body('leadTimeDetailed.average')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Lead time average cannot be negative'),
    body('leadTimeDetailed.max')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Lead time max cannot be negative'),
    body('leadTimeDetailed.unit')
        .optional()
        .isIn(['days', 'weeks', 'months'])
        .withMessage('Lead time unit must be days, weeks, or months'),
    body('sustainable')
        .optional()
        .isBoolean()
        .withMessage('Sustainable must be a boolean value'),
    body('status')
        .optional()
        .isIn(['available', 'discontinued', 'preorder'])
        .withMessage('Status must be available, discontinued, or preorder'),
    body('ingredients')
        .optional()
        .isArray()
        .withMessage('Ingredients must be an array'),
    body('ingredients.*')
        .optional()
        .trim(),
    body('allergens')
        .optional()
        .isArray()
        .withMessage('Allergens must be an array'),
    body('allergens.*')
        .optional()
        .trim(),
    body('flavorType')
        .optional()
        .isArray()
        .withMessage('Flavor type must be an array'),
    body('flavorType.*')
        .optional()
        .isIn(['salty', 'sweet', 'spicy', 'umami', 'sour', 'bitter', 'aromatic', 'mild', 'rich', 'complex', 'nutty', 'savory', 'creamy', 'tangy', 'citrus'])
        .withMessage('Invalid flavor type'),
    body('usage')
        .optional()
        .isArray()
        .withMessage('Usage must be an array'),
    body('usage.*')
        .optional()
        .trim(),
    body('unitType')
        .optional()
        .trim(),
    body('packagingSize')
        .optional()
        .trim(),
    body('shelfLife')
        .optional()
        .trim(),
    body('image')
        .optional()
        .trim(),
    // Validate results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }
        next();
    }
];
// Validation rules for updating a product (all fields optional)
exports.validateUpdateProduct = [
    body('name')
        .optional()
        .notEmpty()
        .withMessage('Product name cannot be empty')
        .trim(),
    body('productType')
        .optional()
        .notEmpty()
        .withMessage('Product type cannot be empty')
        .trim(),
    body('description')
        .optional()
        .notEmpty()
        .withMessage('Description cannot be empty')
        .trim(),
    body('manufacturer')
        .optional()
        .custom((value) => {
        if (value && !mongoose_1.default.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid manufacturer ID');
        }
        return true;
    }),
    body('minOrderQuantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Minimum order quantity must be at least 1'),
    body('category')
        .optional()
        .trim(),
    body('originCountry')
        .optional()
        .trim(),
    body('price')
        .optional()
        .isNumeric()
        .withMessage('Price must be a valid number')
        .custom((value) => {
        if (value < 0) {
            throw new Error('Price cannot be negative');
        }
        return true;
    }),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code')
        .trim(),
    body('pricePerUnit')
        .optional()
        .isNumeric()
        .withMessage('Price per unit must be a valid number')
        .custom((value) => {
        if (value < 0) {
            throw new Error('Price per unit cannot be negative');
        }
        return true;
    }),
    body('rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Rating must be between 0 and 5'),
    body('reviewsCount')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Reviews count cannot be negative'),
    body('leadTimeDetailed.average')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Lead time average cannot be negative'),
    body('leadTimeDetailed.max')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Lead time max cannot be negative'),
    body('leadTimeDetailed.unit')
        .optional()
        .isIn(['days', 'weeks', 'months'])
        .withMessage('Lead time unit must be days, weeks, or months'),
    body('sustainable')
        .optional()
        .isBoolean()
        .withMessage('Sustainable must be a boolean value'),
    body('status')
        .optional()
        .isIn(['available', 'discontinued', 'preorder'])
        .withMessage('Status must be available, discontinued, or preorder'),
    body('ingredients')
        .optional()
        .isArray()
        .withMessage('Ingredients must be an array'),
    body('ingredients.*')
        .optional()
        .trim(),
    body('allergens')
        .optional()
        .isArray()
        .withMessage('Allergens must be an array'),
    body('allergens.*')
        .optional()
        .trim(),
    body('flavorType')
        .optional()
        .isArray()
        .withMessage('Flavor type must be an array'),
    body('flavorType.*')
        .optional()
        .isIn(['salty', 'sweet', 'spicy', 'umami', 'sour', 'bitter', 'aromatic', 'mild', 'rich', 'complex', 'nutty', 'savory', 'creamy', 'tangy', 'citrus'])
        .withMessage('Invalid flavor type'),
    body('usage')
        .optional()
        .isArray()
        .withMessage('Usage must be an array'),
    body('usage.*')
        .optional()
        .trim(),
    body('unitType')
        .optional()
        .trim(),
    body('packagingSize')
        .optional()
        .trim(),
    body('shelfLife')
        .optional()
        .trim(),
    body('image')
        .optional()
        .trim(),
    // Validate results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }
        next();
    }
];
