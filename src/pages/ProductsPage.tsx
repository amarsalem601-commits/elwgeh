import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

const ProductsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', quantity: '' });

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, quantity')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: t('products.title'), description: error.message, variant: 'destructive' });
        return;
      }
      setProducts(data || []);
    };
    loadProducts();
  }, [t, toast]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', category: '', price: '', quantity: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), quantity: String(p.quantity) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!form.name.trim() || form.price.trim() === '' || !Number.isFinite(price) || price < 0 ||
      !Number.isFinite(quantity) || quantity < 0) {
      toast({ title: t('products.title'), description: t('required'), variant: 'destructive' });
      return;
    }
    if (!user) return;
    const productFields = {
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      quantity,
    };
    if (editProduct) {
      const { data, error } = await supabase
        .from('products')
        .update({ ...productFields, updated_at: new Date().toISOString() })
        .eq('id', editProduct.id)
        .select('id, name, category, price, quantity')
        .single();
      if (error) {
        toast({ title: t('products.edit'), description: error.message, variant: 'destructive' });
        return;
      }
      setProducts(prev => prev.map(product => product.id === editProduct.id ? data : product));
      toast({ title: t('products.edit'), description: productFields.name });
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...productFields, created_by: user.id })
        .select('id, name, category, price, quantity')
        .single();
      if (error) {
        toast({ title: t('products.add'), description: error.message, variant: 'destructive' });
        return;
      }
      setProducts(prev => [data, ...prev]);
      toast({ title: t('products.add'), description: productFields.name });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: t('products.delete'), description: error.message, variant: 'destructive' });
      return;
    }
    setProducts(prev => prev.filter(product => product.id !== id));
    toast({ title: t('products.delete'), variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('products.title')}</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground start-3" />
            <Input placeholder={t('products.search')} value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-1" onClick={openAdd}>
                <Plus className="h-4 w-4" /> {t('products.add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-cairo">{editProduct ? t('products.edit') : t('products.add')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>{t('products.name')}</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>{t('products.category')}</Label>
                  <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('products.price')}</Label>
                    <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t('products.quantity')}</Label>
                    <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
                  <Button className="gradient-primary" onClick={handleSave}>{t('save')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-start p-3 font-medium text-muted-foreground">#</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('products.name')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('products.category')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('products.price')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('products.quantity')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('products.status')}</th>
                  <th className="text-start p-3 font-medium text-muted-foreground">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3">{p.price.toLocaleString()} {t('currency')}</td>
                    <td className="p-3">{p.quantity}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.quantity > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {p.quantity > 0 ? t('products.available') : t('products.unavailable')}
                      </span>
                    </td>
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

export default ProductsPage;
