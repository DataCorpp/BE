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
const Manufacturer_1 = __importDefault(require("../models/Manufacturer"));
const db_1 = __importDefault(require("../config/db"));
// Load env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const DATA_PATH = path_1.default.resolve(__dirname, '../../data/Manu.json');
function seedManufacturers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.default)();
            const raw = fs_1.default.readFileSync(DATA_PATH, 'utf-8');
            const manufacturers = JSON.parse(raw);
            // Remove all existing manufacturers
            yield Manufacturer_1.default.deleteMany({});
            // Insert new manufacturers
            const result = yield Manufacturer_1.default.insertMany(manufacturers);
            console.log(`Seeded ${result.length} manufacturers.`);
            process.exit(0);
        }
        catch (err) {
            console.error('Seeding failed:', err);
            process.exit(1);
        }
    });
}
seedManufacturers();
