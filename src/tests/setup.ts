// setup.ts - Jest setup file
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set a longer timeout for async tests
jest.setTimeout(30000);

// Silence console logs during tests
global.console = {
  ...console,
  // Uncomment these to silence specific console methods during testing
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};

// Global teardown
afterAll(async () => {
  // Perform any cleanup after all tests have finished
}); 