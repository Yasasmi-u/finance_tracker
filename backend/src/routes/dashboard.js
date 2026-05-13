const express = require('express');
const db = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard
router.get('/', (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Monthly summary
  const monthlySummary = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)  AS monthly_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthly_expense
      FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ?
    `)
    .get(userId, startOfMonth, endOfMonth);

  // All-time balance
  const allTime = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)  AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM transactions WHERE user_id = ?
    `)
    .get(userId);
  const balance = allTime.total_income - allTime.total_expense;

  // Budget usage this month
  const budgets = db
    .prepare('SELECT b.*, c.name FROM budgets b JOIN categories c ON b.category_id = c.id WHERE b.user_id = ?')
    .all(userId);
  let totalBudgeted = 0, totalSpentInBudget = 0;
  budgets.forEach((b) => {
    const { spent } = db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
        WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ? AND date <= ?
      `)
      .get(userId, b.category_id, startOfMonth, endOfMonth);
    totalBudgeted += b.amount;
    totalSpentInBudget += spent;
  });
  const budgetUsagePercent = totalBudgeted > 0
    ? Math.round((totalSpentInBudget / totalBudgeted) * 100)
    : 0;

  // Recent 5 transactions
  const recentTransactions = db
    .prepare(`
      SELECT t.*, c.name AS category_name, c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 5
    `)
    .all(userId);

  // Expense by category (this month)
  const expenseByCategory = db
    .prepare(`
      SELECT c.name AS category, c.color, SUM(t.amount) AS total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY t.category_id
      ORDER BY total DESC
    `)
    .all(userId, startOfMonth, endOfMonth);

  // Monthly income vs expense (last 6 months)
  const monthlyTrends = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const row = db
      .prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)  AS income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expense
        FROM transactions WHERE user_id = ? AND date >= ? AND date <= ?
      `)
      .get(userId, start, end);
    monthlyTrends.push({ month: label, income: row.income, expense: row.expense });
  }

  // Budget vs actual (this month)
  const budgetVsActual = budgets.map((b) => {
    const { spent } = db
      .prepare(`
        SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
        WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ? AND date <= ?
      `)
      .get(userId, b.category_id, startOfMonth, endOfMonth);
    return { category: b.name, budget: b.amount, actual: spent };
  });

  res.json({
    summary: {
      monthly_income: monthlySummary.monthly_income,
      monthly_expense: monthlySummary.monthly_expense,
      balance,
      budget_usage_percent: budgetUsagePercent,
      total_budgeted: totalBudgeted,
      total_spent_in_budget: totalSpentInBudget,
    },
    recent_transactions: recentTransactions,
    charts: {
      expense_by_category: expenseByCategory,
      monthly_trends: monthlyTrends,
      budget_vs_actual: budgetVsActual,
    },
  });
});

module.exports = router;
