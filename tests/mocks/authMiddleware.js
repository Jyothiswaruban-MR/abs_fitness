module.exports = (req, res, next) => {
  req.user = { id: 1, username: 'testuser' }; // Mock user object
  next();
};