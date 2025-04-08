import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { protect, authorize, admin, manufacturer, brand, retailer } from '../middleware/authMiddleware';
import User from '../models/User';

// Mock the dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/User');

// Helper to create mock Request object
const mockRequest = (headers = {}, user = null) => {
  const req: Partial<Request> = { headers };
  if (user) {
    req.user = user;
  }
  return req as Request;
};

// Helper to create mock Response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// Helper to create mock Next function
const mockNext = jest.fn();

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('protect', () => {
    test('should add user to request object when valid token is provided', async () => {
      // Setup
      const mockUser = { _id: 'user123', name: 'Test User', role: 'manufacturer' };
      const req = mockRequest({
        authorization: 'Bearer validtoken123',
      });
      const res = mockResponse();

      // Mock JWT verification to return a decoded token
      (jwt.verify as jest.Mock).mockReturnValueOnce({ id: 'user123' });

      // Mock User.findById to return a user
      (User.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(mockUser),
      });

      // Execute
      await protect(req, res, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('validtoken123', expect.any(String));
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should return 401 when token is invalid', async () => {
      // Setup
      const req = mockRequest({
        authorization: 'Bearer invalidtoken',
      });
      const res = mockResponse();

      // Mock JWT verification to throw an error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      // Execute
      await protect(req, res, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', expect.any(String));
      expect(User.findById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
    });

    test('should return 401 when no token is provided', async () => {
      // Setup
      const req = mockRequest({});
      const res = mockResponse();

      // Execute
      await protect(req, res, mockNext);

      // Assert
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(User.findById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    });
  });

  describe('authorize', () => {
    test('should call next when user has authorized role', () => {
      // Setup
      const req = mockRequest({}, { role: 'manufacturer' });
      const res = mockResponse();
      const authorizeMiddleware = authorize(['manufacturer', 'admin']);

      // Execute
      authorizeMiddleware(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should return 403 when user does not have authorized role', () => {
      // Setup
      const req = mockRequest({}, { role: 'retailer' });
      const res = mockResponse();
      const authorizeMiddleware = authorize(['manufacturer', 'admin']);

      // Execute
      authorizeMiddleware(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Role retailer is not authorized to access this resource',
      });
    });
  });

  describe('role-specific middleware', () => {
    test('admin middleware should call next for admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'admin' });
      const res = mockResponse();

      // Execute
      admin(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('admin middleware should return 401 for non-admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'manufacturer' });
      const res = mockResponse();

      // Execute
      admin(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
    });

    test('manufacturer middleware should call next for manufacturer users', () => {
      // Setup
      const req = mockRequest({}, { role: 'manufacturer' });
      const res = mockResponse();

      // Execute
      manufacturer(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('manufacturer middleware should call next for admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'admin' });
      const res = mockResponse();

      // Execute
      manufacturer(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('manufacturer middleware should return 401 for non-manufacturer/non-admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'brand' });
      const res = mockResponse();

      // Execute
      manufacturer(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as a manufacturer' });
    });

    test('brand middleware should call next for brand users', () => {
      // Setup
      const req = mockRequest({}, { role: 'brand' });
      const res = mockResponse();

      // Execute
      brand(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('brand middleware should call next for admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'admin' });
      const res = mockResponse();

      // Execute
      brand(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('brand middleware should return 401 for non-brand/non-admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'retailer' });
      const res = mockResponse();

      // Execute
      brand(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as a brand' });
    });

    test('retailer middleware should call next for retailer users', () => {
      // Setup
      const req = mockRequest({}, { role: 'retailer' });
      const res = mockResponse();

      // Execute
      retailer(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('retailer middleware should call next for admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'admin' });
      const res = mockResponse();

      // Execute
      retailer(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('retailer middleware should return 401 for non-retailer/non-admin users', () => {
      // Setup
      const req = mockRequest({}, { role: 'manufacturer' });
      const res = mockResponse();

      // Execute
      retailer(req, res, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as a retailer' });
    });
  });
}); 