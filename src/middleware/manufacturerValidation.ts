import { Request, Response, NextFunction } from 'express';

const { body, validationResult } = require('express-validator');

// Validation rules for creating a manufacturer
export const validateCreateManufacturer = [
  body('name')
    .notEmpty()
    .withMessage('Manufacturer name is required')
    .trim(),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .trim(),
  body('contact.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .trim(),
  body('establish')
    .optional()
    .isInt({ min: 0, max: new Date().getFullYear() })
    .withMessage(`Establishment year must be between 0 and ${new Date().getFullYear()}`),
  // Optional fields validation
  body('industry').optional().trim(),
  body('certification').optional().trim(),
  body('contact.phone').optional().trim(),
  body('contact.website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('image').optional().trim(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  // Validate results
  (req: Request, res: Response, next: NextFunction) => {
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
export const validateUpdateManufacturer = [
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
  body('contact.email')
    .optional()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Please provide a valid email')
    .trim(),
  body('establish')
    .optional()
    .isInt({ min: 0, max: new Date().getFullYear() })
    .withMessage(`Establishment year must be between 0 and ${new Date().getFullYear()}`),
  body('industry').optional().trim(),
  body('certification').optional().trim(),
  body('contact.phone').optional().trim(),
  body('contact.website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('image').optional().trim(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  // Validate results
  (req: Request, res: Response, next: NextFunction) => {
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