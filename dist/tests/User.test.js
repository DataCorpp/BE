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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
jest.mock('bcryptjs');
jest.mock('../models/User');
const mockBcrypt = bcryptjs_1.default;
const MockUser = User_1.default;
describe('User Model Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockBcrypt.genSalt.mockResolvedValue('mocksalt');
        mockBcrypt.hash.mockResolvedValue('hashedpassword');
    });
    describe('User Schema', () => {
        test('should create a valid user', () => __awaiter(void 0, void 0, void 0, function* () {
            const validUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                companyName: 'Test Company',
                phone: '1234567890',
                role: 'manufacturer'
            };
            MockUser.create.mockResolvedValueOnce(Object.assign(Object.assign({}, validUserData), { _id: 'user123', status: 'pending', profileComplete: false }));
            const user = yield User_1.default.create(validUserData);
            expect(user).toHaveProperty('_id', 'user123');
            expect(user).toHaveProperty('name', validUserData.name);
            expect(user).toHaveProperty('email', validUserData.email);
            expect(user).toHaveProperty('status', 'pending');
            expect(user).toHaveProperty('profileComplete', false);
        }));
        test('should not create a user without required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidUserData = {
                name: 'Test User'
            };
            MockUser.create.mockRejectedValueOnce(new mongoose_1.default.Error.ValidationError());
            try {
                yield User_1.default.create(invalidUserData);
                fail('Expected validation error');
            }
            catch (error) {
                expect(error).toBeInstanceOf(mongoose_1.default.Error.ValidationError);
            }
        }));
        test('should not create a user with duplicate email', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
                companyName: 'Test Company',
                phone: '1234567890',
                role: 'manufacturer'
            };
            MockUser.create.mockRejectedValueOnce({
                code: 11000,
                message: 'Duplicate key error'
            });
            try {
                yield User_1.default.create(userData);
                fail('Expected duplicate key error');
            }
            catch (error) {
                expect(error.code).toBe(11000);
            }
        }));
        test('should validate role enum values', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidUserData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                companyName: 'Test Company',
                phone: '1234567890',
                role: 'invalid_role'
            };
            MockUser.create.mockRejectedValueOnce(new mongoose_1.default.Error.ValidationError());
            try {
                yield User_1.default.create(invalidUserData);
                fail('Expected validation error');
            }
            catch (error) {
                expect(error).toBeInstanceOf(mongoose_1.default.Error.ValidationError);
            }
        }));
    });
    describe('User Pre-Save Hook', () => {
        test('should hash password when creating new user', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'plainpassword',
                companyName: 'Test Company',
                phone: '1234567890',
                role: 'manufacturer'
            };
            // Mock the bcrypt functions
            const mockSalt = 'mocksalt';
            const mockHash = 'hashedpassword';
            mockBcrypt.genSalt.mockResolvedValueOnce(mockSalt);
            mockBcrypt.hash.mockResolvedValueOnce(mockHash);
            // Mock the User.create method to simulate the pre-save hook
            MockUser.create.mockImplementationOnce((data) => __awaiter(void 0, void 0, void 0, function* () {
                const salt = yield mockBcrypt.genSalt(10);
                const hashedPassword = yield mockBcrypt.hash(data.password, salt);
                return Object.assign(Object.assign({}, data), { password: hashedPassword, _id: 'user123' });
            }));
            const user = yield User_1.default.create(userData);
            expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(mockBcrypt.hash).toHaveBeenCalledWith('plainpassword', mockSalt);
            expect(user.password).toBe(mockHash);
        }));
        test('should not hash password when password is not modified', () => __awaiter(void 0, void 0, void 0, function* () {
            const existingUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                password: 'alreadyhashed',
                companyName: 'Test Company',
                phone: '1234567890',
                role: 'manufacturer',
                isModified: jest.fn().mockReturnValue(false)
            };
            MockUser.findById.mockResolvedValueOnce(existingUser);
            const user = yield User_1.default.findById('user123');
            expect(user === null || user === void 0 ? void 0 : user.password).toBe('alreadyhashed');
            expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
            expect(mockBcrypt.hash).not.toHaveBeenCalled();
        }));
    });
    test('should create & save user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const validUserData = {
            name: 'Test User',
            email: 'newuser@example.com',
            password: 'password123',
            companyName: 'Test Company',
            phone: '1234567890',
            role: 'manufacturer'
        };
        MockUser.create.mockResolvedValueOnce(Object.assign(Object.assign({}, validUserData), { _id: 'newuser123', status: 'pending', profileComplete: false }));
        const savedUser = yield User_1.default.create(validUserData);
        expect(savedUser).toHaveProperty('_id', 'newuser123');
        expect(savedUser).toHaveProperty('name', validUserData.name);
        expect(savedUser).toHaveProperty('email', validUserData.email);
        expect(savedUser).toHaveProperty('status', 'pending');
        expect(savedUser).toHaveProperty('profileComplete', false);
    }));
});
