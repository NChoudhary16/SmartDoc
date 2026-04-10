const jwt = require('jsonwebtoken');

// Secret for mock auth - in production use env var!
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-rbac-key';

// Mock users store (Since we don't have DB for this yet)
const mockUsers = {
  admin: { id: 1, name: 'System Admin', username: 'admin', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin' },
  startup: { id: 2, name: 'Aarav Sharma', username: 'startup', role: 'startup', avatar: 'https://i.pravatar.cc/150?u=startup' },
  mentor: { id: 3, name: 'Priya Menon', username: 'mentor', role: 'mentor', avatar: 'https://i.pravatar.cc/150?u=mentor' },
  employee: { id: 4, name: 'John Doe', username: 'john.doe', role: 'startup', avatar: 'https://i.pravatar.cc/150?u=john' },
  guest: { id: 5, name: 'Guest User', username: 'guest', role: 'guest', avatar: 'https://i.pravatar.cc/150?u=guest' }
};

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: You do not have the required permissions' 
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET,
  mockUsers
};
