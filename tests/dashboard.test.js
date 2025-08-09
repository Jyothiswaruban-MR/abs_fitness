const request = require('supertest');
const express = require('express');
const dashboardRouter = require('../routes/dashboard');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});
jest.mock('../config');

const app = express();
app.use(express.json());
app.use('/', dashboardRouter);

describe('Dashboard API', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      execute: jest.fn()
    };
    getConnection.mockResolvedValue(mockDb);
  });

  it('should return dashboard data', async () => {
    mockDb.execute.mockResolvedValueOnce({
      recordsets: [
        [{ totalWorkouts: 5 }],
        [{ totalCalories: 2500 }],
        [{ day: 'Monday', calories: 500 }],
        [{ username: 'johndoe', first_name: 'John' }]
      ]
    });

    const res = await request(app)
      .get('/')
      .set('Authorization', 'Bearer validtoken');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalWorkouts', 5);
    expect(res.body).toHaveProperty('username', 'johndoe');
  });

  it('should handle errors', async () => {
    mockDb.execute.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .get('/')
      .set('Authorization', 'Bearer validtoken');

    expect(res.statusCode).toBe(500);
  });
});