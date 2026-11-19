import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, ShoppingBag,
  Warehouse, FileText, LogOut, Sun, Moon, Globe,
  Users, Truck, Settings, UserCheck, Clock,
  MapPin, DollarSign, Wallet, ListTodo, Bell, Wrench,
  BookOpen, ArrowRightLeft, Receipt, User, Database, UsersRound, Menu, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/el-wageh-logo.jpeg';

const navItems = [
  { key: 'nav.invoices', path: '/invoices', icon: Receipt, color: 'bg-blue-500' },
  { key: 'nav.products', path: '/products', icon: Package, color: 'bg-emerald-500' },
  { key: 'nav.sales', path: '/sales', icon: ShoppingCart, color: 'bg-violet-500' },
  { key: 'nav.purchases', path: '/purchases', icon: ShoppingBag, color: 'bg-pink-500' },
  { key: 'nav.inventory', path: '/inventory', icon: Warehouse, color: 'bg-cyan-500' },
  { key: 'nav.warehouses', path: '/warehouses', icon: ArrowRightLeft, color: 'bg-orange-500' },
  { key: 'nav.customers', path: '/customers', icon: Users, color: 'bg-teal-500' },
  { key: 'nav.suppliers', path: '/suppliers', icon: Truck, color: 'bg-indigo-500' },
  { key: 'nav.crm', path: '/crm', icon: Users, color: 'bg-rose-500' },
  { key: 'nav.accounting', path: '/accounting', icon: BookOpen, color: 'bg-lime-600' },
  { key: 'nav.attendance', path: '/attendance', icon: Clock, color: 'bg-sky-500' },
  { key: 'nav.location', path: '/location-tracking', icon: MapPin, color: 'bg-red-600' },
  { key: 'nav.expenses', path: '/expenses', icon: DollarSign, color: 'bg-yellow-600' },
  { key: 'nav.salaries', path: '/salaries', icon: Wallet, color: 'bg-green-600' },
  { key: 'nav.tasks', path: '/tasks', icon: ListTodo, color: 'bg-purple-500' },
  { key: 'nav.notifications', path: '/notifications', icon: Bell, color: 'bg-fuchsia-500' },
  { key: 'nav.bookings', path: '/repairs', icon: Wrench, color: 'bg-stone-600' },
  { key: 'nav.repairDesign', path: '/repair-design', icon: Settings, color: 'bg-amber-600' },
  { key: 'nav.reports', path: '/reports', icon: FileText, color: 'bg-slate-500' },
  { key: 'nav.employees', path: '/employees', icon: UserCheck, color: 'bg-blue-700' },
  { key: 'nav.database', path: '/database', icon: Database, color: 'bg-zinc-700' },
  { key: 'nav.profileManagement', path: '/profile-management', icon: UsersRound, color: 'bg-pink-600' },
  { key: 'nav.team', path: '/team-management', icon: UsersRound, color: 'bg-violet-600' },
  { key: 'nav.profile', path: '/profile', icon: User, color: 'bg-emerald-700' },
  { key: 'nav.settings', path: '/settings', icon: Settings, color: 'bg-gray-500' },
];

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, lang, setLang, isRTL } = useLanguage();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAssistantPage = location.pathname === '/assistant';
  const visibleNavItems = isAssistantPage
    ? []
    : navItems;

  return (
    <div className="h-screen flex overflow-hidden bg-background" translate="no">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 z-40 h-screen w-64 shrink-0 gradient-sidebar flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none
        ${isRTL ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="p-5 border-b border-white/10">
          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className="flex items-center gap-3 w-full text-start"
          >
            <div className="rounded-xl bg-white p-1.5 shadow-lg shrink-0">
              <img src={logo} alt="El Wageh" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <p className="font-cairo text-sm font-black text-white">الوجيه</p>
              <p className="text-[10px] text-slate-400">ERP — نظام الإدارة</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 min-h-0 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium font-cairo transition-all text-start
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-red-950/20'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'opacity-75'}`} />
                {t(item.key)}
                {isActive && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              navigate('/assistant');
              setSidebarOpen(false);
            }}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-cairo transition-colors ${
              location.pathname === '/assistant'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {t('nav.aiAssistant')}
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/dashboard');
              setSidebarOpen(false);
            }}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-cairo transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            {t('nav.adminDashboard')}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 h-screen overflow-hidden">
        <header className="h-14 glass-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-bold font-cairo text-primary">الوجيه — ERP</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="rounded-xl gap-1 text-xs"
            >
              <Globe className="h-4 w-4" /> {t('language')}
            </Button>
          </div>
        </header>

        <main className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>

        <footer className="h-10 border-t border-border flex items-center justify-center px-4 shrink-0">
          <p className="text-xs font-cairo text-muted-foreground">© 2026 الوجيه لمنظمات الهواء</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
