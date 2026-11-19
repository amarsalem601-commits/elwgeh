import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Purchase {
  id: string;
  order_number: string;
  supplier: string;
  date: string;
  items: number;
  total: number;
  status: string;
}

const PurchasesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<Purchase | null>(null);
  const [form, setForm] = useState({ supplier: '', items: '', total: '' });

  useEffect(() => {
    const loadPurchases = async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, order_number, supplier, date, items, total, status')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: t('purchases.title'), description: error.message, variant: 'destructive' });
        return;
      }
      setPurchases(data || []);
    };
    loadPurchases();
  }, [t, toast]);

  const openAdd = () => {
    setEditPurchase(null);
    setForm({ supplier: '', items: '', total: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: Purchase) => {
    setEditPurchase(p);
    setForm({ supplier: p.supplier, items: String(p.items), total: String(p.total) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const total = Number(form.total);
    if (!form.supplier.trim() || form.total.trim() === '' || !Number.isFinite(total) || total < 0) {
      toast({ title: t('purchases.title'), description: t('required'), variant: 'destructive' });
      return;
    }
    if (!user) return;
    const purchaseFields = {
      supplier: form.supplier.trim(),
      items: Number(form.items) || 1,
      total,
    };
    if (editPurchase) {
      const { data, error } = await supabase
        .from('purchases')
        .update({ ...purchaseFields, updated_at: new Date().toISOString() })
        .eq('id', editPurchase.id)
        .select('id, order_number, supplier, date, items, total, status')
        .single();
      if (error) {
        toast({ title: t('products.edit'), description: error.message, variant: 'destructive' });
        return;
      }
      setPurchases(prev => prev.map(purchase => purchase.id === editPurchase.id ? data : purchase));
      toast({ title: t('products.edit'), description: purchaseFields.supplier });
    } else {
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          ...purchaseFields,
          order_number: `PO-${Date.now()}`,
          created_by: user.id,
        })
        .select('id, order_number, supplier, date, items, total, status')
        .single();
      if (error) {
        toast({ title: t('purchases.newOrder'), description: error.message, variant: 'destructive' });
        return;
      }
      setPurchases(prev => [data, ...prev]);
      toast({ title: t('purchases.newOrder') });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      toast({ title: t('products.delete'), description: error.message, variant: 'destructive' });
      return;
    }
    setPurchases(prev => prev.filter(purchase => purchase.id !== id));
    toast({ title: t('products.delete'), variant: 'destructive' });
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('purchases.title')}</h1>
        <Button className="gradient-primary gap-1" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t('purchases.newOrder')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{editPurchase ? t('products.edit') : t('purchases.newOrder')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('purchases.supplier')}</Label><Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
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

      {purchases.length === 0 ? (
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
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('purchases.supplier')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('sales.date')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('items')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('sales.total')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{p.order_number || p.id.slice(0, 8)}</td>
                    <td className="p-3">{p.supplier}</td>
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{p.items}</td>
                    <td className="p-3">{p.total.toLocaleString()} {t('currency')}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
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

export default PurchasesPage;
