import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  order_number: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: string;
}

const SalesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [form, setForm] = useState({ customer: '', items: '', total: '' });

  useEffect(() => {
    const loadSales = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('id, order_number, customer, date, items, total, status')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: t('sales.title'), description: error.message, variant: 'destructive' });
        return;
      }
      setSales(data || []);
    };
    loadSales();
  }, [t, toast]);

  const openAdd = () => {
    setEditSale(null);
    setForm({ customer: '', items: '', total: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: Sale) => {
    setEditSale(s);
    setForm({ customer: s.customer, items: String(s.items), total: String(s.total) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const total = Number(form.total);
    if (!form.customer.trim() || form.total.trim() === '' || !Number.isFinite(total) || total < 0) {
      toast({ title: t('sales.title'), description: t('required'), variant: 'destructive' });
      return;
    }
    if (!user) return;
    const saleFields = {
      customer: form.customer.trim(),
      items: Number(form.items) || 1,
      total,
    };
    if (editSale) {
      const { data, error } = await supabase
        .from('sales')
        .update({ ...saleFields, updated_at: new Date().toISOString() })
        .eq('id', editSale.id)
        .select('id, order_number, customer, date, items, total, status')
        .single();
      if (error) {
        toast({ title: t('products.edit'), description: error.message, variant: 'destructive' });
        return;
      }
      setSales(prev => prev.map(sale => sale.id === editSale.id ? data : sale));
      toast({ title: t('products.edit'), description: saleFields.customer });
    } else {
      const { data, error } = await supabase
        .from('sales')
        .insert({
          ...saleFields,
          order_number: `SO-${Date.now()}`,
          created_by: user.id,
        })
        .select('id, order_number, customer, date, items, total, status')
        .single();
      if (error) {
        toast({ title: t('sales.newOrder'), description: error.message, variant: 'destructive' });
        return;
      }
      setSales(prev => [data, ...prev]);
      toast({ title: t('sales.newOrder') });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) {
      toast({ title: t('products.delete'), description: error.message, variant: 'destructive' });
      return;
    }
    setSales(prev => prev.filter(sale => sale.id !== id));
    toast({ title: t('products.delete'), variant: 'destructive' });
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('sales.title')}</h1>
        <Button className="gradient-primary gap-1" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t('sales.newOrder')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{editSale ? t('products.edit') : t('sales.newOrder')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('sales.customer')}</Label><Input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t('items')}</Label><Input type="number" value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} /></div>
              <div><Label>{t('sales.total')}</Label><Input type="number" value={form.total} onChange={e => setForm(f => ({ ...f, total: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="gradient-primary" onClick={handleSave}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {sales.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('sales.orderId')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('sales.customer')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('sales.date')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('items')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('sales.total')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{s.order_number || s.id.slice(0, 8)}</td>
                    <td className="p-3">{s.customer}</td>
                    <td className="p-3">{s.date}</td>
                    <td className="p-3">{s.items}</td>
                    <td className="p-3">{s.total.toLocaleString()} {t('currency')}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
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

export default SalesPage;
