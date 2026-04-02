import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Route, Fuel, BarChart3,
  Settings, Menu, X, ChevronRight, Activity, TrendingUp, LogOut, CheckCircle, Layers, Wallet, History
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';

const NAV_DRIVER = [
  { to: '/', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/trips', icon: Route, label: 'My Trips' },
  { to: '/history', icon: History, label: 'Trips History' },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useStore();

  const navItems = NAV_DRIVER;
  const currentPage = navItems.find(n => n.to === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-950 border-r border-surface-800 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-xl text-white tracking-widest">GANESH</div>
              <div className="text-[10px] text-brand-400 font-mono uppercase tracking-[0.2em] -mt-1">CARTING</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-75 group border',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border-brand-500/20'
                  : 'border-transparent text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-surface-800 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <div className="text-sm font-medium text-white">{user?.name || 'Admin'}</div>
              <div className="text-xs text-surface-500">{user?.email || 'admin@demo.com'}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-surface-950/80 backdrop-blur-sm border-b border-surface-800 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden text-surface-400 hover:text-white p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            <h1 className="font-semibold text-white text-sm">{currentPage}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-surface-500 font-mono">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
