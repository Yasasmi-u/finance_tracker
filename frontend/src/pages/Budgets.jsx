import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../api/client';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n);

export default function Budgets() {
  const [budgets, setBudgets]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ category_id:'', amount:'' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([api.get('/budgets'), api.get('/categories')]);
    setBudgets(bRes.data);
    setCategories(cRes.data.filter(c => c.type === 'expense'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm({ category_id:'', amount:'' }); setError(''); setModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ category_id: b.category_id, amount: b.amount }); setError(''); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/budgets/${editing.id}`, { amount: Number(form.amount) });
      else         await api.post('/budgets', { category_id: form.category_id, amount: Number(form.amount) });
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}`); load();
  };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Categories not yet budgeted (for add form)
  const usedCatIds = budgets.map(b => b.category_id);
  const availableCats = categories.filter(c => !usedCatIds.includes(c.id));

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Monthly spending limits by category</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} disabled={availableCats.length === 0}>
          <Plus size={16} /> Add Budget
        </button>
      </div>

      {loading
        ? <div style={{ display:'flex', justifyContent:'center', paddingTop:'3rem' }}><div className="spinner" style={{width:36,height:36}} /></div>
        : budgets.length === 0
          ? (
            <div className="card">
              <div className="empty-state">
                <CheckCircle size={40} />
                <p>No budgets set yet</p>
                <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Create first budget</button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {budgets.map(b => {
                const pct = Math.min(b.percentage, 100);
                const over = b.percentage >= 100;
                const warn = b.percentage >= 80 && !over;
                const color = over ? '#ef4444' : warn ? '#f59e0b' : '#10b981';

                return (
                  <div key={b.id} className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <span style={{ width:12, height:12, borderRadius:'50%', background:b.category_color, display:'inline-block', flexShrink:0 }} />
                        <div>
                          <div style={{ fontWeight:600 }}>{b.category_name}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Monthly · {b.period}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        {over && (
                          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', color:'#ef4444', fontWeight:500 }}>
                            <AlertTriangle size={14} /> Over budget!
                          </div>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}><Pencil size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(b.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>

                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem', fontSize:'0.875rem' }}>
                      <span style={{ color:'var(--text-soft)' }}>Spent: <strong style={{ color }}>{fmt(b.spent)}</strong></span>
                      <span style={{ color:'var(--text-muted)' }}>Budget: {fmt(b.amount)}</span>
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${pct}%`, background: color }} />
                    </div>

                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.4rem', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                      <span>{b.percentage}% used</span>
                      <span>Remaining: {fmt(Math.max(0, b.amount - b.spent))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
      }

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Budget' : 'New Budget'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">Expense Category</label>
                  <select className="form-select" name="category_id" value={form.category_id} onChange={handle} required>
                    <option value="">Select category</option>
                    {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {editing && (
                <div style={{ padding:'0.75rem', background:'var(--bg)', borderRadius:'var(--radius-sm)', fontSize:'0.9rem' }}>
                  Category: <strong>{editing.category_name}</strong>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Monthly Budget ($)</label>
                <input className="form-input" name="amount" type="number" min="1" step="1" placeholder="500" value={form.amount} onChange={handle} required />
              </div>
              <div className="modal-footer" style={{ margin:0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : editing ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
