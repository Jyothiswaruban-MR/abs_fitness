const request = require('supertest');
const express = require('express');
const profilesRouter = require('../routes/userProfiles'); // adjust path
const { getConnection } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');

jest.mock('../config');
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});

const app = express();
app.use(express.json());
app.use('/profiles', profilesRouter);

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

describe('POST /profiles', () => {
  it('creates a new profile', async () => {
    mockRequest.query.mockResolvedValueOnce({ recordset: [] }); // existing check
    mockRequest.query.mockResolvedValueOnce({}); // insert

    const res = await request(app).post('/profiles').send({
      age: 30,
      gender: 'Male',
      height_cm: 175,
      weight_kg: 70,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Profile created successfully');
  });
});

describe('GET /profiles', () => {
  it('gets user profile', async () => {
    mockRequest.query.mockResolvedValueOnce({
      recordset: [{ userId: 1, age: 30, gender: 'Male' }],
    });

    const res = await request(app).get('/profiles');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ userId: 1, age: 30, gender: 'Male' }][0]);
  });
});
