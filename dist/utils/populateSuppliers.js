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
exports.populateSuppliers = void 0;
const PackagingSupplier_1 = __importDefault(require("../models/PackagingSupplier"));
const IngredientSupplier_1 = __importDefault(require("../models/IngredientSupplier"));
const SecondaryPackager_1 = __importDefault(require("../models/SecondaryPackager"));
const PackagingService_1 = __importDefault(require("../models/PackagingService"));
// Sample data
const sampleData = {
    packagingSuppliers: [
        {
            companyName: "EcoPackaging Solutions",
            contactName: "John Smith",
            email: "john@ecopackaging.com",
            phone: "+1-555-0101",
            website: "https://ecopackaging.com",
            address: "123 Green Street, San Francisco, CA 94105",
            description: "Leading provider of sustainable packaging solutions for food and beverage industry",
            packagingTypes: ["biodegradable", "paper", "composite"],
            materialTypes: ["eco-friendly", "flexible", "barrier"],
            capabilities: ["printing", "custom_shapes", "multi_layer"],
            certifications: ["FSC", "recyclable", "compostable"],
            minimumOrderQuantity: 5000,
            leadTime: "3-4 weeks",
            priceRange: "medium",
            establish: 2010,
            servingRegions: ["North America", "Europe"],
            productionCapacity: "large"
        }
    ],
    ingredientSuppliers: [
        {
            companyName: "Global Spice Trading",
            contactName: "Maria Rodriguez",
            email: "maria@globalspice.com",
            phone: "+1-555-0201",
            website: "https://globalspice.com",
            address: "789 Spice Market, New York, NY 10013",
            description: "Premium spice and seasoning supplier with global sourcing network",
            ingredientCategories: ["spices", "flavors", "colors"],
            ingredientTypes: ["organic", "natural", "gmo_free"],
            specialties: ["allergen_free", "kosher", "halal"],
            certifications: ["organic", "fair_trade", "kosher"],
            originCountries: ["India", "Sri Lanka", "Turkey", "Mexico"],
            shelfLife: "2 years",
            storageRequirements: ["dry", "room_temperature"],
            minimumOrderQuantity: 500,
            leadTime: "1-2 months",
            priceRange: "premium",
            establish: 1988,
            servingRegions: ["Global"],
            productionCapacity: "large"
        }
    ]
};
const populateSuppliers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🚀 Starting to populate suppliers...");
        // Clear existing data
        console.log("🧹 Clearing existing supplier data...");
        yield PackagingSupplier_1.default.deleteMany({});
        yield IngredientSupplier_1.default.deleteMany({});
        yield SecondaryPackager_1.default.deleteMany({});
        yield PackagingService_1.default.deleteMany({});
        // Insert packaging suppliers
        console.log("📦 Inserting packaging suppliers...");
        const packagingSuppliers = yield PackagingSupplier_1.default.insertMany(sampleData.packagingSuppliers);
        console.log(`✅ Created ${packagingSuppliers.length} packaging suppliers`);
        // Insert ingredient suppliers
        console.log("🌿 Inserting ingredient suppliers...");
        const ingredientSuppliers = yield IngredientSupplier_1.default.insertMany(sampleData.ingredientSuppliers);
        console.log(`✅ Created ${ingredientSuppliers.length} ingredient suppliers`);
        console.log("🎉 Successfully populated supplier data!");
    }
    catch (error) {
        console.error("❌ Error populating suppliers:", error);
        throw error;
    }
});
exports.populateSuppliers = populateSuppliers;
