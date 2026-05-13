import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import api from '../api/client';

const COLORS = ['#6366f1','#10b981','#ef4444','#f59e0b','#3b82f6','#ec4899','#06b6d4','#8b5cf6','#f97316','#14b8a6','#94a3b8'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState({ name:'', type:'expense', color: COLORS[0] });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/categories');
    setCategories(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm({ name:'', type:'expense', color: COLORS[0] }); setError(''); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name:c.name, type:c.type, color:c.color }); setError(''); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/categories/${editing.id}`, { name: form.name, color: form.color });
      else         await api.post('/categories', form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category? Transactions using it will be uncategorized.')) return;
    await api.delete(`/categories/${id}`); load();
  };

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const income  = categories.filter(c => c.type === 'income');
  const expense = categories.filter(c => c.type === 'expense');

  const CatGroup = ({ title, items, badge }) => (
    <div className="card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <h3 style={{ fontWeight:600 }}>{title}</h3>
        <span className={`badge badge-${badge}`}>{items.length}</span>
      </div>
      {items.length === 0
        ? <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', padding:'1rem 0' }}>No {title.toLowerCase()} categories</div>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {items.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 0.75rem', borderRadius:'var(--radius-sm)', background:'var(--bg)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:c.color, display:'inline-block' }} />
                  <span style={{ fontSize:'0.9rem', fontWeight:500 }}>{c.name}</span>
                </div>
                <div style={{ display:'flex', gap:'0.4rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your income and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Category</button>
      </div>

      {loading
        ? <div style={{ display:'flex', justifyContent:'center', paddingTop:'3rem' }}><div className="spinner" style={{width:36,height:36}} /></div>
        : <div className="grid-2">
            <CatGroup title="Income Categories"  items={income}  badge="income" />
            <CatGroup title="Expense Categories" items={expense} badge="expense" />
          </div>
      }

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Category' : 'New Category'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" name="name" placeholder="e.g. Groceries" value={form.name} onChange={handle} required />
              </div>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    {['income','expense'].map(t => (
                      <button key={t} type="button"
                        className={`btn ${form.type === t ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex:1, justifyContent:'center', textTransform:'capitalize' }}
                        onClick={() => setForm(f => ({ ...f, type:t }))}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {COLORS.map(col => (
                    <button key={col} type="button"
                      style={{ width:28, height:28, borderRadius:'50%', background:col, border: form.color===col ? '3px solid white' : '3px solid transparent', cursor:'pointer', outline: form.color===col ? `2px solid ${col}` : 'none' }}
                      onClick={() => setForm(f => ({ ...f, color:col }))} />
                  ))}
                </div>
              </div>
              <div className="modal-footer" style={{ margin:0 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : editing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
