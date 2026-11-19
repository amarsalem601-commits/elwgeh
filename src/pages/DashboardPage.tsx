import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package, ShoppingCart, TrendingUp, Calculator as CalcIcon, FileText, Users, DollarSign, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Calculator from '@/components/Calculator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [showCalc, setShowCalc] = useState(false);
  const [stats, setStats] = useState({ invoices: 0, revenue: 0, expenses: 0, employees: 0, leads: 0, repairs: 0 });
  const [accountingData, setAccountingData] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      const [inv, acc, exp, emp, leads, repairs] = await Promise.all([
        supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('accounting_entries').select('*').order('entry_date', { ascending: false }),
        supabase.from('expenses').select('amount'),
        supabase.from('profiles').select('id'),
        supabase.from('crm_leads').select('id, status'),
        supabase.from('repair_bookings').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = (acc.data || []).filter(e => e.type === 'income').reduce((s: number, e: any) => s + e.amount, 0);
      const totalExpenses = (exp.data || []).reduce((s: number, e: any) => s + e.amount, 0);

      setStats({
        invoices: (inv.data || []).length,
        revenue: totalRevenue,
        expenses: totalExpenses,
        employees: (emp.data || []).length,
        leads: (leads.data || []).length,
        repairs: (repairs.data || []).length,
      });

      if (inv.data) setRecentInvoices(inv.data);
      if (repairs.data) setRecentRepairs(repairs.data);

      const monthly = (acc.data || []).reduce((m: any, entry: any) => {
        const month = new Date(entry.entry_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
        if (!m[month]) m[month] = { month, income: 0, expense: 0 };
        if (entry.type === 'income') m[month].income += entry.amount;
        else m[month].expense += entry.amount;
        return m;
      }, {});
      setAccountingData(Object.values(monthly));
    };
    fetchDashboard();
  }, [lang]);

  const statCards = [
    { label: lang === 'ar' ? 'الفواتير' : 'Invoices', value: stats.invoices, icon: FileText, color: 'text-primary' },
    { label: lang === 'ar' ? 'الإيرادات' : 'Revenue', value: `${stats.revenue.toFixed(0)} ${t('currency')}`, icon: TrendingUp, color: 'text-green-500' },
    { label: lang === 'ar' ? 'المصروفات' : 'Expenses', value: `${stats.expenses.toFixed(0)} ${t('currency')}`, icon: DollarSign, color: 'text-red-500' },
    { label: lang === 'ar' ? 'الموظفين' : 'Employees', value: stats.employees, icon: Users, color: 'text-blue-500' },
    { label: lang === 'ar' ? 'العملاء المحتملين' : 'Leads', value: stats.leads, icon: Users, color: 'text-purple-500' },
    { label: lang === 'ar' ? 'حجوزات الإصلاح' : 'Repairs', value: stats.repairs, icon: Wrench, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Dashboard Card */}
        <Card className="p-4 shadow-card hover:shadow-card-hover transition-all bg-primary text-primary-foreground cursor-pointer hover:scale-105 active:scale-95" onClick={() => setShowCalc(true)}>
          <div className="flex flex-col items-center text-center gap-2">
            <CalcIcon className="h-6 w-6" />
            <p className="text-xl font-bold font-cairo">{t('dashboard.title')}</p>
            <p className="text-xs font-cairo opacity-80">ERP</p>
          </div>
        </Card>
        {statCards.map((stat, i) => (
          <Card key={i} className="p-4 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex flex-col items-center text-center gap-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <p className="text-xl font-bold font-cairo">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-cairo">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-bold font-cairo mb-3 text-primary">{lang === 'ar' ? 'الإيرادات والمصروفات' : 'Revenue vs Expenses'}</h3>
          {accountingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={accountingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" className="font-cairo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="hsl(145, 65%, 42%)" name={lang === 'ar' ? 'إيرادات' : 'Income'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" name={lang === 'ar' ? 'مصروفات' : 'Expenses'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground font-cairo text-sm">{lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold font-cairo mb-3 text-primary">{lang === 'ar' ? 'ملخص سريع' : 'Quick Summary'}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="font-cairo text-sm">{lang === 'ar' ? 'صافي الربح' : 'Net Profit'}</span>
              <span className={`font-bold font-cairo ${stats.revenue - stats.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.revenue - stats.expenses).toFixed(0)} {t('currency')}
              </span>
            </div>

            <h4 className="text-xs font-bold font-cairo text-muted-foreground mt-4">{lang === 'ar' ? 'آخر الفواتير' : 'Recent Invoices'}</h4>
            {recentInvoices.length === 0 ? (
              <p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد فواتير' : 'No invoices'}</p>
            ) : recentInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/20">
                <span className="font-cairo">{inv.invoice_number} — {inv.customer_name}</span>
                <span className="font-bold font-cairo">{inv.total} {t('currency')}</span>
              </div>
            ))}

            <h4 className="text-xs font-bold font-cairo text-muted-foreground mt-4">{lang === 'ar' ? 'آخر حجوزات الإصلاح' : 'Recent Repairs'}</h4>
            {recentRepairs.length === 0 ? (
              <p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد حجوزات' : 'No bookings'}</p>
            ) : recentRepairs.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/20">
                <span className="font-cairo">{r.customer_name}</span>
                <span className="text-xs text-muted-foreground">{r.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
    </div>
  );
};

export default DashboardPage;
