import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  notes: string;
  created_at: string;
}

const ExpensesPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({ title: '', amount: '', category: '', notes: '' });

  const fetchExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (data) setExpenses(data);
  };

  useEffect(() => { fetchExpenses(); }, []);

  const openAdd = () => {
    setEditExpense(null);
    setForm({ title: '', amount: '', category: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditExpense(e);
    setForm({ title: e.title, amount: String(e.amount), category: e.category, notes: e.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !user) return;
    if (editExpense) {
      await supabase.from('expenses').update({
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        notes: form.notes,
      }).eq('id', editExpense.id);
      toast({ title: lang === 'ar' ? 'تم التعديل ✅' : 'Updated ✅' });
    } else {
      await supabase.from('expenses').insert({
        user_id: user.id,
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        notes: form.notes,
      });
      toast({ title: t('expenses.add') });
    }
    setDialogOpen(false);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    toast({ title: t('delete'), variant: 'destructive' });
    fetchExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('expenses.title')}</h1>
        <Button className="gradient-primary gap-1 font-cairo" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t('expenses.add')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{editExpense ? (lang === 'ar' ? 'تعديل المصروف' : 'Edit Expense') : t('expenses.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="font-cairo">{t('title')}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="font-cairo">{t('expenses.amount')}</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div><Label className="font-cairo">{t('expenses.category')}</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            </div>
            <div><Label className="font-cairo">{t('expenses.notes')}</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo">{t('cancel')}</Button>
              <Button className="gradient-primary font-cairo" onClick={handleSave}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Total card */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-cairo">{t('expenses.total')}</p>
            <p className="text-2xl font-bold font-cairo text-primary">{total.toLocaleString()} {t('currency')}</p>
          </div>
        </div>
      </Card>

      {expenses.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('title')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('expenses.amount')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('expenses.category')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('expenses.date')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium font-cairo">{e.title}</td>
                    <td className="p-3 font-cairo">{e.amount.toLocaleString()} {t('currency')}</td>
                    <td className="p-3 font-cairo">{e.category}</td>
                    <td className="p-3 font-cairo">{new Date(e.created_at).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ExpensesPage;
