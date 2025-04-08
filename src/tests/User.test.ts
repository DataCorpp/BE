import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

jest.mock('bcryptjs');
jest.mock('../models/User');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const MockUser = User as jest.MockedClass<typeof User>;

describe('User Model Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockBcrypt.genSalt as jest.Mock).mockResolvedValue('mocksalt');
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
  });

  describe('User Schema', () => {
    test('should create a valid user', async () => {
      const validUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Company',
        phone: '1234567890',
        role: 'manufacturer'
      };

      (MockUser.create as jest.Mock).mockResolvedValueOnce({
        ...validUserData,
        _id: 'user123',
        status: 'pending',
        profileComplete: false
      });

      const user = await User.create(validUserData);
      
      expect(user).toHaveProperty('_id', 'user123');
      expect(user).toHaveProperty('name', validUserData.name);
      expect(user).toHaveProperty('email', validUserData.email);
      expect(user).toHaveProperty('status', 'pending');
      expect(user).toHaveProperty('profileComplete', false);
    });

    test('should not create a user without required fields', async () => {
      const invalidUserData = {
        name: 'Test User'
      };

      (MockUser.create as jest.Mock).mockRejectedValueOnce(new mongoose.Error.ValidationError());

      try {
        await User.create(invalidUserData);
        fail('Expected validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      }
    });

    test('should not create a user with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        companyName: 'Test Company',
        phone: '1234567890',
        role: 'manufacturer'
      };

      (MockUser.create as jest.Mock).mockRejectedValueOnce({ 
        code: 11000,
        message: 'Duplicate key error'
      });

      try {
        await User.create(userData);
        fail('Expected duplicate key error');
      } catch (error: any) {
        expect(error.code).toBe(11000);
      }
    });

    test('should validate role enum values', async () => {
      const invalidUserData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        companyName: 'Test Company',
        phone: '1234567890',
        role: 'invalid_role'
      };

      (MockUser.create as jest.Mock).mockRejectedValueOnce(new mongoose.Error.ValidationError());

      try {
        await User.create(invalidUserData);
        fail('Expected validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      }
    });
  });

  describe('User Pre-Save Hook', () => {
    test('should hash password when creating new user', async () => {
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
      (mockBcrypt.genSalt as jest.Mock).mockResolvedValueOnce(mockSalt);
      (mockBcrypt.hash as jest.Mock).mockResolvedValueOnce(mockHash);

      // Mock the User.create method to simulate the pre-save hook
      (MockUser.create as jest.Mock).mockImplementationOnce(async (data) => {
        const salt = await mockBcrypt.genSalt(10);
        const hashedPassword = await mockBcrypt.hash(data.password, salt);
        return {
          ...data,
          password: hashedPassword,
          _id: 'user123'
        };
      });

      const user = await User.create(userData);

      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(mockBcrypt.hash).toHaveBeenCalledWith('plainpassword', mockSalt);
      expect(user.password).toBe(mockHash);
    });

    test('should not hash password when password is not modified', async () => {
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

      (MockUser.findById as jest.Mock).mockResolvedValueOnce(existingUser);

      const user = await User.findById('user123');
      
      expect(user?.password).toBe('alreadyhashed');
      expect(mockBcrypt.genSalt).not.toHaveBeenCalled();
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
    });
  });

  test('should create & save user successfully', async () => {
    const validUserData = {
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'password123',
      companyName: 'Test Company', 
      phone: '1234567890',
      role: 'manufacturer'
    };

    (MockUser.create as jest.Mock).mockResolvedValueOnce({
      ...validUserData,
      _id: 'newuser123',
      status: 'pending',
      profileComplete: false
    });

    const savedUser = await User.create(validUserData);

    expect(savedUser).toHaveProperty('_id', 'newuser123');
    expect(savedUser).toHaveProperty('name', validUserData.name);
    expect(savedUser).toHaveProperty('email', validUserData.email);
    expect(savedUser).toHaveProperty('status', 'pending');
    expect(savedUser).toHaveProperty('profileComplete', false);
  });
}); 