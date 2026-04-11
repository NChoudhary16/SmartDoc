const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  JWT_SECRET,
  findUser,
  createUser,
  verifyPassword,
  publicUser,
  requireAuth
} = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Body: { name, username, password, role }
 * role must be 'startup' | 'mentor' | 'guest'
 */
router.post('/register', (req, res) => {
  const { name, username, password, role } = req.body || {};

  if (!name || !username || !password || !role) {
    return res.status(400).json({ success: false, message: 'name, username, password and role are required' });
  }
  if (String(username).length < 3) {
    return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const result = createUser({ name, username: String(username).toLowerCase(), password, role });

  if (result.error) {
    return res.status(409).json({ success: false, message: result.error });
  }

  const pub = publicUser(result.user);
  const token = jwt.sign(
    { id: pub.id, username: pub.username, role: pub.role, name: pub.name, avatar: pub.avatar },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({ success: true, user: pub, token });
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Legacy body: { username, role } still supported for quick demo access
 */
router.post('/login', (req, res) => {
  const { username, password, role } = req.body || {};

  if (!username) {
    return res.status(400).json({ success: false, message: 'username is required' });
  }

  const record = findUser(username);
  if (!record) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  // If a real password is provided, verify it
  if (password) {
    const ok = verifyPassword(password, record.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } else if (role) {
    // Legacy demo path: role must match stored role
    if (record.role !== role && role !== 'guest') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } else {
    return res.status(400).json({ success: false, message: 'password is required' });
  }

  const pub = publicUser(record);
  const token = jwt.sign(
    { id: pub.id, username: pub.username, role: pub.role, name: pub.name, avatar: pub.avatar },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ success: true, user: pub, token });
});

/**
 * GET /api/auth/me
 * Returns current user from token
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
