import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PieChart, Tags, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budgets',      icon: PieChart,        label: 'Budgets' },
  { to: '/categories',   icon: Tags,            label: 'Categories' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'var(--primary)', borderRadius: 8, padding: '6px', display:'flex' }}>
              <TrendingUp size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>FinTrack</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                transition: 'all 0.15s',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: isActive ? 'var(--primary-light)' : 'var(--text-soft)',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
