import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Users, Upload } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  photo_url: string;
  display_order: number;
}

const empty = { name: '', role: '', description: '', photo_url: '', display_order: 0 };

const TeamManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<TeamMember>>(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      toast({ title: 'تعذر تحميل أعضاء الفريق', description: error.message, variant: 'destructive' });
      return;
    }
    setMembers(data || []);
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditing(empty); setOpen(true); };
  const openEdit = (m: TeamMember) => { setEditing(m); setOpen(true); };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('team-photos').upload(path, file);
    if (error) {
      toast({ title: 'فشل رفع الصورة', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('team-photos').getPublicUrl(path);
    setEditing(e => ({ ...e, photo_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!editing.name) {
      toast({ title: 'الاسم مطلوب', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name || '',
      role: editing.role || '',
      description: editing.description || '',
      photo_url: editing.photo_url || '',
      display_order: Number(editing.display_order) || 0,
    };
    const { error } = editing.id
      ? await supabase.from('team_members').update(payload).eq('id', editing.id)
      : await supabase.from('team_members').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الحفظ ✅' });
    setOpen(false);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العضو؟')) return;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الحذف' });
    void load();
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-cairo">إدارة الفريق</h1>
            <p className="text-xs text-muted-foreground font-cairo">إضافة وتعديل أعضاء الفريق الذين يظهرون في الصفحة الرئيسية</p>
          </div>
        </div>
        <Button onClick={openNew} className="font-cairo gap-2">
          <Plus className="h-4 w-4" /> إضافة عضو
        </Button>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground font-cairo">لا يوجد أعضاء بعد</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Card key={m.id} className="overflow-hidden">
              <div className="aspect-square bg-muted overflow-hidden">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div>
                  <h3 className="font-cairo font-bold">{m.name}</h3>
                  {m.role && <p className="text-xs text-primary font-cairo">{m.role}</p>}
                </div>
                {m.description && <p className="text-xs text-muted-foreground font-cairo line-clamp-2">{m.description}</p>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(m)} className="flex-1 gap-1 font-cairo">
                    <Pencil className="h-3.5 w-3.5" /> تعديل
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(m.id)} className="gap-1 font-cairo">
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editing.id ? 'تعديل عضو' : 'إضافة عضو جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="aspect-square w-32 mx-auto rounded-xl overflow-hidden bg-muted relative">
              {editing.photo_url ? (
                <img src={editing.photo_url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <label className="block">
              <Button asChild variant="outline" size="sm" className="w-full font-cairo gap-1" disabled={uploading}>
                <span>
                  <Upload className="h-4 w-4" />
                  {uploading ? 'جاري الرفع...' : 'رفع صورة'}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
              />
            </label>
            <Input
              placeholder="الاسم"
              value={editing.name || ''}
              onChange={e => setEditing(s => ({ ...s, name: e.target.value }))}
              className="font-cairo"
            />
            <Input
              placeholder="الوظيفة / الدور"
              value={editing.role || ''}
              onChange={e => setEditing(s => ({ ...s, role: e.target.value }))}
              className="font-cairo"
            />
            <Textarea
              placeholder="نبذة عن العضو"
              value={editing.description || ''}
              onChange={e => setEditing(s => ({ ...s, description: e.target.value }))}
              className="font-cairo"
              rows={3}
            />
            <Input
              type="number"
              placeholder="ترتيب العرض"
              value={editing.display_order || 0}
              onChange={e => setEditing(s => ({ ...s, display_order: Number(e.target.value) }))}
              className="font-cairo"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="font-cairo">إلغاء</Button>
            <Button onClick={save} disabled={saving} className="font-cairo">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagementPage;
