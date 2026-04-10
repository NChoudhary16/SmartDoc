const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET, mockUsers, requireAuth } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Validates role/username and returns a JWT
 */
router.post('/login', (req, res) => {
  const { username, role } = req.body;
  
  let user = null;

  // Simple mock login logic
  if (role === 'guest') {
    user = mockUsers.guest;
  } else if (role === 'startup') {
    user = mockUsers.startup;
  } else if (role === 'mentor') {
    user = mockUsers.mentor;
  } else if (username && mockUsers[username]) {
     user = mockUsers[username];
  } else {
      // Lookup by mapping generic usernames to roles for demo
      const userKey = Object.keys(mockUsers).find((k) =>
        k === username ||
        (username === 'admin' && k === 'admin') ||
        (username === 'john.doe' && k === 'employee') ||
        (username === 'startup' && k === 'startup') ||
        (username === 'mentor' && k === 'mentor')
      );
      if(userKey) user = mockUsers[userKey]
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name, avatar: user.avatar },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    user,
    token
  });
});

/**
 * GET /api/auth/me
 * Returns current user from token
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
