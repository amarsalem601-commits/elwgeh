import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, TrendingUp, TrendingDown, DollarSign, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AccountingEntry {
  id: string;
  entry_date: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  created_at: string;
}

const COLORS = ['hsl(42, 85%, 42%)', 'hsl(210, 80%, 52%)', 'hsl(145, 65%, 42%)', 'hsl(0, 84%, 60%)', 'hsl(280, 60%, 50%)'];

const AccountingPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<AccountingEntry | null>(null);
  const [form, setForm] = useState({ description: '', type: 'income', category: '', amount: 0 });

  const fetchEntries = async () => {
    const { data } = await supabase.from('accounting_entries').select('*').order('entry_date', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const openAdd = () => {
    setEditEntry(null);
    setForm({ description: '', type: 'income', category: '', amount: 0 });
    setOpen(true);
  };

  const openEdit = (entry: AccountingEntry) => {
    setEditEntry(entry);
    setForm({ description: entry.description, type: entry.type, category: entry.category, amount: entry.amount });
    setOpen(true);
  };

  const addEntry = async () => {
    if (!form.description || !form.amount) { toast({ title: lang === 'ar' ? 'أكمل البيانات' : 'Fill required fields', variant: 'destructive' }); return; }
    if (editEntry) {
      const { error } = await supabase.from('accounting_entries').update(form).eq('id', editEntry.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: lang === 'ar' ? 'تم التعديل ✅' : 'Updated ✅' });
    } else {
      const { error } = await supabase.from('accounting_entries').insert({ ...form, created_by: user?.id || '' });
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: lang === 'ar' ? 'تم الإضافة' : 'Entry added' });
    }
    setOpen(false);
    setEditEntry(null);
    setForm({ description: '', type: 'income', category: '', amount: 0 });
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('accounting_entries').delete().eq('id', id);
    toast({ title: lang === 'ar' ? 'تم الحذف' : 'Deleted', variant: 'destructive' });
    fetchEntries();
  };

  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpense;

  // Monthly data for chart
  const monthlyData = entries.reduce((acc: any[], entry) => {
    const month = new Date(entry.entry_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
    const existing = acc.find(a => a.month === month);
    if (existing) {
      if (entry.type === 'income') existing.income += entry.amount;
      else existing.expense += entry.amount;
    } else {
      acc.push({ month, income: entry.type === 'income' ? entry.amount : 0, expense: entry.type === 'expense' ? entry.amount : 0 });
    }
    return acc;
  }, []);

  // Category breakdown for pie chart
  const categoryData = entries.reduce((acc: any[], entry) => {
    const existing = acc.find(a => a.name === (entry.category || 'أخرى'));
    if (existing) existing.value += entry.amount;
    else acc.push({ name: entry.category || 'أخرى', value: entry.amount });
    return acc;
  }, []);

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-cairo gold-text flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          {lang === 'ar' ? 'المحاسبة' : 'Accounting'}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-cairo" onClick={openAdd}><Plus className="h-4 w-4" />{lang === 'ar' ? 'قيد جديد' : 'New Entry'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-cairo">{editEntry ? (lang === 'ar' ? 'تعديل القيد' : 'Edit Entry') : (lang === 'ar' ? 'إضافة قيد محاسبي' : 'Add Entry')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={lang === 'ar' ? 'الوصف' : 'Description'} className="font-cairo" />
              <div className="grid grid-cols-2 gap-4">
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="font-cairo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income" className="font-cairo">{lang === 'ar' ? 'إيراد' : 'Income'}</SelectItem>
                    <SelectItem value="expense" className="font-cairo">{lang === 'ar' ? 'مصروف' : 'Expense'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={lang === 'ar' ? 'الفئة' : 'Category'} className="font-cairo" />
              </div>
              <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} placeholder={lang === 'ar' ? 'المبلغ' : 'Amount'} className="font-cairo" />
              <Button onClick={addEntry} className="w-full font-cairo">{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/10"><CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div><p className="text-2xl font-bold text-green-600">{totalIncome.toFixed(0)}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Income'}</p></div>
        </CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-4 flex items-center gap-3">
          <TrendingDown className="h-8 w-8 text-red-500" />
          <div><p className="text-2xl font-bold text-red-600">{totalExpense.toFixed(0)}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</p></div>
        </CardContent></Card>
        <Card className="border-primary/10"><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className={`h-8 w-8 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          <div><p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profit.toFixed(0)}</p><p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'صافي الربح' : 'Net Profit'}</p></div>
        </CardContent></Card>
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-primary/10">
            <CardHeader><CardTitle className="text-sm font-cairo">{lang === 'ar' ? 'الإيرادات والمصروفات الشهرية' : 'Monthly Income vs Expenses'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" className="font-cairo" /><YAxis /><Tooltip />
                  <Bar dataKey="income" fill="hsl(145, 65%, 42%)" name={lang === 'ar' ? 'إيرادات' : 'Income'} />
                  <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" name={lang === 'ar' ? 'مصروفات' : 'Expenses'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardHeader><CardTitle className="text-sm font-cairo">{lang === 'ar' ? 'توزيع حسب الفئة' : 'By Category'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-12 border-primary/10"><CardContent><BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد قيود' : 'No entries'}</p></CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {entries.map(entry => (
             <Card key={entry.id} className="border-primary/10">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {entry.type === 'income' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <div>
                    <p className="font-cairo text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">{entry.category} — {new Date(entry.entry_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-cairo ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.type === 'income' ? '+' : '-'}{entry.amount.toFixed(0)} {lang === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry(entry.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountingPage;
