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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
// Define schemas matching the new structure
const ManufacturerSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    establish: { type: Number, required: true },
    industry: { type: String, required: true },
    certification: [{ type: String }],
    contact: {
        email: { type: String },
        phone: { type: String }
    },
    website: { type: String, required: true },
    image: String,
    description: String
}, { timestamps: true });
const ProductSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    category: String,
    originCountry: String,
    manufacturer: {
        type: mongoose_1.default.Types.ObjectId,
        ref: 'Manufacturer',
        required: true
    },
    image: String,
    price: { type: Number },
    currency: String,
    pricePerUnit: Number,
    unitType: String,
    packagingSize: String,
    rating: Number,
    reviewsCount: Number,
    productType: String,
    description: String,
    minOrderQuantity: Number,
    leadTimeDetailed: {
        average: Number,
        max: Number,
        unit: String
    },
    sustainable: Boolean,
    ingredients: [String],
    allergens: [String],
    flavorType: [String],
    usage: [String],
    shelfLife: String,
    status: {
        type: String,
        enum: ['available', 'discontinued', 'preorder'],
        default: 'available'
    }
}, { timestamps: true });
const Manufacturer = mongoose_1.default.model('Manufacturer', ManufacturerSchema);
const Product = mongoose_1.default.model('Product', ProductSchema);
// Function to convert price string to number
const extractPriceNumber = (priceString) => {
    if (!priceString)
        return 0;
    // Remove currency symbols and commas, then parse
    const cleanPrice = priceString.replace(/[¥$£€,]/g, '').trim();
    return parseFloat(cleanPrice) || 0;
};
const importData = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your-db');
        console.log('Connected to MongoDB');
        // Clear existing data
        yield Manufacturer.deleteMany({});
        yield Product.deleteMany({});
        console.log('Cleared existing data');
        // Read data from JSON file
        const dataPath = path_1.default.join(__dirname, '../../data/newdb.json');
        const rawData = fs_1.default.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        // Import manufacturers first
        const manufacturerMap = new Map(); // Map old ID to new ObjectId
        for (const manufacturerData of data.manufacturers) {
            const manufacturer = new Manufacturer({
                name: manufacturerData.name,
                location: manufacturerData.location,
                establish: manufacturerData.establish,
                industry: manufacturerData.industry,
                certification: manufacturerData.certification || [],
                contact: {
                    email: ((_a = manufacturerData.contact) === null || _a === void 0 ? void 0 : _a.email) || '',
                    phone: ((_b = manufacturerData.contact) === null || _b === void 0 ? void 0 : _b.phone) || ''
                },
                website: manufacturerData.website || '',
                image: manufacturerData.image || '',
                description: manufacturerData.description || ''
            });
            const savedManufacturer = yield manufacturer.save();
            manufacturerMap.set(manufacturerData._id, savedManufacturer._id);
            console.log(`Imported manufacturer: ${manufacturer.name}`);
        }
        // Import products with manufacturer references
        for (const productData of data.products) {
            const manufacturerObjectId = manufacturerMap.get(productData.manufacturer);
            if (!manufacturerObjectId) {
                console.warn(`Manufacturer not found for product: ${productData.name}`);
                continue;
            }
            const product = new Product({
                name: productData.name,
                category: productData.category,
                originCountry: productData.originCountry,
                manufacturer: manufacturerObjectId,
                image: productData.image || '',
                price: extractPriceNumber(productData.price),
                currency: productData.currency,
                pricePerUnit: productData.pricePerUnit,
                unitType: productData.unitType,
                packagingSize: productData.packagingSize,
                rating: productData.rating,
                reviewsCount: productData.reviewsCount,
                productType: productData.productType,
                description: productData.description,
                minOrderQuantity: productData.minOrderQuantity,
                leadTimeDetailed: productData.leadTimeDetailed,
                sustainable: productData.sustainable || false,
                ingredients: productData.ingredients || [],
                allergens: productData.allergens || [],
                flavorType: productData.flavorType || [],
                usage: productData.usage || [],
                shelfLife: productData.shelfLife,
                status: productData.status || 'available'
            });
            yield product.save();
            console.log(`Imported product: ${product.name}`);
        }
        console.log('Data import completed successfully!');
        // Print summary
        const manufacturerCount = yield Manufacturer.countDocuments();
        const productCount = yield Product.countDocuments();
        console.log(`Total manufacturers: ${manufacturerCount}`);
        console.log(`Total products: ${productCount}`);
    }
    catch (error) {
        console.error('Error importing data:', error);
    }
    finally {
        yield mongoose_1.default.connection.close();
        console.log('Database connection closed');
    }
});
// Run the import
if (require.main === module) {
    importData();
}
exports.default = importData;
