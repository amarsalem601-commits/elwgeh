import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Warehouse, Plus, ArrowRightLeft, Package } from 'lucide-react';

const WarehousesPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWH, setOpenWH] = useState(false);
  const [openStock, setOpenStock] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [whForm, setWhForm] = useState({ name: '', location: '' });
  const [stockForm, setStockForm] = useState({ warehouse_id: '', product_name: '', quantity: 0, min_stock: 0 });
  const [transferForm, setTransferForm] = useState({ from_warehouse_id: '', to_warehouse_id: '', product_name: '', quantity: 0, notes: '' });

  const fetchAll = async () => {
    const [wh, st, tr] = await Promise.all([
      supabase.from('warehouses').select('*').order('created_at'),
      supabase.from('warehouse_stock').select('*'),
      supabase.from('warehouse_transfers').select('*').order('created_at', { ascending: false }),
    ]);
    if (wh.data) setWarehouses(wh.data);
    if (st.data) setStock(st.data);
    if (tr.data) setTransfers(tr.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const addWarehouse = async () => {
    if (!whForm.name) return;
    const { error } = await supabase.from('warehouses').insert(whForm);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: lang === 'ar' ? 'تم إضافة المخزن' : 'Warehouse added' });
    setOpenWH(false); setWhForm({ name: '', location: '' }); fetchAll();
  };

  const addStock = async () => {
    if (!stockForm.warehouse_id || !stockForm.product_name) return;
    const { error } = await supabase.from('warehouse_stock').insert(stockForm);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: lang === 'ar' ? 'تم الإضافة' : 'Stock added' });
    setOpenStock(false); setStockForm({ warehouse_id: '', product_name: '', quantity: 0, min_stock: 0 }); fetchAll();
  };

  const createTransfer = async () => {
    if (!transferForm.from_warehouse_id || !transferForm.to_warehouse_id || !transferForm.product_name || !transferForm.quantity) return;
    const { error } = await supabase.from('warehouse_transfers').insert({ ...transferForm, created_by: user?.id || '' });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: lang === 'ar' ? 'تم إنشاء التحويل' : 'Transfer created' });
    setOpenTransfer(false); setTransferForm({ from_warehouse_id: '', to_warehouse_id: '', product_name: '', quantity: 0, notes: '' }); fetchAll();
  };

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold font-cairo gold-text flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          {lang === 'ar' ? 'إدارة المخازن' : 'Warehouse Management'}
        </h1>
        <div className="flex gap-2">
          <Dialog open={openWH} onOpenChange={setOpenWH}>
            <DialogTrigger asChild><Button className="gap-2 font-cairo" size="sm"><Plus className="h-4 w-4" />{lang === 'ar' ? 'مخزن جديد' : 'New Warehouse'}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-cairo">{lang === 'ar' ? 'إضافة مخزن' : 'Add Warehouse'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))} placeholder={lang === 'ar' ? 'اسم المخزن' : 'Name'} className="font-cairo" />
                <Input value={whForm.location} onChange={e => setWhForm(f => ({ ...f, location: e.target.value }))} placeholder={lang === 'ar' ? 'الموقع' : 'Location'} className="font-cairo" />
                <Button onClick={addWarehouse} className="w-full font-cairo">{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2 font-cairo" size="sm"><ArrowRightLeft className="h-4 w-4" />{lang === 'ar' ? 'تحويل' : 'Transfer'}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-cairo">{lang === 'ar' ? 'تحويل بين المخازن' : 'Warehouse Transfer'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={transferForm.from_warehouse_id} onValueChange={v => setTransferForm(f => ({ ...f, from_warehouse_id: v }))}>
                  <SelectTrigger className="font-cairo"><SelectValue placeholder={lang === 'ar' ? 'من مخزن' : 'From'} /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id} className="font-cairo">{w.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={transferForm.to_warehouse_id} onValueChange={v => setTransferForm(f => ({ ...f, to_warehouse_id: v }))}>
                  <SelectTrigger className="font-cairo"><SelectValue placeholder={lang === 'ar' ? 'إلى مخزن' : 'To'} /></SelectTrigger>
                  <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id} className="font-cairo">{w.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={transferForm.product_name} onChange={e => setTransferForm(f => ({ ...f, product_name: e.target.value }))} placeholder={lang === 'ar' ? 'المنتج' : 'Product'} className="font-cairo" />
                <Input type="number" value={transferForm.quantity} onChange={e => setTransferForm(f => ({ ...f, quantity: +e.target.value }))} placeholder={lang === 'ar' ? 'الكمية' : 'Quantity'} className="font-cairo" />
                <Button onClick={createTransfer} className="w-full font-cairo">{lang === 'ar' ? 'تحويل' : 'Transfer'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Warehouses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(wh => {
              const whStock = stock.filter(s => s.warehouse_id === wh.id);
              const lowStock = whStock.filter(s => s.quantity <= s.min_stock);
              return (
                <Card key={wh.id} className="border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-cairo flex items-center justify-between">
                      <span className="flex items-center gap-2"><Warehouse className="h-4 w-4 text-primary" />{wh.name}</span>
                      {lowStock.length > 0 && <Badge variant="destructive" className="text-xs">{lowStock.length} {lang === 'ar' ? 'منخفض' : 'low'}</Badge>}
                    </CardTitle>
                    {wh.location && <p className="text-xs text-muted-foreground">{wh.location}</p>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {whStock.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد منتجات' : 'No products'}</p>
                    ) : whStock.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="font-cairo">{s.product_name}</span>
                        <Badge variant={s.quantity <= s.min_stock ? 'destructive' : 'secondary'}>{s.quantity}</Badge>
                      </div>
                    ))}
                    <Dialog open={openStock} onOpenChange={setOpenStock}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full font-cairo text-xs" onClick={() => setStockForm(f => ({ ...f, warehouse_id: wh.id }))}>
                          <Plus className="h-3 w-3 me-1" />{lang === 'ar' ? 'إضافة منتج' : 'Add Product'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle className="font-cairo">{lang === 'ar' ? 'إضافة منتج للمخزن' : 'Add to Warehouse'}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <Input value={stockForm.product_name} onChange={e => setStockForm(f => ({ ...f, product_name: e.target.value }))} placeholder={lang === 'ar' ? 'اسم المنتج' : 'Product'} className="font-cairo" />
                          <div className="grid grid-cols-2 gap-4">
                            <Input type="number" value={stockForm.quantity} onChange={e => setStockForm(f => ({ ...f, quantity: +e.target.value }))} placeholder={lang === 'ar' ? 'الكمية' : 'Qty'} className="font-cairo" />
                            <Input type="number" value={stockForm.min_stock} onChange={e => setStockForm(f => ({ ...f, min_stock: +e.target.value }))} placeholder={lang === 'ar' ? 'الحد الأدنى' : 'Min'} className="font-cairo" />
                          </div>
                          <Button onClick={addStock} className="w-full font-cairo">{lang === 'ar' ? 'إضافة' : 'Add'}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Transfers */}
          {transfers.length > 0 && (
            <Card className="border-primary/10">
              <CardHeader><CardTitle className="text-base font-cairo flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />{lang === 'ar' ? 'آخر التحويلات' : 'Recent Transfers'}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {transfers.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                    <div className="font-cairo">
                      <span>{t.product_name}</span>
                      <span className="text-muted-foreground mx-2">×{t.quantity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-cairo">
                      {getWarehouseName(t.from_warehouse_id)} → {getWarehouseName(t.to_warehouse_id)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default WarehousesPage;
