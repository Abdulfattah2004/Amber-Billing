import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Zap, Users, UserPlus, BarChart3, Settings, LogOut, Menu, X, Receipt, Fuel, UsersRound, Wallet } from 'lucide-react';

const allNavItems = [
  { path: '/', icon: Users, labelKey: 'nav.dashboard', roles: ['admin', 'employee'] },
  { path: '/add-customer', icon: UserPlus, labelKey: 'nav.addCustomer', roles: ['admin'] },
  { path: '/receipts', icon: Receipt, labelKey: 'nav.receipts', roles: ['admin', 'employee'] },
  { path: '/diesel', icon: Fuel, labelKey: 'nav.diesel', roles: ['admin'] },
  { path: '/employees', icon: UsersRound, labelKey: 'nav.employees', roles: ['admin'] },
  { path: '/expenses', icon: Wallet, labelKey: 'nav.expenses', roles: ['admin'] },
  { path: '/reports', icon: BarChart3, labelKey: 'nav.reports', roles: ['admin'] },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings', roles: ['admin'] },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:relative lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold">{t('nav.amberSystem')}</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
              end={item.path === '/'}
            >
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="px-3 py-1 mb-1 text-xs text-sidebar-muted">
            {user?.username} · {t(`settings.${user?.role || 'employee'}`)}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b bg-card px-4 lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden me-3 rounded-lg p-2 hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {navItems.find(n => n.path === location.pathname)
              ? t(navItems.find(n => n.path === location.pathname)!.labelKey)
              : ''}
          </h2>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
