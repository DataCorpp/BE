import { Request, Response } from "express";
import Manufacturer from "../models/Manufacturer";
import mongoose from "mongoose";

// @desc    Get all manufacturers with filtering and pagination
// @route   GET /api/manufacturers
// @access  Public
export const getAllManufacturers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      industry,
      location,
      establish_gte,
      establish_lte,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: any = {};

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
      if (establish_gte) query.establish.$gte = Number(establish_gte);
      if (establish_lte) query.establish.$lte = Number(establish_lte);
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
    const totalCount = await Manufacturer.countDocuments(query);
    const manufacturers = await Manufacturer.find(query)
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
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Get manufacturer by ID
// @route   GET /api/manufacturers/:id
// @access  Public
export const getManufacturerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
      return;
    }

    const manufacturer = await Manufacturer.findById(id);

    if (!manufacturer) {
      res.status(404).json({ success: false, message: "Manufacturer not found" });
      return;
    }

    res.json({ success: true, data: manufacturer });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Create new manufacturer
// @route   POST /api/manufacturers
// @access  Private
export const createManufacturer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validation is handled by middleware so we can directly create
    const manufacturer = new Manufacturer(req.body);
    const createdManufacturer = await manufacturer.save();

    res.status(201).json({
      success: true,
      message: "Manufacturer created successfully",
      data: createdManufacturer
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(400).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private
export const updateManufacturer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
      return;
    }

    const manufacturer = await Manufacturer.findById(id);

    if (!manufacturer) {
      res.status(404).json({ success: false, message: "Manufacturer not found" });
      return;
    }

    // Update all fields from request body
    Object.assign(manufacturer, req.body);
    
    const updatedManufacturer = await manufacturer.save();

    res.json({
      success: true,
      message: "Manufacturer updated successfully",
      data: updatedManufacturer
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(400).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Delete manufacturer
// @route   DELETE /api/manufacturers/:id
// @access  Private
export const deleteManufacturer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid manufacturer ID" });
      return;
    }

    const manufacturer = await Manufacturer.findById(id);

    if (!manufacturer) {
      res.status(404).json({ success: false, message: "Manufacturer not found" });
      return;
    }

    await Manufacturer.deleteOne({ _id: id });

    res.json({
      success: true,
      message: "Manufacturer deleted successfully"
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Get distinct industries
// @route   GET /api/manufacturers/industries
// @access  Public
export const getIndustries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const industries = await Manufacturer.distinct("industry");
    
    res.json({
      success: true,
      data: industries.filter(industry => industry) // Filter out empty/null values
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
};

// @desc    Get distinct locations
// @route   GET /api/manufacturers/locations
// @access  Public
export const getLocations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const locations = await Manufacturer.distinct("location");
    
    res.json({
      success: true,
      data: locations.filter(location => location) // Filter out empty/null values
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Unknown error occurred" });
    }
  }
}; 