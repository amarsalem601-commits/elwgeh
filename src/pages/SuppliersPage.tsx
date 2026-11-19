import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Phone, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  location: string;
}

const SuppliersPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', location: '' });

  useEffect(() => {
    const loadSuppliers = async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, contact, phone, location')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: t('suppliers.title'), description: error.message, variant: 'destructive' });
        return;
      }
      setSuppliers(data || []);
    };
    loadSuppliers();
  }, [t, toast]);

  const openAdd = () => {
    setEditSupplier(null);
    setForm({ name: '', contact: '', phone: '', location: '' });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditSupplier(s);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, location: s.location });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: t('suppliers.name'), description: t('required'), variant: 'destructive' });
      return;
    }
    if (!user) return;

    const supplierFields = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
    };
    if (editSupplier) {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ ...supplierFields, updated_at: new Date().toISOString() })
        .eq('id', editSupplier.id)
        .select('id, name, contact, phone, location')
        .single();
      if (error) {
        toast({ title: t('products.edit'), description: error.message, variant: 'destructive' });
        return;
      }
      setSuppliers(prev => prev.map(s => s.id === editSupplier.id ? data : s));
      toast({ title: t('products.edit'), description: supplierFields.name });
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ ...supplierFields, created_by: user.id })
        .select('id, name, contact, phone, location')
        .single();
      if (error) {
        toast({ title: t('suppliers.add'), description: error.message, variant: 'destructive' });
        return;
      }
      setSuppliers(prev => [data, ...prev]);
      toast({ title: t('suppliers.add') });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      toast({ title: t('products.delete'), description: error.message, variant: 'destructive' });
      return;
    }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    toast({ title: t('products.delete'), variant: 'destructive' });
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground font-cairo">{t('suppliers.title')}</h1>
        <Button className="gradient-primary gap-1" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t('suppliers.add')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{editSupplier ? t('products.edit') : t('suppliers.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('suppliers.name')}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>{t('suppliers.contact')}</Label><Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
            <div><Label>{t('suppliers.phone')}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>{t('suppliers.location')}</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button className="gradient-primary" onClick={handleSave}>{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {suppliers.length === 0 ? (
        <Card className="p-12 shadow-card text-center">
          <p className="text-muted-foreground font-cairo">{t('noData')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <Card key={s.id} className="p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.contact}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</p>
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.location}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
