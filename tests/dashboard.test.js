const request = require('supertest');
const express = require('express');
const dashboardRouter = require('../routes/dashboard');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 }; // Mock authenticated user
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return complete dashboard data', async () => {
      // Mock stored procedure response
      mockDb.execute.mockResolvedValueOnce({
        recordsets: [
          // User info (recordset 0)
          [{ first_name: 'John', username: 'johndoe' }],
          // Total workouts (recordset 1)
          [{ totalWorkouts: 12 }],
          // Total calories (recordset 2)
          [{ totalCalories: 3500 }],
          // Weekly progress (recordset 3)
          [
            { day: '2023-01-01', calories: 500 },
            { day: '2023-01-02', calories: 600 }
          ],
          // Workout frequency (recordset 4)
          [
            { weekday: 'Mon', count: 2 },
            { weekday: 'Wed', count: 1 }
          ],
          // Goal completion (recordset 5)
          [{ completed: 3, inProgress: 2, notStarted: 1 }]
        ]
      });

      const res = await request(app)
        .get('/')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        user: {
          firstName: 'John',
          username: 'johndoe'
        },
        totalWorkouts: 12,
        totalCalories: 3500,
        progress: {
          days: ['2023-01-01', '2023-01-02'],
          calories: [500, 600]
        },
        workoutFrequency: [2, 0, 1, 0, 0, 0, 0], // Mapped to Mon-Sun
        goalCompletion: {
          completed: 3,
          inProgress: 2,
          notStarted: 1
        },
        activeGoals: 2
      });
    });

    it('should handle empty dashboard data', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordsets: [
          [{}], // No user info
          [{}], // No workouts
          [{}], // No calories
          [],    // No progress
          [],    // No frequency
          [{}]  // No goals
        ]
      });

      const res = await request(app)
        .get('/')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        user: {
          firstName: 'User',
          username: ''
        },
        totalWorkouts: 0,
        totalCalories: 0,
        progress: {
          days: [],
          calories: []
        },
        workoutFrequency: [0, 0, 0, 0, 0, 0, 0],
        goalCompletion: {
          completed: 0,
          inProgress: 0,
          notStarted: 0
        },
        activeGoals: 0
      });
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('Database connection failed'));

      const res = await request(app)
        .get('/')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Error fetching dashboard data',
        error: 'Database connection failed'
      });
    });

    it('should handle missing recordset data', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordsets: [
          // Only user info provided
          [{ first_name: 'Jane', username: 'janedoe' }]
          // Other recordsets missing
        ]
      });

      const res = await request(app)
        .get('/')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        user: {
          firstName: 'Jane',
          username: 'janedoe'
        },
        totalWorkouts: 0,
        totalCalories: 0,
        progress: {
          days: [],
          calories: []
        },
        workoutFrequency: [0, 0, 0, 0, 0, 0, 0],
        goalCompletion: {
          completed: 0,
          inProgress: 0,
          notStarted: 0
        },
        activeGoals: 0
      });
    });
  });
});