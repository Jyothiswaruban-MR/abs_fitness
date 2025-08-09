const jwt = require('jsonwebtoken');
const JWT_SECRET = "b3f1a9d7c4e8f12a6b7d9e3f5c1a2b4d";

function getTestToken() {
  const payload = { 
    id: 1, 
    username: 'testuser',
    role: 'user' // Add any required claims
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}
module.exports = getTestToken;
