const request = require('supertest');
const express = require('express');
const workoutsRouter = require('../routes/workouts');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});
jest.mock('../config');

const app = express();
app.use(express.json());
app.use('/workouts', workoutsRouter);

describe('Workouts API', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({
        rowsAffected: [1],
        recordset: []
      }),
      query: jest.fn().mockReturnThis()
    };
    getConnection.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /workouts/add', () => {
    it('should add a workout', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .post('/workouts/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Running',
          duration: 30,
          calories: 300,
          workout_date: '2023-01-01'
        });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('GET /workouts', () => {
    it('should return workouts list', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordset: [
          { id: 1, workoutType: 'Running', duration: 30, calories: 300 }
        ]
      });

      const res = await request(app)
        .get('/workouts')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /workouts/:id', () => {
    it('should update an existing workout', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .put('/workouts/1')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Updated Running',
          duration: 45,
          calories: 450,
          workout_date: '2023-01-02'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Workout updated successfully');
    });

    it('should return 404 if workout not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .put('/workouts/999')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Non-existent workout'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Workout not found or unauthorized');
    });

    it('should return 500 for invalid input', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('Invalid input'));

      const res = await request(app)
        .put('/workouts/1')
        .set('Authorization', 'Bearer validtoken')
        .send({
          duration: 'not-a-number'
        });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /workouts/:id', () => {
    it('should delete an existing workout', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .delete('/workouts/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Workout deleted successfully');
    });

    it('should return 404 if workout not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .delete('/workouts/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Workout not found or unauthorized');
    });

    it('should return 500 for invalid ID', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('Invalid ID'));

      const res = await request(app)
        .delete('/workouts/invalid-id')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /workouts/:id', () => {
    it('should return a specific workout', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordset: [
          { id: 1, workoutType: 'Running', duration: 30, calories: 300 }
        ]
      });

      const res = await request(app)
        .get('/workouts/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('should return 404 if workout not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/workouts/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
    });
  });
});