const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const userProfilesRouter = require('../routes/userProfiles');
const { getConnection, sql } = require('../config');

// Mock auth middleware and database
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { userId: 1 }; // Mock authenticated user
  next();
});
jest.mock('../config');
jest.mock('bcryptjs');

const app = express();
app.use(express.json());
app.use('/profiles', userProfilesRouter);

describe('User Profiles API', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      request: jest.fn().mockReturnThis(),
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      execute: jest.fn()
    };
    getConnection.mockResolvedValue(mockDb);
    bcrypt.hash.mockResolvedValue('hashed_password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  describe('PUT /profiles/update', () => {
    const updateData = {
      age: 31,
      gender: 'male',
      height: 181,
      weight: 81
    };

    it('should update profile with all fields', async () => {
      mockDb.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .put('/profiles/update')
        .set('Authorization', 'Bearer validtoken')
        .send({
          ...updateData,
          password: 'newpassword'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should update profile without password', async () => {
      mockDb.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .put('/profiles/update')
        .set('Authorization', 'Bearer validtoken')
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should create profile if not exists', async () => {
      // First query returns no affected rows (profile doesn't exist)
      mockDb.query.mockResolvedValueOnce({ rowsAffected: [0] });
      // Second query succeeds for insert
      mockDb.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app)
        .put('/profiles/update')
        .set('Authorization', 'Bearer validtoken')
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .put('/profiles/update')
        .set('Authorization', 'Bearer validtoken')
        .send(updateData);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Server error');
    });

    it('should handle password hashing errors', async () => {
      mockDb.query.mockResolvedValueOnce({ rowsAffected: [1] });
      bcrypt.hash.mockRejectedValueOnce(new Error('Hashing error'));

      const res = await request(app)
        .put('/profiles/update')
        .set('Authorization', 'Bearer validtoken')
        .send({
          ...updateData,
          password: 'newpassword'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });
});