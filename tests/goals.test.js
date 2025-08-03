const request = require('supertest');
const express = require('express');
const goalsRouter = require('../routes/goals'); // adjust path
const { getConnection } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');

jest.mock('../config');
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});

const app = express();
app.use(express.json());
app.use('/goals', goalsRouter);

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

describe('POST /goals/add', () => {
  it('adds a new goal', async () => {
    mockRequest.query.mockResolvedValueOnce({});

    const res = await request(app).post('/goals/add').send({
      description: 'Lose 5 kg',
      target_date: '2025-12-31',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Goal added successfully');
  });
});

describe('GET /goals', () => {
  it('gets all goals', async () => {
    mockRequest.query.mockResolvedValueOnce({
      recordset: [{ id: 1, description: 'Lose 5 kg' }],
    });

    const res = await request(app).get('/goals');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, description: 'Lose 5 kg' }]);
  });
});
