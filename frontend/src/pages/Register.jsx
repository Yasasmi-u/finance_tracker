import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await register(form.name, form.email, form.password); }
    catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ background:'var(--primary)', borderRadius:16, padding:14, display:'inline-flex', marginBottom:'1rem' }}>
            <TrendingUp size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:700 }}>Create account</h1>
          <p style={{ color:'var(--text-muted)', marginTop:4 }}>Start tracking your finances</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" placeholder="John Doe" value={form.name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" placeholder="At least 6 characters" value={form.password} onChange={handle} minLength={6} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', marginTop:4, padding:'0.75rem' }}>
              {loading ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--primary-light)', textDecoration:'none', fontWeight:500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
