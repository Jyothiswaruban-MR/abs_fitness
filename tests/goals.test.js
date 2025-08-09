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
  let mockRequest;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      execute: jest.fn()
    };
    
    mockDb = {
      request: jest.fn().mockReturnValue(mockRequest),
      query: jest.fn().mockReturnThis()
    };
    
    getConnection.mockResolvedValue(mockDb);
    
    // Default mock implementation
    mockRequest.execute.mockResolvedValue({
      rowsAffected: [1],
      recordset: []
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /goals/add', () => {
    it('should successfully add a new goal', async () => {
      const res = await request(app)
        .post('/goals/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Run 5km',
          target_date: '2023-12-31'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        message: 'Goal added successfully'
      });
      expect(mockDb.request().execute).toHaveBeenCalledWith('sp_AddGoal');
    });

    it('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/goals/add')
        .set('Authorization', 'Bearer validtoken')
        .send({ description: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Description and target date are required');
    });

    it('should handle database errors', async () => {
      mockRequest.execute.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post('/goals/add')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Run 5km',
          target_date: '2023-12-31'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Error adding goal');
    });
  });

  describe('GET /goals', () => {
    it('should return all goals for the user', async () => {
      const mockGoals = [
        { id: 1, description: 'Lose weight', target_date: '2023-12-31', completed: false },
        { id: 2, description: 'Run marathon', target_date: '2024-06-30', completed: true }
      ];
      mockRequest.execute.mockResolvedValueOnce({ recordset: mockGoals });

      const res = await request(app)
        .get('/goals')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockGoals);
      expect(mockDb.request().execute).toHaveBeenCalledWith('sp_GetAllGoals');
    });

    it('should return empty array when no goals exist', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/goals')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /goals/:id', () => {
    it('should return a specific goal', async () => {
      const mockGoal = { 
        id: 1, 
        description: 'Lose weight', 
        target_date: '2023-12-31',
        completed: false,
        user_id: 1
      };
      mockRequest.execute.mockResolvedValueOnce({ recordset: [mockGoal] });

      const res = await request(app)
        .get('/goals/1')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockGoal);
      expect(mockDb.request().execute).toHaveBeenCalledWith('sp_GetGoalById');
    });

    it('should return 404 when goal not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ recordset: [] });

      const res = await request(app)
        .get('/goals/999')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /goals/:id', () => {
    it('should successfully update a goal', async () => {
      const res = await request(app)
        .put('/goals/1')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Updated goal',
          target_date: '2024-01-31',
          status: 'completed'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        message: 'Goal updated successfully'
      });
      expect(mockDb.request().execute).toHaveBeenCalledWith('sp_UpdateGoal');
    });

    it('should return 400 when missing required fields', async () => {
      const res = await request(app)
        .put('/goals/1')
        .set('Authorization', 'Bearer validtoken')
        .send({ description: '' });

      expect(res.statusCode).toBe(400);
    });

    it('should return 404 when goal not found', async () => {
      mockRequest.execute.mockResolvedValueOnce({ rowsAffected: [0] });

      const res = await request(app)
        .put('/goals/999')
        .set('Authorization', 'Bearer validtoken')
        .send({
          description: 'Updated goal',
          target_date: '2024-01-31',
          status: 'completed'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  
});