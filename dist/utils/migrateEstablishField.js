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
exports.migrateEstablishField = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
/**
 * Migration script to add the establish field to existing users
 * This script will run once to update existing users with a default establish value
 */
const migrateEstablishField = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄 Starting migration: Adding establish field to existing users...');
        // Find all users without the establish field
        const usersWithoutEstablish = yield User_1.default.find({
            establish: { $exists: false }
        });
        console.log(`📊 Found ${usersWithoutEstablish.length} users without establish field`);
        if (usersWithoutEstablish.length === 0) {
            console.log('✅ No users need migration');
            return;
        }
        // Update users with a default establish value
        // For existing users, we'll use the year they were created as a fallback
        const bulkOps = usersWithoutEstablish.map(user => ({
            updateOne: {
                filter: { _id: user._id },
                update: {
                    $set: {
                        establish: user.createdAt ? user.createdAt.getFullYear() : new Date().getFullYear()
                    }
                }
            }
        }));
        // Execute bulk update
        const result = yield User_1.default.bulkWrite(bulkOps);
        console.log(`✅ Migration completed successfully!`);
        console.log(`📈 Updated ${result.modifiedCount} users with establish field`);
        console.log(`📊 Matched ${result.matchedCount} users`);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
});
exports.migrateEstablishField = migrateEstablishField;
/**
 * Run migration if this file is executed directly
 */
if (require.main === module) {
    // Connect to MongoDB
    mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cpg2')
        .then(() => {
        console.log('📡 Connected to MongoDB');
        return (0, exports.migrateEstablishField)();
    })
        .then(() => {
        console.log('🎉 Migration script completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Migration script failed:', error);
        process.exit(1);
    });
}
