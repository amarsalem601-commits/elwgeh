import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NavLink, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard, Package, ShoppingCart, ShoppingBag,
  Warehouse, FileText, LogOut, Sun, Moon, Globe,
  Menu, Users, Truck, Clock, ListTodo, Bell, Wallet, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/el-wageh-brand.png';
import { useLiveLocation } from '@/hooks/useLiveLocation';

const pageIconMap: Record<string, React.FC<{ className?: string }>> = {
  products: Package,
  sales: ShoppingCart,
  purchases: ShoppingBag,
  inventory: Warehouse,
  reports: FileText,
  customers: Users,
  suppliers: Truck,
  attendance: Clock,
  tasks: ListTodo,
  notifications: Bell,
  salaries: Wallet,
};

const EmployeeLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, lang, setLang, isRTL } = useLanguage();
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const location = useLocation();
  useLiveLocation();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('employee_permissions')
      .select('page_key')
      .eq('user_id', user.id)
      .then(({ data }) => setPermissions(data?.map(d => d.page_key) || []));
  }, [user]);

  // Default sections every employee always sees
  const defaultPages = ['attendance', 'tasks', 'notifications', 'salaries'];
  const allowedPages = permissions.filter(page =>
    Object.prototype.hasOwnProperty.call(pageIconMap, page)
  );
  const allPages = Array.from(new Set([...defaultPages, ...allowedPages]));

  const navItems = [
    { key: 'nav.dashboard', path: '/employee-dashboard', icon: LayoutDashboard },
    ...allPages.map(p => ({
      key: `nav.${p}`,
      path: `/employee/${p}`,
      icon: pageIconMap[p] || Package,
    })),
    { key: 'nav.profile', path: '/employee/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 z-40 w-64 gradient-sidebar flex flex-col transition-transform duration-300 shadow-2xl lg:shadow-none
        ${isRTL ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-1.5 shadow-lg">
              <img src={logo} alt="El Wageh" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="font-cairo text-sm font-black text-white">الوجيه</p>
              <p className="text-[10px] text-slate-400">نظام إدارة الموظفين</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-cairo transition-all
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-red-950/20'
                    : 'text-slate-300 hover:bg-white/7 hover:text-white'
                  }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? '' : 'opacity-75'}`} />
                {t(item.key)}
                {isActive && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-white" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-cairo text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 glass-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-bold font-cairo text-foreground">{t('employee.dashboard')}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="rounded-xl gap-1 text-xs">
              <Globe className="h-4 w-4" /> {t('language')}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>

        <footer className="h-10 border-t border-border flex items-center justify-center px-4 shrink-0">
          <p className="text-xs font-cairo text-muted-foreground">© 2026 الوجيه لمنظمات الهواء</p>
        </footer>
      </div>
    </div>
  );
};

export default EmployeeLayout;
