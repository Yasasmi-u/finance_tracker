const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function getBudgetsWithProgress(userId) {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().slice(0, 10);

  const budgets = db
    .prepare(`
      SELECT b.*, c.name AS category_name, c.color AS category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY c.name
    `)
    .all(userId);

  return budgets.map((budget) => {
    const result = db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) AS spent
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND type = 'expense'
          AND date >= ? AND date <= ?
      `)
      .get(userId, budget.category_id, startOfMonth, endOfMonth);

    const spent = result.spent;
    const percentage = Math.round((spent / budget.amount) * 100);
    return { ...budget, spent, percentage };
  });
}

// GET /api/budgets
router.get('/', (req, res) => {
  res.json(getBudgetsWithProgress(req.userId));
});

// POST /api/budgets
router.post('/', (req, res) => {
  const { category_id, amount, period = 'monthly' } = req.body;
  if (!category_id || !amount)
    return res.status(400).json({ error: 'Category and amount are required' });
  if (Number(amount) <= 0)
    return res.status(400).json({ error: 'Amount must be positive' });

  const category = db
    .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
    .get(category_id, req.userId);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const existing = db
    .prepare('SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND period = ?')
    .get(req.userId, category_id, period);
  if (existing)
    return res.status(409).json({ error: 'Budget for this category already exists' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO budgets (user_id, category_id, amount, period) VALUES (?, ?, ?, ?)')
    .run(req.userId, category_id, Number(amount), period);

  const budgets = getBudgetsWithProgress(req.userId);
  const created = budgets.find((b) => b.id === lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/budgets/:id
router.put('/:id', (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount is required' });
  if (Number(amount) <= 0)
    return res.status(400).json({ error: 'Amount must be positive' });

  const existing = db
    .prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Budget not found' });

  db.prepare('UPDATE budgets SET amount = ? WHERE id = ?').run(Number(amount), req.params.id);

  const budgets = getBudgetsWithProgress(req.userId);
  res.json(budgets.find((b) => b.id === Number(req.params.id)));
});

// DELETE /api/budgets/:id
router.delete('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Budget not found' });

  db.prepare('DELETE FROM budgets WHERE id = ?').run(req.params.id);
  res.json({ message: 'Budget deleted' });
});

module.exports = router;
