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

  beforeEach(() => {
    mockDb = {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      execute: jest.fn()
    };
    getConnection.mockResolvedValue(mockDb);
    bcrypt.hash.mockResolvedValue('hashed_password');
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
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
      expect(res.body).toHaveProperty('userId', 1);
    });

    it('should reject invalid email', async () => {
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
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'john@example.com',
        password: 'hashed_password',
        first_name: 'John',
        username: 'johndoe'
      };
      
      mockDb.execute.mockResolvedValueOnce({ recordset: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
    });
  });
});