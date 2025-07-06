/*
  prepareData.js
  ----------------
  Utility script to normalise demo JSON files so they match the data model:
  1.  users      → unchanged (already valid)
  2.  products   → rename `user_id` → `user` and wrap in {$oid: ...}
  3.  foodproducts → ensure `user` is ObjectId wrapped in {$oid: ...}

  After running the script the files are overwritten in-place so they can be
  imported with `mongoimport --jsonArray` and all relations (user ⇄ product ⇄ food)
  will resolve correctly.
*/

const fs = require('fs');
const path = require('path');

// -------- helper ---------
const baseDir = path.join(__dirname, '../data/01');
const files = {
  users: path.join(baseDir, 'cpg-matching.users.json'),
  products: path.join(baseDir, 'cpg-matching.products.json'),
  food: path.join(baseDir, 'cpg-matching.foodproducts.json'),
};

// Wrap raw id string in extended JSON so mongoimport recognises ObjectId
const toOid = (val) => ({ $oid: typeof val === 'string' ? val : String(val) });

// ---------- USERS (read-only) ----------
const usersRaw = fs.readFileSync(files.users, 'utf8');
const users = JSON.parse(usersRaw).map((u) => {
  const clone = { ...u };
  if (typeof clone._id === 'string') {
    clone._id = toOid(clone._id);
  }
  return clone;
});
// Persist users back (optional) – keeps file Mongo-ready
fs.writeFileSync(files.users, JSON.stringify(users, null, 2));
// quick map for validation / future use
const userIds = new Set(users.map((u) => (typeof u._id === 'object' && u._id.$oid ? u._id.$oid : u._id)));

// ---------- PRODUCTS (parent) ----------
const productsRaw = fs.readFileSync(files.products, 'utf8');
const products = JSON.parse(productsRaw).map((p) => {
  const clone = { ...p };

  // wrap _id
  if (typeof clone._id === 'string') {
    clone._id = toOid(clone._id);
  }

  // 1) rename user_id → user  (if present)
  if (clone.user_id) {
    clone.user = toOid(clone.user_id);
    delete clone.user_id;
  } else if (clone.user && typeof clone.user === 'string') {
    clone.user = toOid(clone.user);
  }

  // 2) ensure productId stored as ObjectId wrapper
  if (clone.productId && typeof clone.productId === 'string') {
    clone.productId = toOid(clone.productId);
  }

  return clone;
});

// ---------- FOODPRODUCTS (child) ----------
const foodRaw = fs.readFileSync(files.food, 'utf8');
const foods = JSON.parse(foodRaw).map((f) => {
  const clone = { ...f };

  if (typeof clone._id === 'string') {
    clone._id = toOid(clone._id);
  }

  if (typeof clone.user === 'string') {
    clone.user = toOid(clone.user);
  }
  return clone;
});

// ---------- write back ----------
fs.writeFileSync(files.products, JSON.stringify(products, null, 2));
fs.writeFileSync(files.food, JSON.stringify(foods, null, 2));

console.log('✅ JSON normalisation done.');
