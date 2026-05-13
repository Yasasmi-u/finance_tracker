const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/categories
router.get('/', (req, res) => {
  const categories = db
    .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type, name')
    .all(req.userId);
  res.json(categories);
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
  if (!['income', 'expense'].includes(type))
    return res.status(400).json({ error: 'Type must be income or expense' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO categories (user_id, name, type, color) VALUES (?, ?, ?, ?)')
    .run(req.userId, name.trim(), type, color || '#6366f1');

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(lastInsertRowid);
  res.status(201).json(category);
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const category = db
    .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(
    name.trim(),
    color || category.color,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const category = db
    .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
