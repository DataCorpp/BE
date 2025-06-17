# Manufacturer API Documentation

This document provides instructions for setting up and using the Manufacturer API.

## Overview

The Manufacturer API is a RESTful service built with Node.js, Express, and MongoDB. It provides endpoints for creating, reading, updating, and deleting manufacturer information.

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- npm or yarn

### Environment Configuration

1. Create a `.env` file in the root directory or copy from the example:
   ```bash
   cp .env.example .env
   ```

2. Configure the following environment variables:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/cpg-matching
   JWT_SECRET=your_jwt_secret
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Base URL

```
http://localhost:3000/api/manufacturers
```

### Endpoints

#### Get All Manufacturers
```
GET /api/manufacturers
```

Query Parameters:
- `industry` - Filter by industry
- `location` - Filter by location
- `establish_gte` - Filter by establishment year (greater than or equal)
- `establish_lte` - Filter by establishment year (less than or equal)
- `search` - Search by name
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

Example Request:
```bash
curl -X GET "http://localhost:3000/api/manufacturers?industry=Food%20and%20Beverage&page=1&limit=10"
```

#### Get Manufacturer by ID
```
GET /api/manufacturers/:id
```

Example Request:
```bash
curl -X GET "http://localhost:3000/api/manufacturers/60d21b4667d0d8992e610c85"
```

#### Create Manufacturer
```
POST /api/manufacturers
```

Headers:
```
Content-Type: application/json
Authorization: Bearer <your_token>
```

Request Body:
```json
{
  "name": "ABC Foods Co., Ltd.",
  "location": "Noda, Chiba, Japan",
  "establish": 1985,
  "industry": "Food and Beverage",
  "certification": "ISO 9001; FSSC 22000; Halal",
  "contact": {
    "email": "contact@abcfoods.co.jp",
    "phone": "+81-3-1234-5678",
    "website": "https://www.abcfoods.co.jp"
  }
}
```

Example Request:
```bash
curl -X POST "http://localhost:3000/api/manufacturers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"name":"ABC Foods Co., Ltd.","location":"Noda, Chiba, Japan","establish":1985,"industry":"Food and Beverage","certification":"ISO 9001; FSSC 22000; Halal","contact":{"email":"contact@abcfoods.co.jp","phone":"+81-3-1234-5678","website":"https://www.abcfoods.co.jp"}}'
```

#### Update Manufacturer
```
PUT /api/manufacturers/:id
```

Headers:
```
Content-Type: application/json
Authorization: Bearer <your_token>
```

Request Body:
```json
{
  "certification": "ISO 9001; FSSC 22000; Halal; ISO 14001",
  "contact": {
    "website": "https://www.abcfoods-global.com"
  }
}
```

Example Request:
```bash
curl -X PUT "http://localhost:3000/api/manufacturers/60d21b4667d0d8992e610c85" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"certification":"ISO 9001; FSSC 22000; Halal; ISO 14001","contact":{"website":"https://www.abcfoods-global.com"}}'
```

#### Delete Manufacturer
```
DELETE /api/manufacturers/:id
```

Headers:
```
Authorization: Bearer <your_token>
```

Example Request:
```bash
curl -X DELETE "http://localhost:3000/api/manufacturers/60d21b4667d0d8992e610c85" \
  -H "Authorization: Bearer <your_token>"
```

#### Get Industries
```
GET /api/manufacturers/industries
```

Example Request:
```bash
curl -X GET "http://localhost:3000/api/manufacturers/industries"
```

#### Get Locations
```
GET /api/manufacturers/locations
```

Example Request:
```bash
curl -X GET "http://localhost:3000/api/manufacturers/locations"
```

## Postman Collection

A Postman collection is included for testing the Manufacturer API. Import the collection from:

```
BE/data/postman/Manufacturer_API.postman_collection.json
```

## Frontend Integration

The frontend can access the Manufacturer API using the provided API client in:

```
FE/src/lib/api.ts
```

Example usage:
```typescript
import { manufacturerApi } from '../lib/api';

// Get all manufacturers
const fetchManufacturers = async () => {
  try {
    const response = await manufacturerApi.getManufacturers();
    const manufacturers = response.data.manufacturers;
    // Process manufacturers...
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
  }
};

// Create a new manufacturer
const createManufacturer = async (data) => {
  try {
    const response = await manufacturerApi.createManufacturer(data);
    // Handle response...
  } catch (error) {
    console.error('Error creating manufacturer:', error);
  }
};
```

## Error Handling

The API returns consistent error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "value": "invalid-value",
      "msg": "Detailed error message",
      "param": "field-name",
      "location": "body"
    }
  ]
}
```

## Notes

- All POST and PUT requests require authentication.
- The API supports CORS for frontend development.
- Validation errors are returned with HTTP status 400.
- Resource not found errors are returned with HTTP status 404. 