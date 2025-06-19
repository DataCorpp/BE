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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const FoodProduct_1 = __importDefault(require("../models/FoodProduct"));
const db_1 = __importDefault(require("../config/db"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const DATA_PATH = path_1.default.resolve(__dirname, '../../data/seasonings_data_JP.json');
function parsePrice(price) {
    if (!price)
        return undefined;
    const match = price.replace(/,/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : undefined;
}
function toArray(val) {
    if (!val)
        return [];
    if (Array.isArray(val))
        return val;
    if (typeof val === 'string')
        return val.split(/[、,\s/]+/).map(s => s.trim()).filter(Boolean);
    return [];
}
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.default)();
            const raw = fs_1.default.readFileSync(DATA_PATH, 'utf-8');
            const products = JSON.parse(raw);
            // Remove all existing food products
            yield FoodProduct_1.default.deleteMany({});
            const mapped = products.map((item) => ({
                name: item['Product name'],
                category: item['Category'],
                manufacturer: item['Manufacturer name'],
                image: item['link image'],
                price: item['price per units'],
                pricePerUnit: parsePrice(item['price per units']),
                rating: 4.0,
                productType: item['Category'],
                description: item['description'],
                minOrderQuantity: 1,
                leadTime: '1',
                leadTimeUnit: 'weeks',
                sustainable: false,
                sku: undefined,
                unitType: item['unit type'],
                currentAvailable: 100,
                ingredients: toArray(item['Ingredients']),
                flavorType: toArray(item['Flavor / taste type']),
                usage: toArray(item['Usage']),
                packagingSize: item['Packaging size'],
                shelfLife: item['Shelf life'],
                manufacturerRegion: item['Manufacturer region'],
            }));
            const result = yield FoodProduct_1.default.insertMany(mapped);
            console.log(`Seeded ${result.length} Japanese food products.`);
            process.exit(0);
        }
        catch (err) {
            console.error('Seeding failed:', err);
            process.exit(1);
        }
    });
}
seed();
