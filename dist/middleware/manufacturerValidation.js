"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateManufacturer = exports.validateCreateManufacturer = void 0;
const { body, validationResult } = require('express-validator');
// Validation rules for creating a manufacturer
exports.validateCreateManufacturer = [
    body('name')
        .notEmpty()
        .withMessage('Manufacturer name is required')
        .trim(),
    body('location')
        .notEmpty()
        .withMessage('Location is required')
        .trim(),
    body('establish')
        .notEmpty()
        .withMessage('Establishment year is required')
        .isInt({ min: 0, max: new Date().getFullYear() })
        .withMessage(`Establishment year must be between 0 and ${new Date().getFullYear()}`),
    body('industry')
        .notEmpty()
        .withMessage('Industry is required')
        .trim(),
    body('website')
        .notEmpty()
        .withMessage('Website is required')
        .isURL()
        .withMessage('Please provide a valid website URL')
        .trim(),
    // Optional fields validation
    body('certification')
        .optional()
        .isArray()
        .withMessage('Certification must be an array'),
    body('certification.*')
        .optional()
        .trim(),
    body('contact.email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email')
        .trim(),
    body('contact.phone')
        .optional()
        .trim(),
    body('image')
        .optional()
        .trim(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
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
// Validation rules for updating a manufacturer (similar to create but all fields optional)
exports.validateUpdateManufacturer = [
    body('name')
        .optional()
        .notEmpty()
        .withMessage('Manufacturer name cannot be empty')
        .trim(),
    body('location')
        .optional()
        .notEmpty()
        .withMessage('Location cannot be empty')
        .trim(),
    body('establish')
        .optional()
        .isInt({ min: 0, max: new Date().getFullYear() })
        .withMessage(`Establishment year must be between 0 and ${new Date().getFullYear()}`),
    body('industry')
        .optional()
        .notEmpty()
        .withMessage('Industry cannot be empty')
        .trim(),
    body('website')
        .optional()
        .notEmpty()
        .withMessage('Website cannot be empty')
        .isURL()
        .withMessage('Please provide a valid website URL')
        .trim(),
    body('certification')
        .optional()
        .isArray()
        .withMessage('Certification must be an array'),
    body('certification.*')
        .optional()
        .trim(),
    body('contact.email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email')
        .trim(),
    body('contact.phone')
        .optional()
        .trim(),
    body('image')
        .optional()
        .trim(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
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
