const jwt = require('jsonwebtoken');

// bcryptjs is optional - plain text comparison used as fallback
let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch { /* not installed yet */ }

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-rbac-key';
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// In-memory user store
// Key: username (lowercase), Value: { id, name, username, role, passwordHash, avatar }
// ---------------------------------------------------------------------------
const userStore = new Map();

function _hashPasswordSync(plain) {
  if (!bcrypt) return plain;          // plain-text fallback
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

function _verifyPasswordSync(plain, hash) {
  if (!bcrypt) return plain === hash; // plain-text fallback
  if (!String(hash).startsWith('$2')) return plain === hash; // already plain
  return bcrypt.compareSync(plain, hash);
}

// Seed default accounts synchronously so the store is ready immediately
const _defaults = [
  { id: 1, name: 'System Admin',  username: 'admin',   role: 'admin',   password: 'admin123',    avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 2, name: 'Aarav Sharma',  username: 'startup', role: 'startup', password: 'password123', avatar: 'https://i.pravatar.cc/150?u=startup' },
  { id: 3, name: 'Priya Menon',   username: 'mentor',  role: 'mentor',  password: 'password123', avatar: 'https://i.pravatar.cc/150?u=mentor' },
  { id: 4, name: 'Guest User',    username: 'guest',   role: 'guest',   password: 'guest',       avatar: 'https://i.pravatar.cc/150?u=guest' },
];

for (const u of _defaults) {
  userStore.set(u.username, {
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    passwordHash: _hashPasswordSync(u.password),
    avatar: u.avatar
  });
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------
const findUser = (username) => userStore.get(String(username).toLowerCase()) || null;

const createUser = ({ name, username, password, role, avatar }) => {
  const key = String(username).toLowerCase();
  if (userStore.has(key)) return { error: 'Username already taken' };

  const allowedRoles = ['startup', 'mentor', 'guest'];
  if (!allowedRoles.includes(role)) return { error: 'Invalid role for registration' };

  const passwordHash = _hashPasswordSync(password);
  const id = Date.now();
  const avatarUrl = avatar || `https://i.pravatar.cc/150?u=${key}`;
  const record = { id, name, username: key, role, passwordHash, avatar: avatarUrl };
  userStore.set(key, record);
  return { user: record };
};

const verifyPassword = (plain, hash) => _verifyPasswordSync(plain, hash);

// Public user shape (no passwordHash)
const publicUser = (record) => ({
  id: record.id,
  name: record.name,
  username: record.username,
  role: record.role,
  avatar: record.avatar
});

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have the required permissions' });
    }
    next();
  };
};

// backward-compat shim
const mockUsers = {
  get admin()   { return findUser('admin');   },
  get startup() { return findUser('startup'); },
  get mentor()  { return findUser('mentor');  },
  get guest()   { return findUser('guest');   },
};

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET,
  mockUsers,
  findUser,
  createUser,
  verifyPassword,
  publicUser,
};
