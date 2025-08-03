const request = require('supertest');
const express = require('express');
const authRouter = require('../routes/auth'); // adjust path as needed
const { getConnection } = require('../config');

jest.mock('../config');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

// Mock DB request object chain
const mockRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

const mockPool = {
  request: jest.fn(() => mockRequest),
};

beforeEach(() => {
  jest.clearAllMocks();
  getConnection.mockResolvedValue(mockPool);
});

describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    mockRequest.query
      .mockResolvedValueOnce({ recordset: [] }) // check existingUser - none
      .mockResolvedValueOnce({ recordset: [{ userId: 1 }] }); // insertResult

    const res = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      age: 25,
      password: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
  });

  it('should return 409 if email already exists', async () => {
    mockRequest.query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });

    const res = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      age: 25,
      password: 'password123',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email already registered');
  });
});

describe('POST /auth/login', () => {
  it('should login user and return token', async () => {
    // Mock user record with hashed password for bcrypt compare
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    mockRequest.query.mockResolvedValueOnce({
      recordset: [{ id: 1, email: 'test@example.com', password: hashedPassword }],
    });

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.message).toBe('Login successful');
  });

  it('should return 401 on invalid credentials', async () => {
    mockRequest.query.mockResolvedValueOnce({ recordset: [] });

    const res = await request(app).post('/auth/login').send({
      email: 'wrong@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
