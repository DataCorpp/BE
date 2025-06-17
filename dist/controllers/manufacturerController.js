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
exports.getLocations = exports.getIndustries = exports.deleteManufacturer = exports.updateManufacturer = exports.createManufacturer = exports.getManufacturerById = exports.getAllManufacturers = void 0;
const Manufacturer_1 = __importDefault(require("../models/Manufacturer"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get all manufacturers with filtering and pagination
// @route   GET /api/manufacturers
// @access  Public
const getAllManufacturers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { industry, location, establish_gte, establish_lte, search, page = 1, limit = 10 } = req.query;
        // Build query
        const query = {};
        // Filter by industry
        if (industry) {
            query.industry = { $regex: industry, $options: 'i' };
        }
        // Filter by location
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        // Filter by establishment year range
        if (establish_gte || establish_lte) {
            query.establish = {};
            if (establish_gte)
                query.establish.$gte = Number(establish_gte);
            if (establish_lte)
                query.establish.$lte = Number(establish_lte);
        }
        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        // Pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        // Execute query with pagination
        const totalCount = yield Manufacturer_1.default.countDocuments(query);
        const manufacturers = yield Manufacturer_1.default.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);
        res.json({
            success: true,
            manufacturers,
            page: pageNum,
            pages: Math.ceil(totalCount / limitNum),
            total: totalCount
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getAllManufacturers = getAllManufacturers;
// @desc    Get manufacturer by ID
// @route   GET /api/manufacturers/:id
// @access  Public
const getManufacturerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        const manufacturer = yield Manufacturer_1.default.findById(id);
        if (!manufacturer) {
            res.status(404).json({ success: false, message: "Manufacturer not found" });
            return;
        }
        res.json({ success: true, data: manufacturer });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getManufacturerById = getManufacturerById;
// @desc    Create new manufacturer
// @route   POST /api/manufacturers
// @access  Private
const createManufacturer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validation is handled by middleware so we can directly create
        const manufacturer = new Manufacturer_1.default(req.body);
        const createdManufacturer = yield manufacturer.save();
        res.status(201).json({
            success: true,
            message: "Manufacturer created successfully",
            data: createdManufacturer
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.createManufacturer = createManufacturer;
// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private
const updateManufacturer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        const manufacturer = yield Manufacturer_1.default.findById(id);
        if (!manufacturer) {
            res.status(404).json({ success: false, message: "Manufacturer not found" });
            return;
        }
        // Update all fields from request body
        Object.assign(manufacturer, req.body);
        const updatedManufacturer = yield manufacturer.save();
        res.json({
            success: true,
            message: "Manufacturer updated successfully",
            data: updatedManufacturer
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ success: false, message: error.message });
        }
        else {
            res.status(400).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.updateManufacturer = updateManufacturer;
// @desc    Delete manufacturer
// @route   DELETE /api/manufacturers/:id
// @access  Private
const deleteManufacturer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
            return;
        }
        const manufacturer = yield Manufacturer_1.default.findById(id);
        if (!manufacturer) {
            res.status(404).json({ success: false, message: "Manufacturer not found" });
            return;
        }
        yield Manufacturer_1.default.deleteOne({ _id: id });
        res.json({
            success: true,
            message: "Manufacturer deleted successfully"
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.deleteManufacturer = deleteManufacturer;
// @desc    Get distinct industries
// @route   GET /api/manufacturers/industries
// @access  Public
const getIndustries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const industries = yield Manufacturer_1.default.distinct("industry");
        res.json({
            success: true,
            data: industries.filter(industry => industry) // Filter out empty/null values
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getIndustries = getIndustries;
// @desc    Get distinct locations
// @route   GET /api/manufacturers/locations
// @access  Public
const getLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield Manufacturer_1.default.distinct("location");
        res.json({
            success: true,
            data: locations.filter(location => location) // Filter out empty/null values
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ success: false, message: error.message });
        }
        else {
            res.status(500).json({ success: false, message: "Unknown error occurred" });
        }
    }
});
exports.getLocations = getLocations;
