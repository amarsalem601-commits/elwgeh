import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Printer, Eye } from 'lucide-react';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const InvoicesPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewItems, setViewItems] = useState<any[]>([]);

  const [form, setForm] = useState({
    type: 'sale',
    customer_name: '',
    customer_phone: '',
    discount: 0,
    tax: 0,
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([{ product_name: '', quantity: 1, unit_price: 0, total: 0 }]);

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (data) setInvoices(data);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      updated.total = updated.quantity * updated.unit_price;
      return updated;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalAmount = subtotal - form.discount + (subtotal * form.tax / 100);

  const createInvoice = async () => {
    if (!form.customer_name) { toast({ title: lang === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name', variant: 'destructive' }); return; }
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      type: form.type,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      subtotal,
      discount: form.discount,
      tax: form.tax,
      total: totalAmount,
      status: 'draft',
      notes: form.notes,
      created_by: user?.id || '',
    }).select().single();

    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    if (data) {
      const invoiceItems = items.filter(i => i.product_name).map(i => ({
        invoice_id: data.id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      }));
      if (invoiceItems.length > 0) {
        await supabase.from('invoice_items').insert(invoiceItems);
      }
    }

    toast({ title: lang === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice created' });
    setOpen(false);
    setForm({ type: 'sale', customer_name: '', customer_phone: '', discount: 0, tax: 0, notes: '' });
    setItems([{ product_name: '', quantity: 1, unit_price: 0, total: 0 }]);
    fetchInvoices();
  };

  const viewInvoiceDetails = async (invoice: Invoice) => {
    setViewInvoice(invoice);
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id);
    if (data) setViewItems(data);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('invoices').update({ status }).eq('id', id);
    fetchInvoices();
    toast({ title: lang === 'ar' ? 'تم التحديث' : 'Updated' });
  };

  const printInvoice = () => {
    if (!viewInvoice) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html dir="rtl"><head><title>${viewInvoice.invoice_number}</title>
      <style>body{font-family:Cairo,sans-serif;padding:40px;max-width:800px;margin:0 auto}
      table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:right}
      th{background:#f5f0e0}.header{text-align:center;border-bottom:3px solid #c9a84c;padding-bottom:20px;margin-bottom:20px}
      .total{font-size:1.3em;font-weight:bold;color:#c9a84c;text-align:left;margin-top:20px}
      @media print{body{padding:20px}}</style></head><body>
      <div class="header"><h1>الوجيه لمنظمات الهواء</h1><p>فاتورة ${viewInvoice.type === 'sale' ? 'بيع' : 'شراء'}</p></div>
      <p><strong>رقم الفاتورة:</strong> ${viewInvoice.invoice_number}</p>
      <p><strong>العميل:</strong> ${viewInvoice.customer_name} | <strong>الهاتف:</strong> ${viewInvoice.customer_phone}</p>
      <p><strong>التاريخ:</strong> ${new Date(viewInvoice.created_at).toLocaleDateString('ar-EG')}</p>
      <table><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
      <tbody>${viewItems.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>${i.unit_price}</td><td>${i.total}</td></tr>`).join('')}</tbody></table>
      <p>المجموع: ${viewInvoice.subtotal} ج.م</p>
      <p>الخصم: ${viewInvoice.discount} ج.م | الضريبة: ${viewInvoice.tax}%</p>
      <p class="total">الإجمالي: ${viewInvoice.total} ج.م</p>
      ${viewInvoice.notes ? `<p>ملاحظات: ${viewInvoice.notes}</p>` : ''}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-cairo gold-text flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {lang === 'ar' ? 'الفواتير' : 'Invoices'}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-cairo"><Plus className="h-4 w-4" />{lang === 'ar' ? 'فاتورة جديدة' : 'New Invoice'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo">{lang === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="font-cairo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale" className="font-cairo">{lang === 'ar' ? 'فاتورة بيع' : 'Sales Invoice'}</SelectItem>
                    <SelectItem value="purchase" className="font-cairo">{lang === 'ar' ? 'فاتورة شراء' : 'Purchase Invoice'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder={lang === 'ar' ? 'اسم العميل' : 'Customer name'} className="font-cairo" />
              </div>
              <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder={lang === 'ar' ? 'رقم الهاتف' : 'Phone'} className="font-cairo" />

              <div className="space-y-2">
                <h3 className="font-bold font-cairo text-sm">{lang === 'ar' ? 'المنتجات' : 'Items'}</h3>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center">
                    <Input value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)} placeholder={lang === 'ar' ? 'المنتج' : 'Product'} className="font-cairo col-span-2" />
                    <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} placeholder={lang === 'ar' ? 'الكمية' : 'Qty'} className="font-cairo" />
                    <Input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', +e.target.value)} placeholder={lang === 'ar' ? 'السعر' : 'Price'} className="font-cairo" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-cairo font-bold">{item.total.toFixed(2)}</span>
                      {items.length > 1 && <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setItems([...items, { product_name: '', quantity: 1, unit_price: 0, total: 0 }])} className="font-cairo">
                  <Plus className="h-3 w-3 me-1" /> {lang === 'ar' ? 'إضافة منتج' : 'Add Item'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))} placeholder={lang === 'ar' ? 'الخصم' : 'Discount'} className="font-cairo" />
                <Input type="number" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: +e.target.value }))} placeholder={lang === 'ar' ? 'الضريبة %' : 'Tax %'} className="font-cairo" />
              </div>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={lang === 'ar' ? 'ملاحظات' : 'Notes'} className="font-cairo" />

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-lg font-bold font-cairo gold-text">{lang === 'ar' ? 'الإجمالي:' : 'Total:'} {totalAmount.toFixed(2)} {lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                <Button onClick={createInvoice} className="font-cairo">{lang === 'ar' ? 'إنشاء الفاتورة' : 'Create Invoice'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : invoices.length === 0 ? (
        <Card className="border-primary/10 text-center py-12"><CardContent><FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground font-cairo">{lang === 'ar' ? 'لا توجد فواتير' : 'No invoices'}</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {invoices.map(inv => (
            <Card key={inv.id} className="border-primary/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold font-cairo">{inv.invoice_number}</span>
                    <Badge className={statusColors[inv.status] || 'bg-muted'}>{inv.status}</Badge>
                    <Badge variant="outline" className="font-cairo">{inv.type === 'sale' ? (lang === 'ar' ? 'بيع' : 'Sale') : (lang === 'ar' ? 'شراء' : 'Purchase')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-cairo">{inv.customer_name} — {inv.total.toFixed(2)} {lang === 'ar' ? 'ج.م' : 'EGP'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={inv.status} onValueChange={v => updateStatus(inv.id, v)}>
                    <SelectTrigger className="w-[110px] text-xs font-cairo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'sent', 'paid', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s} className="font-cairo text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => viewInvoiceDetails(inv)}><Eye className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cairo flex items-center gap-2"><FileText className="h-5 w-5" />{viewInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-3">
              <p className="font-cairo text-sm"><strong>{lang === 'ar' ? 'العميل:' : 'Customer:'}</strong> {viewInvoice.customer_name}</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted"><th className="p-2 text-start font-cairo">{lang === 'ar' ? 'المنتج' : 'Product'}</th><th className="p-2 font-cairo">{lang === 'ar' ? 'الكمية' : 'Qty'}</th><th className="p-2 font-cairo">{lang === 'ar' ? 'السعر' : 'Price'}</th><th className="p-2 font-cairo">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th></tr></thead>
                  <tbody>{viewItems.map(i => (
                    <tr key={i.id} className="border-t"><td className="p-2 font-cairo">{i.product_name}</td><td className="p-2 text-center">{i.quantity}</td><td className="p-2 text-center">{i.unit_price}</td><td className="p-2 text-center">{i.total}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="text-end space-y-1 text-sm font-cairo">
                <p>{lang === 'ar' ? 'المجموع:' : 'Subtotal:'} {viewInvoice.subtotal}</p>
                <p>{lang === 'ar' ? 'الخصم:' : 'Discount:'} {viewInvoice.discount}</p>
                <p>{lang === 'ar' ? 'الضريبة:' : 'Tax:'} {viewInvoice.tax}%</p>
                <p className="text-lg font-bold gold-text">{lang === 'ar' ? 'الإجمالي:' : 'Total:'} {viewInvoice.total} {lang === 'ar' ? 'ج.م' : 'EGP'}</p>
              </div>
              <Button onClick={printInvoice} className="w-full gap-2 font-cairo"><Printer className="h-4 w-4" />{lang === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
