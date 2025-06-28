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
exports.getSupplierFilters = exports.getSupplierById = exports.getPackagingServices = exports.getSecondaryPackagers = exports.getIngredientSuppliers = exports.getPackagingSuppliers = void 0;
const PackagingSupplier_1 = __importDefault(require("../models/PackagingSupplier"));
const IngredientSupplier_1 = __importDefault(require("../models/IngredientSupplier"));
const SecondaryPackager_1 = __importDefault(require("../models/SecondaryPackager"));
const PackagingService_1 = __importDefault(require("../models/PackagingService"));
// Generic function to handle pagination and filtering
const buildSupplierFilter = (req, baseFilter = {}) => {
    const filter = Object.assign({}, baseFilter);
    // Basic search across name and description
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
            { companyName: searchRegex },
            { contactName: searchRegex },
            { description: searchRegex },
            { industry: searchRegex }
        ];
    }
    // Location filter
    if (req.query.location) {
        filter.address = new RegExp(req.query.location, 'i');
    }
    // Establish year filtering
    if (req.query.establish_gte) {
        filter.establish = Object.assign(Object.assign({}, filter.establish), { $gte: parseInt(req.query.establish_gte) });
    }
    if (req.query.establish_lte) {
        filter.establish = Object.assign(Object.assign({}, filter.establish), { $lte: parseInt(req.query.establish_lte) });
    }
    // Status filter
    if (req.query.status) {
        filter.status = req.query.status;
    }
    else {
        // Default to active suppliers only
        filter.status = { $in: ["active"] };
    }
    return filter;
};
const getPaginatedSuppliers = (Model_1, req_1, res_1, ...args_1) => __awaiter(void 0, [Model_1, req_1, res_1, ...args_1], void 0, function* (Model, req, res, baseFilter = {}) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const filter = buildSupplierFilter(req, baseFilter);
        // Get total count for pagination
        const total = yield Model.countDocuments(filter);
        // Get suppliers with pagination
        const suppliers = yield Model.find(filter)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for better performance
        console.log(`[SERVER] Fetched ${suppliers.length} suppliers from ${Model.modelName}`);
        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        res.json({
            success: true,
            suppliers,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage,
                hasPrevPage
            },
            total // Keep this for backward compatibility
        });
    }
    catch (error) {
        console.error(`Error in get${Model.modelName}:`, error);
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "Unknown error occurred"
            });
        }
    }
});
// @desc    Get all packaging suppliers
// @route   GET /api/suppliers/packaging
// @access  Public
const getPackagingSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const baseFilter = {};
    // Packaging-specific filters
    if (req.query.packagingTypes) {
        const types = Array.isArray(req.query.packagingTypes)
            ? req.query.packagingTypes
            : [req.query.packagingTypes];
        baseFilter.packagingTypes = { $in: types };
    }
    if (req.query.materialTypes) {
        const materials = Array.isArray(req.query.materialTypes)
            ? req.query.materialTypes
            : [req.query.materialTypes];
        baseFilter.materialTypes = { $in: materials };
    }
    if (req.query.certifications) {
        const certs = Array.isArray(req.query.certifications)
            ? req.query.certifications
            : [req.query.certifications];
        baseFilter.certifications = { $in: certs };
    }
    if (req.query.priceRange) {
        baseFilter.priceRange = req.query.priceRange;
    }
    if (req.query.leadTime) {
        baseFilter.leadTime = req.query.leadTime;
    }
    yield getPaginatedSuppliers(PackagingSupplier_1.default, req, res, baseFilter);
});
exports.getPackagingSuppliers = getPackagingSuppliers;
// @desc    Get all ingredient suppliers
// @route   GET /api/suppliers/ingredients
// @access  Public
const getIngredientSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const baseFilter = {};
    // Ingredient-specific filters
    if (req.query.ingredientCategories) {
        const categories = Array.isArray(req.query.ingredientCategories)
            ? req.query.ingredientCategories
            : [req.query.ingredientCategories];
        baseFilter.ingredientCategories = { $in: categories };
    }
    if (req.query.ingredientTypes) {
        const types = Array.isArray(req.query.ingredientTypes)
            ? req.query.ingredientTypes
            : [req.query.ingredientTypes];
        baseFilter.ingredientTypes = { $in: types };
    }
    if (req.query.specialties) {
        const specialties = Array.isArray(req.query.specialties)
            ? req.query.specialties
            : [req.query.specialties];
        baseFilter.specialties = { $in: specialties };
    }
    if (req.query.certifications) {
        const certs = Array.isArray(req.query.certifications)
            ? req.query.certifications
            : [req.query.certifications];
        baseFilter.certifications = { $in: certs };
    }
    if (req.query.originCountries) {
        const countries = Array.isArray(req.query.originCountries)
            ? req.query.originCountries
            : [req.query.originCountries];
        baseFilter.originCountries = { $in: countries };
    }
    if (req.query.shelfLife) {
        baseFilter.shelfLife = req.query.shelfLife;
    }
    yield getPaginatedSuppliers(IngredientSupplier_1.default, req, res, baseFilter);
});
exports.getIngredientSuppliers = getIngredientSuppliers;
// @desc    Get all secondary packagers
// @route   GET /api/suppliers/secondary-packagers
// @access  Public
const getSecondaryPackagers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const baseFilter = {};
    // Secondary packager-specific filters
    if (req.query.packagingServices) {
        const services = Array.isArray(req.query.packagingServices)
            ? req.query.packagingServices
            : [req.query.packagingServices];
        baseFilter.packagingServices = { $in: services };
    }
    if (req.query.equipmentTypes) {
        const equipment = Array.isArray(req.query.equipmentTypes)
            ? req.query.equipmentTypes
            : [req.query.equipmentTypes];
        baseFilter.equipmentTypes = { $in: equipment };
    }
    if (req.query.packagingFormats) {
        const formats = Array.isArray(req.query.packagingFormats)
            ? req.query.packagingFormats
            : [req.query.packagingFormats];
        baseFilter.packagingFormats = { $in: formats };
    }
    if (req.query.storageCapability) {
        baseFilter.storageCapability = req.query.storageCapability === 'true';
    }
    if (req.query.temperatureControlled) {
        baseFilter.temperatureControlled = req.query.temperatureControlled === 'true';
    }
    yield getPaginatedSuppliers(SecondaryPackager_1.default, req, res, baseFilter);
});
exports.getSecondaryPackagers = getSecondaryPackagers;
// @desc    Get all packaging services
// @route   GET /api/suppliers/packaging-services
// @access  Public
const getPackagingServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const baseFilter = {};
    // Packaging service-specific filters
    if (req.query.serviceTypes) {
        const services = Array.isArray(req.query.serviceTypes)
            ? req.query.serviceTypes
            : [req.query.serviceTypes];
        baseFilter.serviceTypes = { $in: services };
    }
    if (req.query.industryExpertise) {
        const expertise = Array.isArray(req.query.industryExpertise)
            ? req.query.industryExpertise
            : [req.query.industryExpertise];
        baseFilter.industryExpertise = { $in: expertise };
    }
    if (req.query.certifications) {
        const certs = Array.isArray(req.query.certifications)
            ? req.query.certifications
            : [req.query.certifications];
        baseFilter.certifications = { $in: certs };
    }
    if (req.query.projectSizes) {
        const sizes = Array.isArray(req.query.projectSizes)
            ? req.query.projectSizes
            : [req.query.projectSizes];
        baseFilter.projectSizes = { $in: sizes };
    }
    if (req.query.priceStructure) {
        baseFilter.priceStructure = req.query.priceStructure;
    }
    // Price range filters
    if (req.query.minHourlyRate) {
        baseFilter.hourlyRate = Object.assign(Object.assign({}, baseFilter.hourlyRate), { $gte: parseInt(req.query.minHourlyRate) });
    }
    if (req.query.maxHourlyRate) {
        baseFilter.hourlyRate = Object.assign(Object.assign({}, baseFilter.hourlyRate), { $lte: parseInt(req.query.maxHourlyRate) });
    }
    yield getPaginatedSuppliers(PackagingService_1.default, req, res, baseFilter);
});
exports.getPackagingServices = getPackagingServices;
// @desc    Get supplier by ID (any type)
// @route   GET /api/suppliers/:type/:id
// @access  Public
const getSupplierById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, id } = req.params;
        let supplier;
        switch (type) {
            case 'packaging':
                supplier = yield PackagingSupplier_1.default.findById(id);
                break;
            case 'ingredients':
                supplier = yield IngredientSupplier_1.default.findById(id);
                break;
            case 'secondary-packagers':
                supplier = yield SecondaryPackager_1.default.findById(id);
                break;
            case 'packaging-services':
                supplier = yield PackagingService_1.default.findById(id);
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid supplier type"
                });
                return;
        }
        if (!supplier) {
            res.status(404).json({
                success: false,
                message: "Supplier not found"
            });
            return;
        }
        res.json({
            success: true,
            supplier
        });
    }
    catch (error) {
        console.error('Error in getSupplierById:', error);
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "Unknown error occurred"
            });
        }
    }
});
exports.getSupplierById = getSupplierById;
// @desc    Get filter options for all supplier types
// @route   GET /api/suppliers/filters/:type
// @access  Public
const getSupplierFilters = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        let filters = {};
        switch (type) {
            case 'packaging':
                filters = {
                    packagingTypes: yield PackagingSupplier_1.default.distinct('packagingTypes'),
                    materialTypes: yield PackagingSupplier_1.default.distinct('materialTypes'),
                    certifications: yield PackagingSupplier_1.default.distinct('certifications'),
                    priceRanges: yield PackagingSupplier_1.default.distinct('priceRange'),
                    leadTimes: yield PackagingSupplier_1.default.distinct('leadTime'),
                    servingRegions: yield PackagingSupplier_1.default.distinct('servingRegions')
                };
                break;
            case 'ingredients':
                filters = {
                    ingredientCategories: yield IngredientSupplier_1.default.distinct('ingredientCategories'),
                    ingredientTypes: yield IngredientSupplier_1.default.distinct('ingredientTypes'),
                    specialties: yield IngredientSupplier_1.default.distinct('specialties'),
                    certifications: yield IngredientSupplier_1.default.distinct('certifications'),
                    originCountries: yield IngredientSupplier_1.default.distinct('originCountries'),
                    shelfLifeOptions: yield IngredientSupplier_1.default.distinct('shelfLife'),
                    servingRegions: yield IngredientSupplier_1.default.distinct('servingRegions')
                };
                break;
            case 'secondary-packagers':
                filters = {
                    packagingServices: yield SecondaryPackager_1.default.distinct('packagingServices'),
                    equipmentTypes: yield SecondaryPackager_1.default.distinct('equipmentTypes'),
                    packagingFormats: yield SecondaryPackager_1.default.distinct('packagingFormats'),
                    certifications: yield SecondaryPackager_1.default.distinct('certifications'),
                    servingRegions: yield SecondaryPackager_1.default.distinct('servingRegions')
                };
                break;
            case 'packaging-services':
                filters = {
                    serviceTypes: yield PackagingService_1.default.distinct('serviceTypes'),
                    industryExpertise: yield PackagingService_1.default.distinct('industryExpertise'),
                    certifications: yield PackagingService_1.default.distinct('certifications'),
                    projectSizes: yield PackagingService_1.default.distinct('projectSizes'),
                    priceStructures: yield PackagingService_1.default.distinct('priceStructure'),
                    servingRegions: yield PackagingService_1.default.distinct('servingRegions')
                };
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Invalid supplier type"
                });
                return;
        }
        res.json({
            success: true,
            filters
        });
    }
    catch (error) {
        console.error('Error in getSupplierFilters:', error);
        if (error instanceof Error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: "Unknown error occurred"
            });
        }
    }
});
exports.getSupplierFilters = getSupplierFilters;
