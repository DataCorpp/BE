import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Manufacturer from '../models/Manufacturer';
import { IManufacturer } from '../models/Manufacturer';
import connectDB from '../config/db';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATA_PATH = path.resolve(__dirname, '../../data/Manu.json');

async function seedManufacturers() {
  try {
    await connectDB();
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const manufacturers: Partial<IManufacturer>[] = JSON.parse(raw);

    // Remove all existing manufacturers
    await Manufacturer.deleteMany({});
    // Insert new manufacturers
    const result = await Manufacturer.insertMany(manufacturers);
    console.log(`Seeded ${result.length} manufacturers.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedManufacturers(); 