"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import models theo schema mới
const ManufacturerSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    establish: { type: Number, required: true },
    industry: { type: String, required: true },
    certification: [{ type: String }],
    contact: {
        email: { type: String, required: false },
        phone: { type: String, required: false }
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
    price: String,
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
// Helper function để clean manufacturer data
function cleanManufacturerData(manufacturerData) {
    const cleaned = Object.assign({}, manufacturerData);
    // Xử lý email rỗng
    if (!cleaned.contact.email || cleaned.contact.email.trim() === '') {
        cleaned.contact.email = `info@${cleaned.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    }
    // Xử lý phone rỗng
    if (!cleaned.contact.phone || cleaned.contact.phone.trim() === '') {
        cleaned.contact.phone = 'N/A';
    }
    return cleaned;
}
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            if (!process.env.MONGODB_URI) {
                throw new Error('MONGODB_URI not found in environment variables');
            }
            yield mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
            // Read data from newdb.json
            const dataPath = path.join(__dirname, '../../data/newdb.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            const seedData = JSON.parse(rawData);
            // Clear existing data
            yield Manufacturer.deleteMany({});
            yield Product.deleteMany({});
            console.log('Cleared existing data');
            // Map để lưu mapping từ old ID sang new ObjectId
            const manufacturerIdMap = new Map();
            // Seed Manufacturers
            console.log('Seeding manufacturers...');
            for (const manufacturerData of seedData.manufacturers) {
                const { _id } = manufacturerData, manufacturerFields = __rest(manufacturerData, ["_id"]);
                // Clean data trước khi tạo
                const cleanedData = cleanManufacturerData(manufacturerFields);
                const manufacturer = new Manufacturer(cleanedData);
                const savedManufacturer = yield manufacturer.save();
                // Lưu mapping từ old ID sang new ObjectId
                manufacturerIdMap.set(_id, savedManufacturer._id);
                console.log(`✓ Created manufacturer: ${cleanedData.name}`);
            }
            // Seed Products
            console.log('Seeding products...');
            for (const productData of seedData.products) {
                const { _id, manufacturer: oldManufacturerId } = productData, productFields = __rest(productData, ["_id", "manufacturer"]);
                // Lấy ObjectId mới của manufacturer
                const newManufacturerId = manufacturerIdMap.get(oldManufacturerId);
                if (!newManufacturerId) {
                    console.error(`❌ Manufacturer not found for product: ${productFields.name}`);
                    continue;
                }
                const product = new Product(Object.assign(Object.assign({}, productFields), { manufacturer: newManufacturerId }));
                yield product.save();
                console.log(`✓ Created product: ${productFields.name}`);
            }
            console.log('✅ Database seeded successfully!');
            console.log(`📊 Seeded ${seedData.manufacturers.length} manufacturers and ${seedData.products.length} products`);
        }
        catch (error) {
            console.error('❌ Error seeding database:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
            console.log('Disconnected from MongoDB');
        }
    });
}
// Run the seeding function
if (require.main === module) {
    seedDatabase();
}
exports.default = seedDatabase;
