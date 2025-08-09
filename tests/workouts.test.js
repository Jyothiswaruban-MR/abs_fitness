const request = require('supertest');
const express = require('express');
const workoutsRouter = require('../routes/workouts');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 }; // Mock authenticated user
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
    

    it('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/workouts/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Running',
          // Missing duration, calories, workout_date
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Please fill all required fields');
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post('/workouts/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Running',
          duration: 30,
          calories: 300,
          workout_date: '2023-01-01'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Error while adding workout');
    });
  });

  describe('GET /workouts', () => {
    

    it('should return empty array when no workouts exist', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/workouts')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/workouts')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Error retrieving workouts');
    });
  });

  describe('GET /workouts/:id', () => {
    

    it('should return 404 when workout not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/workouts/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Workout not found');
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/workouts/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Error retrieving workout');
    });
  });

  describe('PUT /workouts/:id', () => {
    
    it('should return 404 when workout not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .put('/workouts/999')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Updated Running',
          duration: 45,
          calories: 450,
          workout_date: '2023-01-02'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Workout not found or unauthorized');
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .put('/workouts/1')
        .set('Authorization', 'Bearer validtoken')
        .send({
          workoutType: 'Updated Running',
          duration: 45,
          calories: 450,
          workout_date: '2023-01-02'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Error updating workout');
    });
  });

  describe('DELETE /workouts/:id', () => {
    

    it('should return 404 when workout not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .delete('/workouts/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Workout not found or unauthorized');
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .delete('/workouts/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Error deleting workout');
    });
  });
});