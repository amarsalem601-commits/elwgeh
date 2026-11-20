import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import type { ShowcaseProduct } from '@/hooks/usePublicShowcase';

type ProductForm = Omit<ShowcaseProduct, 'id'>;

const emptyProduct: ProductForm = {
  name: '',
  category: '',
  description: '',
  image_url: '',
  price: null,
  display_order: 0,
  is_active: true,
};

const ShowcaseProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [editing, setEditing] = useState<ShowcaseProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('showcase_products')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      toast({ title: 'تعذر تحميل منتجات العرض', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setProducts(data as ShowcaseProduct[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyProduct });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setOpen(true);
  };

  const openEdit = (product: ShowcaseProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      image_url: product.image_url,
      price: product.price,
      display_order: product.display_order,
      is_active: product.is_active,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setOpen(true);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'يرجى اختيار ملف صورة فقط', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'يجب تسجيل الدخول قبل رفع الصورة', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await supabase.storage
      .from('showcase-products')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      setUploading(false);
      toast({ title: 'تعذر رفع صورة المنتج', description: error.message, variant: 'destructive' });
      return;
    }

    const { data } = supabase.storage.from('showcase-products').getPublicUrl(fileName);
    setForm(current => ({ ...current, image_url: data.publicUrl }));
    setUploading(false);
  };

  const removeSelectedImage = () => {
    setForm(current => ({ ...current, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async () => {
    if (!user) {
      toast({ title: 'يجب تسجيل الدخول قبل الحفظ', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim() || 'منتج',
      category: '',
      description: '',
      image_url: form.image_url.trim(),
      price: null,
      display_order: editing ? editing.display_order : 0,
      created_by: user.id,
    };
    const result = editing
      ? await supabase.from('showcase_products').update(payload).eq('id', editing.id)
      : await supabase.from('showcase_products').insert(payload);
    setSaving(false);

    if (result.error) {
      toast({ title: 'تعذر حفظ المنتج', description: result.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم حفظ المنتج' });
    setOpen(false);
    await loadProducts();
  };

  const remove = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذا المنتج من قسم منتجاتنا؟')) return;
    const { error } = await supabase.from('showcase_products').delete().eq('id', id);
    if (error) {
      toast({ title: 'تعذر حذف المنتج', description: error.message, variant: 'destructive' });
      return;
    }
    setProducts(current => current.filter(product => product.id !== id));
    toast({ title: 'تم حذف المنتج' });
  };

  const toggleVisibility = async (product: ShowcaseProduct) => {
    const { error } = await supabase
      .from('showcase_products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    if (error) {
      toast({ title: 'تعذر تحديث حالة العرض', description: error.message, variant: 'destructive' });
      return;
    }
    setProducts(current => current.map(item => item.id === product.id ? { ...item, is_active: !item.is_active } : item));
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-cairo">منتجات الصفحة العامة</h1>
          <p className="mt-1 text-sm text-muted-foreground font-cairo">إدارة المنتجات التي تظهر للزوار في قسم «منتجاتنا».</p>
        </div>
        <Button onClick={openNew} className="gap-2 font-cairo"><Plus className="h-4 w-4" /> إضافة منتج</Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground font-cairo">جاري تحميل المنتجات...</p>
      ) : products.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground font-cairo">لم تتم إضافة منتجات للعرض بعد.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => (
            <Card key={product.id} className="mx-auto w-full max-w-[350px] overflow-hidden">
              <div className="aspect-[210/297] bg-white">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center"><ImagePlus className="h-10 w-10 text-muted-foreground/40" /></div>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold font-cairo">{product.name}</h2>
                    <p className="text-sm text-muted-foreground font-cairo">{product.category || 'بدون تصنيف'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {product.is_active ? 'ظاهر للزوار' : 'مخفي'}
                  </span>
                </div>
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground font-cairo">{product.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)} className="flex-1 gap-1 font-cairo"><Pencil className="h-4 w-4" /> تعديل</Button>
                  <Button size="sm" variant="outline" onClick={() => void toggleVisibility(product)} aria-label={product.is_active ? 'إخفاء المنتج' : 'إظهار المنتج'}>
                    {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => void remove(product.id)} aria-label="حذف المنتج"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? 'تعديل منتج' : 'إضافة منتج للعرض'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>صورة المنتج</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file);
                }}
              />
              {form.image_url ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img src={form.image_url} alt="معاينة صورة المنتج" className="aspect-[210/297] w-full bg-white object-contain" />
                  <Button type="button" size="icon" variant="secondary" className="absolute left-2 top-2 h-8 w-8" onClick={removeSelectedImage} aria-label="إزالة الصورة">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-white text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  {uploading ? <Upload className="h-8 w-8 animate-pulse" /> : <ImagePlus className="h-8 w-8" />}
                  <span className="font-cairo text-sm">{uploading ? 'جاري رفع الصورة...' : 'اختر صورة من الجهاز'}</span>
                  <span className="text-xs">PNG أو JPG أو WebP — حتى 5 ميجابايت</span>
                </button>
              )}
              {form.image_url && (
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2 font-cairo">
                  <Upload className="h-4 w-4" /> {uploading ? 'جاري الرفع...' : 'تغيير الصورة'}
                </Button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-cairo">
              <input type="checkbox" checked={form.is_active} onChange={event => setForm(current => ({ ...current, is_active: event.target.checked }))} />
              عرض المنتج للزوار
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading} className="font-cairo">إلغاء</Button>
            <Button onClick={() => void save()} disabled={saving || uploading} className="font-cairo">{saving ? 'جاري الحفظ...' : uploading ? 'جاري رفع الصورة...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShowcaseProductsPage;
