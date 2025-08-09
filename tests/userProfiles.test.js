const request = require('supertest');
const express = require('express');
const userProfilesRouter = require('../routes/userprofiles');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 };
  next();
});
jest.mock('../config');

const app = express();
app.use(express.json());
app.use('/profiles', userProfilesRouter);

describe('User Profiles API', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      query: jest.fn().mockReturnThis()
    };
    getConnection.mockResolvedValue(mockDb);
  });

  describe('POST /profiles', () => {
    it('should create a profile', async () => {
      mockDb.query.mockResolvedValueOnce({ recordset: [] });
      mockDb.execute.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .post('/profiles')
        .set('Authorization', 'Bearer validtoken')
        .send({
          age: 30,
          gender: 'male',
          height_cm: 180,
          weight_kg: 80
        });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('GET /profiles', () => {
    it('should return user profile', async () => {
      mockDb.execute.mockResolvedValueOnce({
        recordset: [{
          userId: 1,
          age: 30,
          gender: 'male',
          height_cm: 180,
          weight_kg: 80
        }]
      });

      const res = await request(app)
        .get('/profiles')
        .set('Authorization', 'Bearer validtoken');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userId', 1);
    });
  });
});