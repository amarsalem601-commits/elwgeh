import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface StockItem {
  id: string;
  warehouse_id: string;
  product_name: string;
  quantity: number;
  min_stock: number;
  updated_at: string;
  warehouse_name?: string;
}

interface Warehouse {
  id: string;
  name: string;
}

const InventoryPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [form, setForm] = useState({ product_name: '', quantity: '', min_stock: '', warehouse_id: '' });
  const [loading, setLoading] = useState(false);
  const [filterWarehouse, setFilterWarehouse] = useState<string>('all');

  const fetchData = async () => {
    const [stockRes, whRes] = await Promise.all([
      supabase.from('warehouse_stock').select('*').order('updated_at', { ascending: false }),
      supabase.from('warehouses').select('id, name'),
    ]);

    const whs = whRes.data || [];
    setWarehouses(whs);

    const whMap: Record<string, string> = {};
    whs.forEach(w => { whMap[w.id] = w.name; });

    setItems((stockRes.data || []).map(s => ({
      ...s,
      warehouse_name: whMap[s.warehouse_id] || '-',
    })));
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ product_name: '', quantity: '', min_stock: '', warehouse_id: warehouses[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditItem(item);
    setForm({
      product_name: item.product_name,
      quantity: String(item.quantity),
      min_stock: String(item.min_stock),
      warehouse_id: item.warehouse_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_name.trim() || !form.warehouse_id) {
      toast({ title: lang === 'ar' ? 'أدخل اسم المنتج واختر المخزن' : 'Enter product name and select warehouse', variant: 'destructive' });
      return;
    }
    setLoading(true);

    if (editItem) {
      const { error } = await supabase.from('warehouse_stock').update({
        product_name: form.product_name.trim(),
        quantity: Number(form.quantity) || 0,
        min_stock: Number(form.min_stock) || 0,
        warehouse_id: form.warehouse_id,
        updated_at: new Date().toISOString(),
      }).eq('id', editItem.id);

      if (error) {
        toast({ title: lang === 'ar' ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: lang === 'ar' ? 'تم التعديل ✅' : 'Updated ✅' });
      }
    } else {
      const { error } = await supabase.from('warehouse_stock').insert({
        product_name: form.product_name.trim(),
        quantity: Number(form.quantity) || 0,
        min_stock: Number(form.min_stock) || 0,
        warehouse_id: form.warehouse_id,
      });

      if (error) {
        toast({ title: lang === 'ar' ? 'خطأ' : 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: lang === 'ar' ? 'تمت الإضافة ✅' : 'Added ✅' });
      }
    }

    setLoading(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('warehouse_stock').delete().eq('id', id);
    toast({ title: lang === 'ar' ? 'تم الحذف' : 'Deleted', variant: 'destructive' });
    fetchData();
  };

  const filtered = filterWarehouse === 'all' ? items : items.filter(i => i.warehouse_id === filterWarehouse);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('inventory.title')}</h1>
        <div className="flex items-center gap-2">
          <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
            <SelectTrigger className="w-[160px] font-cairo">
              <SelectValue placeholder={lang === 'ar' ? 'كل المخازن' : 'All Warehouses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">{lang === 'ar' ? 'كل المخازن' : 'All'}</SelectItem>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={w.id} className="font-cairo">{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openAdd} className="gap-1 font-cairo">
            <Plus className="h-4 w-4" /> {lang === 'ar' ? 'إضافة منتج' : 'Add Product'}
          </Button>
        </div>
      </div>

      {warehouses.length === 0 && (
        <Card className="p-6 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">
            {lang === 'ar' ? 'أضف مخزن أولاً من قسم المخازن' : 'Add a warehouse first from Warehouses section'}
          </p>
        </Card>
      )}

      {filtered.length === 0 && warehouses.length > 0 ? (
        <Card className="p-12 shadow-card text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{lang === 'ar' ? 'المخزن' : 'Warehouse'}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo min-w-[120px]">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{lang === 'ar' ? 'الحد الأدنى' : 'Min'}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground font-cairo">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const maxVal = Math.max(item.quantity, item.min_stock * 2, 100);
                  const pct = Math.min((item.quantity / maxVal) * 100, 100);
                  const isLow = item.quantity <= item.min_stock;
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium font-cairo">{item.product_name}</td>
                      <td className="p-3 text-muted-foreground font-cairo">{item.warehouse_name}</td>
                      <td className="p-3 font-cairo">{item.quantity}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className={`text-xs font-medium ${isLow ? 'text-destructive' : 'text-green-500'}`}>
                            {isLow ? (lang === 'ar' ? 'منخفض' : 'Low') : (lang === 'ar' ? 'جيد' : 'OK')}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-cairo">{item.min_stock}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">
              {editItem ? (lang === 'ar' ? 'تعديل المنتج' : 'Edit Product') : (lang === 'ar' ? 'إضافة منتج للمخزن' : 'Add Product to Stock')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-cairo">{lang === 'ar' ? 'اسم المنتج' : 'Product Name'}</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} className="font-cairo" placeholder={lang === 'ar' ? 'مثال: كمبروسر 1 طن' : 'e.g. Compressor 1 Ton'} />
            </div>
            <div>
              <Label className="font-cairo">{lang === 'ar' ? 'المخزن' : 'Warehouse'}</Label>
              <Select value={form.warehouse_id} onValueChange={v => setForm(f => ({ ...f, warehouse_id: v }))}>
                <SelectTrigger className="font-cairo">
                  <SelectValue placeholder={lang === 'ar' ? 'اختر المخزن' : 'Select warehouse'} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id} className="font-cairo">{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo">{lang === 'ar' ? 'الكمية' : 'Quantity'}</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <Label className="font-cairo">{lang === 'ar' ? 'الحد الأدنى' : 'Min Stock'}</Label>
                <Input type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo">{t('cancel')}</Button>
              <Button onClick={handleSave} disabled={loading} className="font-cairo">
                {loading ? '...' : t('save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
