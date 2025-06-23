import mongoose from 'mongoose';
import User from '../models/User';

/**
 * Migration script to add the establish field to existing users
 * This script will run once to update existing users with a default establish value
 */
export const migrateEstablishField = async () => {
  try {
    console.log('🔄 Starting migration: Adding establish field to existing users...');

    // Find all users without the establish field
    const usersWithoutEstablish = await User.find({
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
    const result = await User.bulkWrite(bulkOps);
    
    console.log(`✅ Migration completed successfully!`);
    console.log(`📈 Updated ${result.modifiedCount} users with establish field`);
    console.log(`📊 Matched ${result.matchedCount} users`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Run migration if this file is executed directly
 */
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cpg2')
    .then(() => {
      console.log('📡 Connected to MongoDB');
      return migrateEstablishField();
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