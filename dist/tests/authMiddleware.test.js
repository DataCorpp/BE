"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = __importDefault(require("../models/User"));
// Mock the dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/User');
// Helper to create mock Request object
const mockRequest = (headers = {}, user = null) => {
    const req = { headers };
    if (user) {
        req.user = user;
    }
    return req;
};
// Helper to create mock Response object
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
// Helper to create mock Next function
const mockNext = jest.fn();
describe('Auth Middleware Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('protect', () => {
        test('should add user to request object when valid token is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const mockUser = { _id: 'user123', name: 'Test User', role: 'manufacturer' };
            const req = mockRequest({
                authorization: 'Bearer validtoken123',
            });
            const res = mockResponse();
            // Mock JWT verification to return a decoded token
            jsonwebtoken_1.default.verify.mockReturnValueOnce({ id: 'user123' });
            // Mock User.findById to return a user
            User_1.default.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(mockUser),
            });
            // Execute
            yield (0, authMiddleware_1.protect)(req, res, mockNext);
            // Assert
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('validtoken123', expect.any(String));
            expect(User_1.default.findById).toHaveBeenCalledWith('user123');
            expect(req.user).toEqual(mockUser);
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        }));
        test('should return 401 when token is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                authorization: 'Bearer invalidtoken',
            });
            const res = mockResponse();
            // Mock JWT verification to throw an error
            jsonwebtoken_1.default.verify.mockImplementationOnce(() => {
                throw new Error('Invalid token');
            });
            // Execute
            yield (0, authMiddleware_1.protect)(req, res, mockNext);
            // Assert
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('invalidtoken', expect.any(String));
            expect(User_1.default.findById).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
        }));
        test('should return 401 when no token is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({});
            const res = mockResponse();
            // Execute
            yield (0, authMiddleware_1.protect)(req, res, mockNext);
            // Assert
            expect(jsonwebtoken_1.default.verify).not.toHaveBeenCalled();
            expect(User_1.default.findById).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
        }));
    });
    describe('authorize', () => {
        test('should call next when user has authorized role', () => {
            // Setup
            const req = mockRequest({}, { role: 'manufacturer' });
            const res = mockResponse();
            const authorizeMiddleware = (0, authMiddleware_1.authorize)(['manufacturer', 'admin']);
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
            const authorizeMiddleware = (0, authMiddleware_1.authorize)(['manufacturer', 'admin']);
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
            (0, authMiddleware_1.admin)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('admin middleware should return 401 for non-admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'manufacturer' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.admin)(req, res, mockNext);
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
            (0, authMiddleware_1.manufacturer)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('manufacturer middleware should call next for admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'admin' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.manufacturer)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('manufacturer middleware should return 401 for non-manufacturer/non-admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'brand' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.manufacturer)(req, res, mockNext);
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
            (0, authMiddleware_1.brand)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('brand middleware should call next for admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'admin' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.brand)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('brand middleware should return 401 for non-brand/non-admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'retailer' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.brand)(req, res, mockNext);
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
            (0, authMiddleware_1.retailer)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('retailer middleware should call next for admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'admin' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.retailer)(req, res, mockNext);
            // Assert
            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        test('retailer middleware should return 401 for non-retailer/non-admin users', () => {
            // Setup
            const req = mockRequest({}, { role: 'manufacturer' });
            const res = mockResponse();
            // Execute
            (0, authMiddleware_1.retailer)(req, res, mockNext);
            // Assert
            expect(mockNext).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as a retailer' });
        });
    });
});
