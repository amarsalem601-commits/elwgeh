import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  location: string;
  orders: number;
  total: number;
}

const CustomersPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', location: '' });

  useEffect(() => {
    const loadCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, location, orders, total')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: t('customers.title'), description: error.message, variant: 'destructive' });
        return;
      }
      setCustomers(data || []);
    };
    loadCustomers();
  }, [t, toast]);

  const openAdd = () => {
    setEditCustomer(null);
    setForm({ name: '', phone: '', location: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone, location: c.location });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: t('customers.title'), description: t('required'), variant: 'destructive' });
      return;
    }
    if (!user) return;
    const customerFields = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
    };
    if (editCustomer) {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...customerFields, updated_at: new Date().toISOString() })
        .eq('id', editCustomer.id)
        .select('id, name, phone, location, orders, total')
        .single();
      if (error) {
        toast({ title: t('products.edit'), description: error.message, variant: 'destructive' });
        return;
      }
      setCustomers(prev => prev.map(customer => customer.id === editCustomer.id ? data : customer));
      toast({ title: t('products.edit'), description: customerFields.name });
    } else {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customerFields, created_by: user.id })
        .select('id, name, phone, location, orders, total')
        .single();
      if (error) {
        toast({ title: t('customers.add'), description: error.message, variant: 'destructive' });
        return;
      }
      setCustomers(prev => [data, ...prev]);
      toast({ title: t('customers.add') });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast({ title: t('products.delete'), description: error.message, variant: 'destructive' });
      return;
    }
    setCustomers(prev => prev.filter(customer => customer.id !== id));
    toast({ title: t('products.delete'), variant: 'destructive' });
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('customers.title')}</h1>
        <Button className="gradient-primary gap-1" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t('customers.add')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{editCustomer ? t('products.edit') : t('customers.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('customers.name')}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>{t('customers.phone')}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>{t('customers.location')}</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="gradient-primary" onClick={handleSave}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {customers.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <Card key={c.id} className="p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {c.location}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
