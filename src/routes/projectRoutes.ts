import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getProjectManufacturers,
  contactManufacturer,
  getProjectAnalytics
} from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// ==================== PROJECT CRUD OPERATIONS ====================

/**
 * @route   POST /api/projects
 * @desc    Create a new manufacturing project
 * @access  Private (Brand users only)
 */
router.post('/', createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for authenticated user with pagination and filtering
 * @access  Private
 * @query   status, page, limit, search
 */
router.get('/', getProjects);

/**
 * @route   GET /api/projects/analytics
 * @desc    Get project analytics for authenticated user
 * @access  Private
 */
router.get('/analytics', getProjectAnalytics);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Private (Project owner only)
 */
router.get('/:id', getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (Project owner only)
 */
router.put('/:id', updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Project owner only)
 */
router.delete('/:id', deleteProject);

// ==================== PROJECT STATUS MANAGEMENT ====================

/**
 * @route   PATCH /api/projects/:id/status
 * @desc    Update project status (draft, active, paused, completed, cancelled)
 * @access  Private (Project owner only)
 */
router.patch('/:id/status', updateProjectStatus);

// ==================== MANUFACTURER MATCHING & COMMUNICATION ====================

/**
 * @route   GET /api/projects/:id/manufacturers
 * @desc    Get matching manufacturers for a project
 * @access  Private (Project owner only)
 */
router.get('/:id/manufacturers', getProjectManufacturers);

/**
 * @route   POST /api/projects/:id/contact/:manufacturerId
 * @desc    Contact a manufacturer for a project
 * @access  Private (Project owner only)
 */
router.post('/:id/contact/:manufacturerId', contactManufacturer);

export default router;
