const request = require('supertest');
const express = require('express');
const workoutsRouter = require('../routes/workouts'); // adjust path
const { getConnection } = require('../config');
const authenticateToken = require('../middleware/authMiddleware');

jest.mock('../config');
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 }; // Mock authenticated user
  next();
});

const app = express();
app.use(express.json());
app.use('/workouts', workoutsRouter);

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

describe('GET /workouts', () => {
  it('returns workouts array', async () => {
    mockRequest.query.mockResolvedValueOnce({
      recordset: [{ id: 1, workoutType: 'Running', calories: 300 }],
    });

    const res = await request(app).get('/workouts');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1, workoutType: 'Running', calories: 300 }]);
  });
});

describe('POST /workouts/add', () => {
  it('adds a new workout', async () => {
    mockRequest.query.mockResolvedValueOnce({});

    const res = await request(app).post('/workouts/add').send({
      workoutType: 'Cycling',
      duration: 45,
      calories: 400,
      workout_date: '2025-08-03',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Workout added successfully');
  });
});
