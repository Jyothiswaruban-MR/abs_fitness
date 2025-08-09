const { jest } = require('@jest/globals');

const mockDb = {
  execute: jest.fn().mockImplementation((procName, params) => {
    // Default successful response
    return Promise.resolve({ rowsAffected: 1, recordset: [] });
  }),
  query: jest.fn().mockImplementation((query, params) => {
    // Default successful response
    return Promise.resolve({ recordset: [{}] });
  })
};

module.exports = mockDb;