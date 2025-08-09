const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRouter = require('../routes/auth');
const { getConnection, sql } = require('../config');

// Mock database and bcrypt
jest.mock('../config');
jest.mock('bcrypt');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Authentication API', () => {
  let mockDb;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashed_password',
    first_name: 'Test',
    username: 'testuser'
  };

  beforeEach(() => {
    mockDb = {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      query: jest.fn().mockReturnThis()
    };
    getConnection.mockResolvedValue(mockDb);
    bcrypt.hash.mockResolvedValue('hashed_password');
    bcrypt.compare.mockImplementation((plain, hashed) => 
      Promise.resolve(plain === 'correctpassword' && hashed === 'hashed_password')
    );
    jwt.sign = jest.fn().mockReturnValue('mock_jwt_token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      mockDb.execute.mockResolvedValueOnce({ output: { userId: 1 } });

      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phone: '+1234567890',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        message: 'User registered successfully',
        userId: 1
      });
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          // Missing lastName, username, etc.
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required fields');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phone: '+1234567890',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid email format');
    });

    it('should reject invalid phone format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phone: 'invalid',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid phone format');
    });

    it('should reject short passwords', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phone: '+1234567890',
          email: 'john@example.com',
          password: '123' // Too short
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('at least 6 characters');
    });

    it('should handle duplicate email/username', async () => {
      mockDb.execute.mockRejectedValueOnce({ 
        originalError: { message: 'Violation of UNIQUE constraint' }
      });

      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phone: '+1234567890',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('already registered');
    });

    it('should handle server errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          phone: '+1234567890',
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Server error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [mockUser] });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        token: 'mock_jwt_token',
        message: 'Login successful',
        firstName: 'Test',
        username: 'testuser'
      });
    });

    it('should reject login with invalid email', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'correctpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [mockUser] });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: '', // Missing email
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Email and password required');
    });

    it('should handle server errors during login', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Server error');
    });
  });
});