import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package, ShoppingCart, Warehouse, FileText, Users, Truck, Lock, Clock, ListTodo, Bell, Wallet } from 'lucide-react';

const pageIcons: Record<string, React.FC<{ className?: string }>> = {
  products: Package,
  sales: ShoppingCart,
  purchases: ShoppingCart,
  inventory: Warehouse,
  reports: FileText,
  customers: Users,
  suppliers: Truck,
  attendance: Clock,
  tasks: ListTodo,
  notifications: Bell,
  salaries: Wallet,
};

const EmployeeDashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setProfile(data));

    supabase
      .from('employee_permissions')
      .select('page_key')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setPermissions(data?.map(d => d.page_key) || []);
      });
  }, [user]);

  const allPages = [
    { key: 'products', label: t('nav.products') },
    { key: 'sales', label: t('nav.sales') },
    { key: 'purchases', label: t('nav.purchases') },
    { key: 'inventory', label: t('nav.inventory') },
    { key: 'reports', label: t('nav.reports') },
    { key: 'customers', label: t('nav.customers') },
    { key: 'suppliers', label: t('nav.suppliers') },
    { key: 'attendance', label: t('nav.attendance') },
    { key: 'tasks', label: t('nav.tasks') },
    { key: 'notifications', label: t('nav.notifications') },
    { key: 'salaries', label: t('nav.salaries') },
  ];

  const defaultKeys = ['attendance', 'tasks', 'notifications', 'salaries'];
  const allowedPages = allPages.filter(p => permissions.includes(p.key) || defaultKeys.includes(p.key));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground font-cairo">
        {t('employee.welcome')}{profile?.name ? `, ${profile.name}` : ''}
      </h1>

      {allowedPages.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-cairo text-lg">{t('employee.noPermissions')}</p>
          <p className="text-muted-foreground/70 text-sm mt-2">{t('employee.contactAdmin')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allowedPages.map(page => {
            const Icon = pageIcons[page.key] || Package;
            return (
              <a key={page.key} href={`/employee/${page.key}`}>
                <Card className="p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground font-cairo">{page.label}</h3>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboardPage;
