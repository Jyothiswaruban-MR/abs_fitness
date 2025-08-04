const request = require('supertest');
const express = require('express');
const dashboardRouter = require('../routes/dashboard'); // adjust path
const { getConnection } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');

jest.mock('../config');
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});

const app = express();
app.use(express.json());
app.use('/dashboard', dashboardRouter);

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

describe('GET /dashboard', () => {
  it('returns dashboard data', async () => {
    // This stored procedure returns 3 resultsets, so mock accordingly:
    mockRequest.query.mockResolvedValueOnce({ recordset: [{ totalWorkouts: 5 }] });
    mockRequest.query.mockResolvedValueOnce({ recordset: [{ totalCalories: 2000 }] });
    mockRequest.query.mockResolvedValueOnce({
      recordset: [
        { weekStart: '2025-07-07', workouts: 2, calories: 500 },
        { weekStart: '2025-07-14', workouts: 3, calories: 700 },
      ],
    });

    const res = await request(app).get('/dashboard');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalWorkouts');
    expect(res.body).toHaveProperty('totalCalories');
    expect(res.body).toHaveProperty('weeklyProgress');
  });
});
