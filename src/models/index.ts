import Product from "./Product";
import FoodProduct from "./FoodProduct";

// Helper function để lấy model phù hợp dựa trên productType
export const getProductModel = (productType: string) => {
  switch (productType) {
    case 'food':
      return FoodProduct;
    case 'beverage':
    case 'health':
    case 'other':
    default:
      // Trong tương lai có thể tạo BeverageProduct, HealthProduct, etc.
      return FoodProduct; // Tạm thời default về FoodProduct
  }
};

// Helper function để tạo product với cấu trúc mới
export const createProduct = async (
  productType: string,
  productData: { manufacturerName: string; productName: string },
  detailData: any
) => {
  const ProductModel = getProductModel(productType);
  
  if (productType === 'food' && ProductModel === FoodProduct) {
    return await (FoodProduct as any).createWithProduct(productData, detailData);
  }
  
  // Cho các loại sản phẩm khác trong tương lai
  throw new Error(`Product type ${productType} is not yet supported`);
};

// Helper function để lấy product với reference
export const getProductWithReference = async (productType: string, query: any = {}) => {
  switch (productType) {
    case 'food':
      return await (FoodProduct as any).findWithProduct(query);
    default:
      throw new Error(`Product type ${productType} is not yet supported`);
  }
};

// Helper function để update product với reference
export const updateProductWithReference = async (
  productType: string,
  productId: string,
  productData: { manufacturerName?: string; productName?: string },
  detailData: any
) => {
  switch (productType) {
    case 'food':
      return await (FoodProduct as any).updateWithProduct(productId, productData, detailData);
    default:
      throw new Error(`Product type ${productType} is not yet supported`);
  }
};

// Helper function để delete product với reference
export const deleteProductWithReference = async (productType: string, productId: string) => {
  switch (productType) {
    case 'food':
      return await (FoodProduct as any).deleteWithProduct(productId);
    default:
      throw new Error(`Product type ${productType} is not yet supported`);
  }
};

// Helper function để validate product type
export const isValidProductType = (productType: string): boolean => {
  return ['food', 'beverage', 'health', 'other'].includes(productType);
};

// Helper function để map form data to database structure cho FoodProduct
export const mapFormDataToFoodProduct = (formData: any) => {
  const { 
    manufacturerName, 
    productName,
    name,
    // Tách product reference data và detail data
    ...detailData 
  } = formData;

  const productData = {
    manufacturerName: manufacturerName || detailData.manufacturer,
    productName: productName || name || detailData.name,
  };

  const foodProductData = {
    name: name || productName,
    brand: detailData.brand || manufacturerName,
    category: detailData.category || 'Other',
    description: detailData.description || 'No description provided',
    image: detailData.image || 'https://via.placeholder.com/300x300?text=No+Image',
    price: Number(detailData.price || detailData.pricePerUnit) || 0,
    countInStock: Number(detailData.countInStock || detailData.currentAvailable) || 0,
    rating: detailData.rating || 0,
    numReviews: detailData.numReviews || 0,
    
    // Food-specific fields với default values
    manufacturer: detailData.manufacturer || manufacturerName,
    originCountry: detailData.originCountry || 'Unknown',
    manufacturerRegion: detailData.manufacturerRegion || '',
    minOrderQuantity: Number(detailData.minOrderQuantity) || 1,
    dailyCapacity: Number(detailData.dailyCapacity) || 100,
    currentAvailable: Number(detailData.currentAvailable) || 0,
    unitType: detailData.unitType || 'units',
    pricePerUnit: Number(detailData.pricePerUnit) || 0,
    priceCurrency: detailData.priceCurrency || 'USD',
    leadTime: detailData.leadTime || '1-2',
    leadTimeUnit: detailData.leadTimeUnit || 'weeks',
    sustainable: Boolean(detailData.sustainable),
    foodType: detailData.foodType || 'Other',
    flavorType: Array.isArray(detailData.flavorType) ? detailData.flavorType : (detailData.flavorType ? [detailData.flavorType] : []),
    ingredients: Array.isArray(detailData.ingredients) ? detailData.ingredients : (detailData.ingredients ? [detailData.ingredients] : []),
    allergens: Array.isArray(detailData.allergens) ? detailData.allergens : (detailData.allergens ? [detailData.allergens] : []),
    usage: Array.isArray(detailData.usage) ? detailData.usage : (detailData.usage ? [detailData.usage] : []),
    packagingType: detailData.packagingType || 'Bottle',
    packagingSize: detailData.packagingSize || 'Standard',
    shelfLife: detailData.shelfLife || '12 months',
    shelfLifeStartDate: detailData.shelfLifeStartDate ? new Date(detailData.shelfLifeStartDate) : undefined,
    shelfLifeEndDate: detailData.shelfLifeEndDate ? new Date(detailData.shelfLifeEndDate) : undefined,
    storageInstruction: detailData.storageInstruction || 'Store in cool, dry place',
  };

  return { productData, foodProductData };
};

// Export models
export { Product, FoodProduct };

export default {
  Product,
  FoodProduct,
  getProductModel,
  createProduct,
  getProductWithReference,
  updateProductWithReference,
  deleteProductWithReference,
  isValidProductType,
  mapFormDataToFoodProduct,
}; 