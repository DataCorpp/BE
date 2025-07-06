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
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("../routes/userRoutes"));
// Create Express app for testing
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/users', userRoutes_1.default);
// Mock the dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
// Mock User model
const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    companyName: 'Test Company',
    phone: '1234567890',
    description: 'Test description',
    companyDescription: 'Test company description',
    role: 'manufacturer',
    status: 'active',
    profileComplete: true,
    save: jest.fn().mockResolvedValue({
        _id: 'user123',
        name: 'Updated Name',
        email: 'updated@example.com',
        companyName: 'Updated Company',
        phone: '9876543210',
        description: 'Updated description',
        companyDescription: 'Updated description',
        role: 'manufacturer',
        status: 'active',
        profileComplete: true
    })
};
jest.mock('../models/User', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => ({
            select: jest.fn().mockResolvedValue(mockUser)
        })),
        findOne: jest.fn().mockImplementation((query) => {
            if (query.email === 'test@example.com') {
                return Promise.resolve(Object.assign(Object.assign({}, mockUser), { matchPassword: jest.fn().mockResolvedValue(true) }));
            }
            return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation((userData) => {
            if (userData.email === 'existing@example.com') {
                throw { code: 11000, message: 'User already exists' };
            }
            return Promise.resolve(Object.assign(Object.assign({}, userData), { _id: 'user123', status: 'pending', profileComplete: false }));
        })
    }
}));
// Mock implementation for protect middleware
jest.mock('../middleware/authMiddleware', () => ({
    protect: jest.fn((req, res, next) => {
        req.user = {
            _id: 'user123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'manufacturer'
        };
        next();
    }),
    authorize: jest.fn((...roles) => (req, res, next) => {
        if (roles.includes(req.user.role)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Not authorized to access this route' });
        }
    })
}));
describe('User API Routes', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Connect to database if needed for integration tests
        // or setup mocks for all external dependencies
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.disconnect();
    }));
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/users - Register User', () => {
        test('should register a new user and return 201 with token', () => __awaiter(void 0, void 0, void 0, function* () {
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
            // Test request
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users')
                .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'manufacturer',
            });
            // Assertions
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('_id', 'user123');
            expect(response.body).toHaveProperty('name', 'Test User');
            expect(response.body).toHaveProperty('email', 'test@example.com');
            expect(response.body).toHaveProperty('role', 'manufacturer');
            expect(response.body).toHaveProperty('status', 'pending');
        }));
        test('should return 400 if user already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock User.findOne to return an existing user
            User_1.default.findOne.mockResolvedValueOnce({ email: 'existing@example.com' });
            // Test request
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users')
                .send({
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
                role: 'manufacturer',
            });
            // Assertions
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'User already exists');
        }));
    });
    describe('POST /api/users/login - Login User', () => {
        test('should login user and return token', () => __awaiter(void 0, void 0, void 0, function* () {
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
            // Test request
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'test@example.com',
                password: 'password123',
            });
            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token', 'mocktoken123');
            expect(response.body).toHaveProperty('_id', 'user123');
            expect(response.body).toHaveProperty('name', 'Test User');
            expect(response.body).toHaveProperty('email', 'test@example.com');
            expect(response.body).toHaveProperty('role', 'manufacturer');
            expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
        }));
        test('should return 401 for invalid email', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock User.findOne to return null (user not found)
            User_1.default.findOne.mockResolvedValueOnce(null);
            // Test request
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'password123',
            });
            // Assertions
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        }));
        test('should return 401 for invalid password', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock User.findOne to return a user
            const mockUser = {
                email: 'test@example.com',
                matchPassword: jest.fn().mockResolvedValueOnce(false),
            };
            User_1.default.findOne.mockResolvedValueOnce(mockUser);
            // Test request
            const response = yield (0, supertest_1.default)(app)
                .post('/api/users/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword',
            });
            // Assertions
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
            expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
        }));
    });
    describe('GET /api/users/profile - Get User Profile', () => {
        it('should return user profile when authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                companyName: 'Test Company',
                role: 'manufacturer',
                status: 'active',
                profileComplete: true,
                lastLogin: new Date().toISOString(),
                phone: '1234567890',
                website: 'test.com',
                websiteUrl: 'https://test.com',
                address: '123 Test St',
                description: 'Test description',
                companyDescription: 'Test company description',
                industry: 'Technology',
                certificates: [],
                avatar: null,
                connectionPreferences: {},
                manufacturerSettings: {},
                brandSettings: {},
                retailerSettings: {},
                notifications: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Mock User.findById to return our mock user
            const User = require('../models/User').default;
            User.findById.mockImplementationOnce(() => mockUser);
            const response = yield (0, supertest_1.default)(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer valid-token');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockUser);
        }));
    });
    describe('PUT /api/users/profile - Update User Profile', () => {
        it('should update user profile when authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
            const updatedProfile = {
                name: 'Updated Name',
                email: 'updated@example.com',
                companyName: 'Updated Company',
                phone: '9876543210',
                description: 'Updated description',
                companyDescription: 'Updated company description',
                role: 'manufacturer',
                status: 'active',
                profileComplete: true
            };
            const mockUser = Object.assign(Object.assign({}, updatedProfile), { _id: 'user123', save: jest.fn().mockImplementation(() => Promise.resolve(Object.assign(Object.assign({}, updatedProfile), { _id: 'user123' }))) });
            // Mock User.findById to return our mock user
            const User = require('../models/User').default;
            User.findById.mockImplementationOnce(() => mockUser);
            const response = yield (0, supertest_1.default)(app)
                .put('/api/users/profile')
                .set('Authorization', 'Bearer valid-token')
                .send(updatedProfile);
            const savedUser = yield mockUser.save();
            expect(response.status).toBe(200);
            expect(response.body).toEqual(savedUser);
            expect(mockUser.save).toHaveBeenCalled();
        }));
    });
});
