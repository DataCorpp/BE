import Product, { IProduct } from './Product';
import FoodProduct, { IFoodProduct } from './FoodProduct';

// Export các models
export { Product, FoodProduct };
export type { IProduct, IFoodProduct };

// Type cho product types được hỗ trợ
export type ProductType = 'food' | 'beverage' | 'health' | 'other';

// Type cho Product Model constructor
export type ProductModel = typeof Product | typeof FoodProduct;

// Helper function để lấy model phù hợp dựa trên productType
export const getProductModel = (productType: ProductType): ProductModel => {
  switch (productType) {
    case 'food':
      return FoodProduct;
    case 'beverage':
    case 'health':
    case 'other':
    default:
      return Product;
  }
};

// Helper function để tạo sản phẩm với loại phù hợp
export const createProduct = (productType: ProductType, data: Partial<IProduct | IFoodProduct>) => {
  const Model = getProductModel(productType);
  return new Model({ ...data, productType });
};

// Helper function để validate productType
export const isValidProductType = (type: string): type is ProductType => {
  return ['food', 'beverage', 'health', 'other'].includes(type);
};

// Helper function để map form data to database structure
export const mapFormDataToFoodProduct = (formData: any) => {
  const {
    manufacturerName,
    currentAvailable,
    pricePerUnit,
    foodProductData,
    ...baseProductData
  } = formData;

  // Map form fields to database fields
  const mappedData = {
    ...baseProductData,
    // Map manufacturerName to both brand (base schema) and manufacturer (food schema)
    brand: manufacturerName,
    manufacturer: manufacturerName,
    // Map currentAvailable to countInStock (base schema) and keep currentAvailable (food schema)
    countInStock: currentAvailable || 0,
    currentAvailable: currentAvailable || 0,
    // Map pricePerUnit to price (base schema) and keep pricePerUnit (food schema)
    price: pricePerUnit || 0,
    pricePerUnit: pricePerUnit || 0,
    // Spread food-specific data
    ...foodProductData,
  };

  return mappedData;
};

export default {
  Product,
  FoodProduct,
  getProductModel,
  createProduct,
  isValidProductType,
  mapFormDataToFoodProduct,
}; 