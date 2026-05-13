import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n);
const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = { title:'', amount:'', category_id:'', type:'expense', date: today(), note:'' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [filters, setFilters]           = useState({ startDate:'', endDate:'', categoryId:'', type:'' });

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.startDate)  params.startDate  = filters.startDate;
    if (filters.endDate)    params.endDate    = filters.endDate;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.type)       params.type       = filters.type;
    const [txRes, catRes] = await Promise.all([
      api.get('/transactions', { params }),
      api.get('/categories'),
    ]);
    setTransactions(txRes.data);
    setCategories(catRes.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true); };
  const openEdit = (tx) => {
    setEditing(tx);
    setForm({ title:tx.title, amount:tx.amount, category_id:tx.category_id||'', type:tx.type, date:tx.date, note:tx.note||'' });
    setError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, amount: Number(form.amount), category_id: form.category_id || null };
      if (editing) await api.put(`/transactions/${editing.id}`, payload);
      else         await api.post('/transactions', payload);
      setModal(false);
      loadData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    loadData();
  };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setFilter = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const filteredCats = categories.filter(c => !form.type || c.type === form.type);

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Transaction</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem', color:'var(--text-muted)', fontSize:'0.85rem', fontWeight:600 }}>
          <SlidersHorizontal size={14} /> Filters
        </div>
        <div className="filter-bar" style={{ margin:0 }}>
          <div className="form-group">
            <label className="form-label">From</label>
            <input className="form-input" type="date" name="startDate" value={filters.startDate} onChange={setFilter} />
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <input className="form-input" type="date" name="endDate" value={filters.endDate} onChange={setFilter} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" name="categoryId" value={filters.categoryId} onChange={setFilter}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" name="type" value={filters.type} onChange={setFilter}>
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          {(filters.startDate || filters.endDate || filters.categoryId || filters.type) && (
            <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-end' }}
              onClick={() => setFilters({ startDate:'', endDate:'', categoryId:'', type:'' })}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <ArrowUpRight size={40} />
            <p>No transactions found</p>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> Add your first</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th style={{ textAlign:'right' }}>Amount</th>
                  <th style={{ textAlign:'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ fontWeight:500 }}>{tx.title}</div>
                      {tx.note && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{tx.note}</div>}
                    </td>
                    <td>
                      {tx.category_name
                        ? <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.8rem' }}>
                            <span style={{ width:8, height:8, borderRadius:'50%', background: tx.category_color, display:'inline-block' }} />
                            {tx.category_name}
                          </span>
                        : <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>—</span>
                      }
                    </td>
                    <td style={{ color:'var(--text-soft)', fontSize:'0.85rem' }}>{format(new Date(tx.date), 'MMM d, yyyy')}</td>
                    <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                    <td style={{ textAlign:'right', fontWeight:600, color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                    <td>
                      <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)}><Pencil size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(tx.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Transaction' : 'New Transaction'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  {['income','expense'].map(t => (
                    <button key={t} type="button"
                      className={`btn ${form.type === t ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ flex:1, justifyContent:'center', textTransform:'capitalize' }}
                      onClick={() => setForm(f => ({ ...f, type:t, category_id:'' }))}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" name="title" placeholder="e.g. Monthly salary" value={form.title} onChange={handle} required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input className="form-input" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" name="date" type="date" value={form.date} onChange={handle} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" name="category_id" value={form.category_id} onChange={handle}>
                  <option value="">No category</option>
                  {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <textarea className="form-textarea" name="note" placeholder="Any additional details..." value={form.note} onChange={handle} rows={2} />
              </div>
              <div className="modal-footer" style={{ margin:0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : editing ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
