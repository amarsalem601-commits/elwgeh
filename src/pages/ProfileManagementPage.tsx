import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User, Mail, Lock, Phone, Camera, Save, Search, Pencil, Users as UsersIcon, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmployeeProfile {
  user_id: string;
  name: string;
  phone: string;
  avatar_url: string;
  email?: string;
}

const ProfileManagementPage: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EmployeeProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProfiles = async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, name, phone, avatar_url')
      .order('created_at', { ascending: false });

    // Filter out admins to show only employees
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const adminIds = new Set(roles?.filter(r => r.role === 'admin').map(r => r.user_id));
    const employees = (profs || []).filter(p => !adminIds.has(p.user_id));
    setProfiles(employees as EmployeeProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const openEdit = (p: EmployeeProfile) => {
    setEditing(p);
    setEditName(p.name);
    setEditPhone(p.phone);
    setEditEmail('');
    setEditPassword('');
  };

  const uploadAvatar = async (file: File) => {
    if (!editing) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: isAr ? 'خطأ' : 'Error', 
        description: isAr ? 'الملف يجب أن يكون صورة' : 'File must be an image',
        variant: 'destructive' 
      });
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({ 
        title: isAr ? 'خطأ' : 'Error', 
        description: isAr ? 'حجم الملف أكبر من 5MB' : 'File size exceeds 5MB',
        variant: 'destructive' 
      });
      return;
    }

    setUploading(true);
    try {
      // حذف الصور القديمة إن وجدت
      const { data: files } = await supabase.storage
        .from('profile-photos')
        .list(editing.user_id);

      if (files && files.length > 0) {
        await supabase.storage
          .from('profile-photos')
          .remove(files.map(f => `${editing.user_id}/${f.name}`));
      }

      // رفع الصورة الجديدة
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!allowedExt.includes(ext)) {
        toast({ 
          title: isAr ? 'خطأ' : 'Error', 
          description: isAr ? 'صيغة الملف غير مدعومة' : 'File format not supported',
          variant: 'destructive' 
        });
        setUploading(false);
        return;
      }

      const fileName = `avatar_${Date.now()}.${ext}`;
      const path = `${editing.user_id}/${fileName}`;

      const { data, error: upErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { 
          upsert: false,
          contentType: file.type
        });

      if (upErr) {
        throw new Error(upErr.message || 'فشل رفع الملف / Upload failed');
      }

      // الحصول على الرابط العام
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      // تحديث قاعدة البيانات
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', editing.user_id);

      if (updateError) {
        throw new Error(updateError.message || 'فشل تحديث قاعدة البيانات / Database update failed');
      }

      setEditing({ ...editing, avatar_url: publicUrl });
      setProfiles(profiles.map(p => p.user_id === editing.user_id ? { ...p, avatar_url: publicUrl } : p));
      toast({ title: isAr ? 'تم رفع الصورة ✅' : 'Photo uploaded ✅' });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ 
        title: isAr ? 'خطأ' : 'Error', 
        description: err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'),
        variant: 'destructive' 
      });
    }
    setUploading(false);
  };

  const saveChanges = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // Update name + phone in profiles
      await supabase
        .from('profiles')
        .update({ name: editName, phone: editPhone })
        .eq('user_id', editing.user_id);

      // Update email/password via edge function
      if (editEmail || editPassword) {
        const { data: sessionData } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke('manage-employee', {
          body: {
            action: 'update',
            userId: editing.user_id,
            ...(editEmail && { email: editEmail }),
            ...(editPassword && { password: editPassword }),
          },
        });
        if (res.error) throw res.error;
      }

      toast({ title: isAr ? 'تم الحفظ ✅' : 'Saved ✅' });
      setEditing(null);
      loadProfiles();
    } catch (err: any) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const filtered = profiles.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold font-cairo text-foreground flex items-center gap-2">
          <UsersIcon className="h-6 w-6" />
          {isAr ? 'إدارة الملفات الشخصية' : 'Profile Management'}
        </h1>
        <div className="relative w-full sm:w-64">
          <Search className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} h-4 w-4 text-muted-foreground`} />
          <Input
            placeholder={isAr ? 'بحث بالاسم أو الهاتف' : 'Search name or phone'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${isAr ? 'pr-10' : 'pl-10'} font-cairo`}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground font-cairo">
          {isAr ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground font-cairo">
          {isAr ? 'لا يوجد موظفون' : 'No employees'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Card key={p.user_id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-primary/20">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cairo font-bold text-sm truncate">{p.name || (isAr ? 'بدون اسم' : 'No name')}</p>
                <p className="text-xs text-muted-foreground font-cairo truncate flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {p.phone || '-'}
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  {isAr ? 'تعديل' : 'Edit'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/employee-view/${p.user_id}`)} className="gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {isAr ? 'عرض' : 'View'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">
              {isAr ? 'تعديل الملف الشخصي' : 'Edit Profile'}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-primary/30 hover:border-primary"
                  onClick={() => !uploading && fileRef.current?.click()}
                >
                  {editing.avatar_url ? (
                    <img src={editing.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRef}
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                />
                <p className="text-xs text-muted-foreground font-cairo">
                  {uploading ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'اضغط لتغيير الصورة' : 'Click to change')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cairo flex items-center gap-1"><User className="h-3.5 w-3.5" />{isAr ? 'الاسم' : 'Name'}</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="font-cairo" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cairo flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="font-cairo" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cairo flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{isAr ? 'بريد إلكتروني جديد' : 'New Email'}</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={isAr ? 'اتركه فارغاً لعدم التغيير' : 'Leave blank to keep'}
                  className="font-cairo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cairo flex items-center gap-1"><Lock className="h-3.5 w-3.5" />{isAr ? 'كلمة مرور جديدة' : 'New Password'}</label>
                <Input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder={isAr ? 'اتركها فارغة لعدم التغيير' : 'Leave blank to keep'}
                  className="font-cairo"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} className="font-cairo" disabled={uploading || saving}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={saveChanges} disabled={saving || uploading} className="gap-1 font-cairo">
              <Save className="h-4 w-4" />
              {saving ? '...' : (isAr ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileManagementPage;
