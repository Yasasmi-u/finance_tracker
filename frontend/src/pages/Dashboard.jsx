import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import api from '../api/client';
import { format } from 'date-fns';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function SummaryCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
          <div style={{ fontSize:'1.75rem', fontWeight:700, marginTop:'0.25rem', color }}>{value}</div>
          {sub && <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
        </div>
        <div style={{ background:`${color}22`, borderRadius:10, padding:10, display:'flex' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:13 };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:'4rem' }}><div className="spinner" style={{ width:36,height:36 }} /></div>;
  if (!data) return null;

  const { summary, recent_transactions, charts } = data;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your financial overview for this month</p>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        <SummaryCard label="Total Balance"   value={fmt(summary.balance)}          icon={Wallet}      color="#6366f1" />
        <SummaryCard label="Monthly Income"  value={fmt(summary.monthly_income)}   icon={TrendingUp}  color="#10b981" />
        <SummaryCard label="Monthly Expenses" value={fmt(summary.monthly_expense)} icon={TrendingDown} color="#ef4444" />
        <SummaryCard
          label="Budget Usage"
          value={`${summary.budget_usage_percent}%`}
          icon={Target}
          color={summary.budget_usage_percent >= 100 ? '#ef4444' : summary.budget_usage_percent >= 80 ? '#f59e0b' : '#10b981'}
          sub={`${fmt(summary.total_spent_in_budget)} of ${fmt(summary.total_budgeted)}`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid-2" style={{ marginBottom:'1.5rem' }}>
        {/* Expense by category pie */}
        <div className="card">
          <h3 style={{ fontSize:'0.95rem', fontWeight:600, marginBottom:'1.25rem' }}>Expenses by Category</h3>
          {charts.expense_by_category.length === 0
            ? <div className="empty-state" style={{ padding:'2rem' }}><p style={{fontSize:'0.85rem'}}>No expense data this month</p></div>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={charts.expense_by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                    {charts.expense_by_category.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(v)} />
                  <Legend formatter={(v) => <span style={{fontSize:12,color:'var(--text-soft)'}}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Monthly trends bar */}
        <div className="card">
          <h3 style={{ fontSize:'0.95rem', fontWeight:600, marginBottom:'1.25rem' }}>Income vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.monthly_trends} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(v)} />
              <Legend formatter={(v) => <span style={{fontSize:12,color:'var(--text-soft)',textTransform:'capitalize'}}>{v}</span>} />
              <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget vs actual + recent transactions */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize:'0.95rem', fontWeight:600, marginBottom:'1.25rem' }}>Budget vs Actual</h3>
          {charts.budget_vs_actual.length === 0
            ? <div className="empty-state" style={{ padding:'2rem' }}><p style={{fontSize:'0.85rem'}}>No budgets set</p></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.budget_vs_actual} layout="vertical" barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(v)} />
                  <Bar dataKey="budget" name="Budget" fill="#6366f1" radius={[0,4,4,0]} />
                  <Bar dataKey="actual" name="Actual" fill="#ef4444" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h3 style={{ fontSize:'0.95rem', fontWeight:600, marginBottom:'1.25rem' }}>Recent Transactions</h3>
          {recent_transactions.length === 0
            ? <div className="empty-state" style={{ padding:'2rem' }}><p style={{fontSize:'0.85rem'}}>No transactions yet</p></div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {recent_transactions.map(tx => (
                  <div key={tx.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{ background: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius:8, padding:'6px', display:'flex' }}>
                        {tx.type === 'income' ? <ArrowUpRight size={16} color="#10b981" /> : <ArrowDownRight size={16} color="#ef4444" />}
                      </div>
                      <div>
                        <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{tx.title}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{tx.category_name || 'Uncategorized'} · {format(new Date(tx.date), 'MMM d')}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight:600, color: tx.type === 'income' ? '#10b981' : '#ef4444', fontSize:'0.9rem' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
