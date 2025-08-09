const request = require('supertest');
const express = require('express');
const goalsRouter = require('../routes/goals');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});
jest.mock('../config');

const app = express();
app.use(express.json());
app.use('/goals', goalsRouter);

describe('Goals API', () => {
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

  describe('POST /goals/add', () => {
    it('should add a new goal', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .post('/goals/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Lose weight',
          target_date: '2023-12-31'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Goal added successfully');
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/goals/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: '', // Invalid empty description
          target_date: '2023-12-31'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /goals', () => {
    it('should return goals list', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordset: [
          { 
            id: 1, 
            description: 'Lose weight', 
            target_date: '2023-12-31',
            completed: false,
            user_id: 1
          }
        ]
      });

      const res = await request(app)
        .get('/goals')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('description', 'Lose weight');
    });

    it('should return empty array if no goals', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/goals')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('PUT /goals/:id', () => {
    it('should update an existing goal', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .put('/goals/1')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Updated goal description',
          target_date: '2024-01-31',
          completed: true
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Goal updated successfully');
    });

    it('should return 404 if goal not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .put('/goals/999')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Non-existent goal'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Goal not found or unauthorized');
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .put('/goals/1')
        .set('Authorization', 'Bearer validtoken')
        .send({
          target_date: 'invalid-date-format'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /goals/:id', () => {
    it('should delete an existing goal', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .delete('/goals/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Goal deleted successfully');
    });

    it('should return 404 if goal not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .delete('/goals/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'Goal not found or unauthorized');
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .delete('/goals/not-a-number')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /goals/:id', () => {
    it('should return a specific goal', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordset: [
          { 
            id: 1, 
            description: 'Lose weight', 
            target_date: '2023-12-31',
            completed: false,
            user_id: 1
          }
        ]
      });

      const res = await request(app)
        .get('/goals/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('description', 'Lose weight');
    });

    it('should return 404 if goal not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/goals/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
    });
  });
});