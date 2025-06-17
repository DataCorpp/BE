import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import FoodProduct from '../models/FoodProduct';
import connectDB from '../config/db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATA_PATH = path.resolve(__dirname, '../../data/seasonings_data_JP.json');

function parsePrice(price: string): number | undefined {
  if (!price) return undefined;
  const match = price.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : undefined;
}

function toArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(/[、,\s/]+/).map(s => s.trim()).filter(Boolean);
  return [];
}

async function seed() {
  try {
    await connectDB();
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const products = JSON.parse(raw);

    // Remove all existing food products
    await FoodProduct.deleteMany({});

    const mapped = products.map((item: any) => ({
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

    const result = await FoodProduct.insertMany(mapped);
    console.log(`Seeded ${result.length} Japanese food products.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed(); 