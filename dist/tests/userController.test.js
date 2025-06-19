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
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userController_1 = require("../controllers/userController");
const User_1 = __importDefault(require("../models/User"));
// Mock the User model and its methods
jest.mock('../models/User');
// Mock jsonwebtoken
jest.mock('jsonwebtoken');
// Helper to create mock Request object
const mockRequest = (body = {}, user = {}, headers = {}) => {
    return {
        body,
        user,
        headers,
    };
};
// Helper to create mock Response object
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
describe('User Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.disconnect();
    }));
    describe('registerUser', () => {
        test('should register a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'manufacturer',
            });
            const res = mockResponse();
            // Mock User.findOne to return null (user doesn't exist)
            User_1.default.findOne.mockResolvedValueOnce(null);
            // Mock User.create to return a new user
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'manufacturer',
                status: 'pending',
            };
            User_1.default.create.mockResolvedValueOnce(mockUser);
            // Mock token generation
            jsonwebtoken_1.default.sign.mockReturnValueOnce('mocktoken123');
            // Execute
            yield (0, userController_1.registerUser)(req, res);
            // Assert
            expect(User_1.default.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(User_1.default.create).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'manufacturer',
            });
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: 'user123' }, expect.any(String), { expiresIn: '30d' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'manufacturer',
                status: 'pending',
                token: 'mocktoken123',
            });
        }));
        test('should return 400 if user already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
                role: 'manufacturer',
            });
            const res = mockResponse();
            // Mock User.findOne to return an existing user
            User_1.default.findOne.mockResolvedValueOnce({ email: 'existing@example.com' });
            // Execute
            yield (0, userController_1.registerUser)(req, res);
            // Assert
            expect(User_1.default.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
            expect(User_1.default.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
        }));
    });
    describe('loginUser', () => {
        test('should login user successfully and return token', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                email: 'test@example.com',
                password: 'password123',
            });
            const res = mockResponse();
            // Mock User.findOne to return a user
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'manufacturer',
                status: 'active',
                matchPassword: jest.fn().mockResolvedValueOnce(true),
            };
            User_1.default.findOne.mockResolvedValueOnce(mockUser);
            // Mock token generation
            jsonwebtoken_1.default.sign.mockReturnValueOnce('mocktoken123');
            // Execute
            yield (0, userController_1.loginUser)(req, res);
            // Assert
            expect(User_1.default.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: 'user123' }, expect.any(String), { expiresIn: '30d' });
            expect(res.json).toHaveBeenCalledWith({
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'manufacturer',
                status: 'active',
                token: 'mocktoken123',
            });
        }));
        test('should return 401 if email is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                email: 'nonexistent@example.com',
                password: 'password123',
            });
            const res = mockResponse();
            // Mock User.findOne to return null
            User_1.default.findOne.mockResolvedValueOnce(null);
            // Execute
            yield (0, userController_1.loginUser)(req, res);
            // Assert
            expect(User_1.default.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        }));
        test('should return 401 if password is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                email: 'test@example.com',
                password: 'wrongpassword',
            });
            const res = mockResponse();
            // Mock User.findOne to return a user
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                matchPassword: jest.fn().mockResolvedValueOnce(false),
            };
            User_1.default.findOne.mockResolvedValueOnce(mockUser);
            // Execute
            yield (0, userController_1.loginUser)(req, res);
            // Assert
            expect(User_1.default.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
        }));
    });
    describe('getUserProfile', () => {
        test('should return user profile successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({}, { _id: 'user123' });
            const res = mockResponse();
            // Mock User.findById to return a user
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                companyName: 'Test Company',
                role: 'manufacturer',
                status: 'active',
                profileComplete: true,
                lastLogin: new Date(),
                phone: '1234567890',
                website: 'https://example.com',
                websiteUrl: 'https://example.com',
                address: '123 Test St',
                description: 'Test description',
                companyDescription: 'Test company description',
                industry: 'Technology',
                certificates: 'ISO 9001',
                avatar: 'avatar.jpg',
                connectionPreferences: {
                    connectWith: ['brands'],
                    industryInterests: ['technology'],
                    interests: ['innovation'],
                    lookingFor: ['partnerships'],
                },
                manufacturerSettings: {
                    productionCapacity: 1000,
                    certifications: ['ISO 9001'],
                    preferredCategories: ['technology'],
                    minimumOrderValue: 500,
                },
                brandSettings: {},
                retailerSettings: {},
                notifications: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            User_1.default.findById.mockResolvedValueOnce(mockUser);
            // Execute
            yield (0, userController_1.getUserProfile)(req, res);
            // Assert
            expect(User_1.default.findById).toHaveBeenCalledWith('user123');
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                companyName: 'Test Company',
                // ... and other profile properties
            }));
        }));
        test('should return 404 if user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({}, { _id: 'nonexistent' });
            const res = mockResponse();
            // Mock User.findById to return null
            User_1.default.findById.mockResolvedValueOnce(null);
            // Execute
            yield (0, userController_1.getUserProfile)(req, res);
            // Assert
            expect(User_1.default.findById).toHaveBeenCalledWith('nonexistent');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        }));
    });
    describe('updateUserProfile', () => {
        test('should update user profile successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({
                name: 'Updated Name',
                email: 'updated@example.com',
                phone: '9876543210',
                companyName: 'Updated Company',
                description: 'Updated description',
                companyDescription: 'Updated description',
            }, { _id: 'user123' });
            const res = mockResponse();
            // Mock User.findById to return a user
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                companyName: 'Test Company',
                description: 'Test description',
                companyDescription: 'Test description',
                role: 'manufacturer',
                status: 'active',
                profileComplete: true,
                save: jest.fn().mockResolvedValue({
                    _id: 'user123',
                    name: 'Updated Name',
                    email: 'updated@example.com',
                    phone: '9876543210',
                    companyName: 'Updated Company',
                    description: 'Updated description',
                    companyDescription: 'Updated description',
                    role: 'manufacturer',
                    status: 'active',
                    profileComplete: true
                })
            };
            User_1.default.findById.mockResolvedValueOnce(mockUser);
            // Execute
            yield (0, userController_1.updateUserProfile)(req, res);
            // Assert
            expect(User_1.default.findById).toHaveBeenCalledWith('user123');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                _id: 'user123',
                name: 'Updated Name',
                email: 'updated@example.com',
                phone: '9876543210',
                companyName: 'Updated Company',
                description: 'Updated description',
                companyDescription: 'Updated description',
                role: 'manufacturer',
                status: 'active',
                profileComplete: true
            });
        }));
        test('should return 404 if user not found for update', () => __awaiter(void 0, void 0, void 0, function* () {
            // Setup
            const req = mockRequest({ name: 'Updated Name' }, { _id: 'nonexistent' });
            const res = mockResponse();
            // Mock User.findById to return null
            User_1.default.findById.mockResolvedValueOnce(null);
            // Execute
            yield (0, userController_1.updateUserProfile)(req, res);
            // Assert
            expect(User_1.default.findById).toHaveBeenCalledWith('nonexistent');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        }));
    });
});
