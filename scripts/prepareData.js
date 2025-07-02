const fs = require('fs');
const path = require('path');
const { Types: { ObjectId } } = require('mongoose');

/*
  ---------------------------------------------------------------------------
  prepareData.js
  ---------------------------------------------------------------------------
  Purpose:
    1. Convert primitive/string IDs in Manu_users.json, food_product.json, and
       product.json to proper MongoDB ObjectId strings (24-hex chars).
    2. Preserve and propagate relationships so that:
         • food_product.user  →  manufacturer._id
         • product.productId  →  food_product._id
    3. Write the transformed arrays to new *_ready.json files
       (original data remains untouched).

  Usage:
       node BE/scripts/prepareData.js

  Requirements:
       npm install mongoose
  ---------------------------------------------------------------------------
*/

/* Resolve absolute paths */
const dataDir = path.join(__dirname, '..', 'data');
const files = {
  manufacturers: path.join(dataDir, 'Manu_users.json'),
  foods: path.join(dataDir, 'food_product.json'),
  products: path.join(dataDir, 'product.json'),
};

/* Helper to read JSON file */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/* Helper to write JSON array pretty-printed */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✔ Wrote ${data.length} records → ${filePath}`);
}

/* MAIN */
(function convert() {
  console.log('📦  Loading source JSON files...');
  const manufacturers = readJson(files.manufacturers);
  const foods         = readJson(files.foods);
  const products      = readJson(files.products);

  // ---------------------------------------------------------------------
  // Step 1: Ensure manufacturer._id is ObjectId string (already 24-hex)
  // ---------------------------------------------------------------------
  const manufacturerMap = new Map(); // oldId (string) -> newId (string)

  manufacturers.forEach(man => {
    const oldId = man._id;
    let newId;

    if (typeof oldId === 'string' && oldId.length === 24 && /^[0-9a-fA-F]+$/.test(oldId)) {
      newId = oldId; // already looks like ObjectId
    } else {
      newId = new ObjectId().toString();
      man._id = newId;
    }

    manufacturerMap.set(oldId, newId);
  });

  // ---------------------------------------------------------------------
  // Step 2: Convert FoodProduct IDs & fix user reference
  // ---------------------------------------------------------------------
  const foodMap = new Map(); // oldFoodId -> newFoodId

  foods.forEach(fp => {
    const oldFoodId = fp._id;
    const newFoodId = new ObjectId().toString();
    fp._id = newFoodId;
    foodMap.set(oldFoodId, newFoodId);

    // Update `user` → manufacturer._id
    if (fp.user && manufacturerMap.has(fp.user)) {
      fp.user = manufacturerMap.get(fp.user);
    } else if (fp.user && manufacturerMap.get(fp.user) === undefined) {
      console.warn(`⚠  Unknown manufacturer for food_product._id=${oldFoodId} (user=${fp.user})`);
    }
  });

  // ---------------------------------------------------------------------
  // Step 3: Convert Product IDs & fix productId + (optional) manufacturerId
  // ---------------------------------------------------------------------
  products.forEach(p => {
    p._id = new ObjectId().toString();

    // Update productId reference
    if (foodMap.has(p.productId)) {
      p.productId = foodMap.get(p.productId);
    } else {
      console.warn(`⚠  Unknown food product for product._id=${p._id} (productId=${p.productId})`);
    }

    // Optionally add manufacturerId for easier lookups
    const manu = manufacturers.find(m =>
      m.name === p.manufacturerName || m.companyName === p.manufacturerName
    );
    if (manu) {
      p.manufacturerId = manu._id;
    }
  });

  // ---------------------------------------------------------------------
  // OUTPUT
  // ---------------------------------------------------------------------
  console.log('💾  Writing transformed JSON files...');
  writeJson(path.join(dataDir, 'Manu_users_ready.json'), manufacturers);
  writeJson(path.join(dataDir, 'food_product_ready.json'), foods);
  writeJson(path.join(dataDir, 'product_ready.json'), products);

  console.log('\n✅  Conversion completed. Import these *_ready.json files into MongoDB.');
})(); 