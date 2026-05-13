const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { name: 'Salary',        type: 'income',  color: '#10b981' },
  { name: 'Freelance',     type: 'income',  color: '#06b6d4' },
  { name: 'Investments',   type: 'income',  color: '#8b5cf6' },
  { name: 'Other Income',  type: 'income',  color: '#6366f1' },
  { name: 'Food',          type: 'expense', color: '#f59e0b' },
  { name: 'Transport',     type: 'expense', color: '#3b82f6' },
  { name: 'Rent',          type: 'expense', color: '#ef4444' },
  { name: 'Entertainment', type: 'expense', color: '#ec4899' },
  { name: 'Healthcare',    type: 'expense', color: '#14b8a6' },
  { name: 'Shopping',      type: 'expense', color: '#f97316' },
  { name: 'Other Expense', type: 'expense', color: '#94a3b8' },
];

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const registerUser = db.transaction(() => {
    const { lastInsertRowid: userId } = db
      .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
      .run(name, email.toLowerCase(), hashedPassword);

    const insertCategory = db.prepare(
      'INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)'
    );
    for (const cat of DEFAULT_CATEGORIES) {
      insertCategory.run(userId, cat.name, cat.type, cat.color);
    }
    return userId;
  });

  const userId = registerUser();
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(userId);
  const token = generateToken(userId);

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
    .get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
