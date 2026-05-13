const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/transactions?startDate=&endDate=&categoryId=&type=
router.get('/', (req, res) => {
  const { startDate, endDate, categoryId, type } = req.query;

  let query = `
    SELECT t.*, c.name AS category_name, c.color AS category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [req.userId];

  if (startDate) { query += ' AND t.date >= ?'; params.push(startDate); }
  if (endDate)   { query += ' AND t.date <= ?'; params.push(endDate); }
  if (categoryId){ query += ' AND t.category_id = ?'; params.push(categoryId); }
  if (type)      { query += ' AND t.type = ?'; params.push(type); }

  query += ' ORDER BY t.date DESC, t.created_at DESC';

  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// POST /api/transactions
router.post('/', (req, res) => {
  const { title, amount, category_id, type, date, note } = req.body;
  if (!title || !amount || !type || !date)
    return res.status(400).json({ error: 'Title, amount, type, and date are required' });
  if (!['income', 'expense'].includes(type))
    return res.status(400).json({ error: 'Type must be income or expense' });
  if (Number(amount) <= 0)
    return res.status(400).json({ error: 'Amount must be positive' });

  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO transactions (user_id, category_id, title, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(req.userId, category_id || null, title.trim(), Number(amount), type, date, note || null);

  const transaction = db
    .prepare(`
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `)
    .get(lastInsertRowid);
  res.status(201).json(transaction);
});

// PUT /api/transactions/:id
router.put('/:id', (req, res) => {
  const { title, amount, category_id, type, date, note } = req.body;
  if (!title || !amount || !type || !date)
    return res.status(400).json({ error: 'Title, amount, type, and date are required' });

  const existing = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  db.prepare(
    'UPDATE transactions SET title=?, amount=?, category_id=?, type=?, date=?, note=? WHERE id=?'
  ).run(title.trim(), Number(amount), category_id || null, type, date, note || null, req.params.id);

  const updated = db
    .prepare(`
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `)
    .get(req.params.id);
  res.json(updated);
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Transaction deleted' });
});

module.exports = router;
