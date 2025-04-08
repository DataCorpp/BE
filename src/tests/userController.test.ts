import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/userController';
import User from '../models/User';

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
  } as Request;
};

// Helper to create mock Response object
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('User Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      // Setup
      const req = mockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'manufacturer',
      });
      const res = mockResponse();

      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock User.create to return a new user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'manufacturer',
        status: 'pending',
      };
      (User.create as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock token generation
      (jwt.sign as jest.Mock).mockReturnValueOnce('mocktoken123');

      // Execute
      await registerUser(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'manufacturer',
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123' },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'manufacturer',
        status: 'pending',
        token: 'mocktoken123',
      });
    });

    test('should return 400 if user already exists', async () => {
      // Setup
      const req = mockRequest({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'manufacturer',
      });
      const res = mockResponse();

      // Mock User.findOne to return an existing user
      (User.findOne as jest.Mock).mockResolvedValueOnce({ email: 'existing@example.com' });

      // Execute
      await registerUser(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });
  });

  describe('loginUser', () => {
    test('should login user successfully and return token', async () => {
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
      (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock token generation
      (jwt.sign as jest.Mock).mockReturnValueOnce('mocktoken123');

      // Execute
      await loginUser(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.matchPassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123' },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(res.json).toHaveBeenCalledWith({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'manufacturer',
        status: 'active',
        token: 'mocktoken123',
      });
    });

    test('should return 401 if email is invalid', async () => {
      // Setup
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
      const res = mockResponse();

      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Execute
      await loginUser(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    test('should return 401 if password is invalid', async () => {
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
      (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

      // Execute
      await loginUser(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.matchPassword).toHaveBeenCalledWith('wrongpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });

  describe('getUserProfile', () => {
    test('should return user profile successfully', async () => {
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
      (User.findById as jest.Mock).mockResolvedValueOnce(mockUser);

      // Execute
      await getUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        companyName: 'Test Company',
        // ... and other profile properties
      }));
    });

    test('should return 404 if user not found', async () => {
      // Setup
      const req = mockRequest({}, { _id: 'nonexistent' });
      const res = mockResponse();

      // Mock User.findById to return null
      (User.findById as jest.Mock).mockResolvedValueOnce(null);

      // Execute
      await getUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile successfully', async () => {
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
      (User.findById as jest.Mock).mockResolvedValueOnce(mockUser);

      // Execute
      await updateUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('user123');
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
    });

    test('should return 404 if user not found for update', async () => {
      // Setup
      const req = mockRequest(
        { name: 'Updated Name' },
        { _id: 'nonexistent' }
      );
      const res = mockResponse();

      // Mock User.findById to return null
      (User.findById as jest.Mock).mockResolvedValueOnce(null);

      // Execute
      await updateUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });
}); 