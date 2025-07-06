"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(authMiddleware_1.protect);
// ==================== PROJECT CRUD OPERATIONS ====================
/**
 * @route   POST /api/projects
 * @desc    Create a new manufacturing project
 * @access  Private (Brand users only)
 */
router.post('/', projectController_1.createProject);
/**
 * @route   GET /api/projects
 * @desc    Get all projects for authenticated user with pagination and filtering
 * @access  Private
 * @query   status, page, limit, search
 */
router.get('/', projectController_1.getProjects);
/**
 * @route   GET /api/projects/analytics
 * @desc    Get project analytics for authenticated user
 * @access  Private
 */
router.get('/analytics', projectController_1.getProjectAnalytics);
/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Private (Project owner only)
 */
router.get('/:id', projectController_1.getProjectById);
/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (Project owner only)
 */
router.put('/:id', projectController_1.updateProject);
/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Project owner only)
 */
router.delete('/:id', projectController_1.deleteProject);
// ==================== PROJECT STATUS MANAGEMENT ====================
/**
 * @route   PATCH /api/projects/:id/status
 * @desc    Update project status (draft, active, paused, completed, cancelled)
 * @access  Private (Project owner only)
 */
router.patch('/:id/status', projectController_1.updateProjectStatus);
// ==================== MANUFACTURER MATCHING & COMMUNICATION ====================
/**
 * @route   GET /api/projects/:id/manufacturers
 * @desc    Get matching manufacturers for a project
 * @access  Private (Project owner only)
 */
router.get('/:id/manufacturers', projectController_1.getProjectManufacturers);
/**
 * @route   POST /api/projects/:id/contact/:manufacturerId
 * @desc    Contact a manufacturer for a project
 * @access  Private (Project owner only)
 */
router.post('/:id/contact/:manufacturerId', projectController_1.contactManufacturer);
exports.default = router;
