import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Phone, Camera, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { lang } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    
    supabase
      .from('profiles')
      .select('name, phone, avatar_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || '');
          setPhone(data.phone || '');
          setAvatarUrl(data.avatar_url || '');
        }
      });
  }, [user]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;

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
      // حذف الصورة القديمة إن وجدت
      const { data: files } = await supabase.storage
        .from('profile-photos')
        .list(user.id);

      if (files && files.length > 0) {
        await supabase.storage
          .from('profile-photos')
          .remove(files.map(f => `${user.id}/${f.name}`));
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
      const path = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { 
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'فشل رفع الملف / Upload failed');
      }

      // الحصول على الرابط العام
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      // تحديث قاعدة البيانات
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(updateError.message || 'فشل تحديث قاعدة البيانات / Database update failed');
      }

      setAvatarUrl(publicUrl);
      toast({ title: isAr ? 'تم رفع الصورة ✅' : 'Photo uploaded ✅' });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ 
        title: isAr ? 'خطأ في رفع الصورة' : 'Upload error', 
        description: err.message || (isAr ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'),
        variant: 'destructive' 
      });
    }
    setUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update email if changed
      if (email !== user.email && email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({ title: isAr ? 'كلمة المرور غير متطابقة' : 'Passwords do not match', variant: 'destructive' });
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast({ title: isAr ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Password too short (min 6)', variant: 'destructive' });
          setSaving(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }

      // Update name (phone is admin-only for employees)
      await supabase
        .from('profiles')
        .update({ name })
        .eq('user_id', user.id);

      // Admin can update their own phone
      if (userRole === 'admin') {
        await supabase
          .from('profiles')
          .update({ phone })
          .eq('user_id', user.id);
      }

      toast({ title: isAr ? 'تم حفظ البيانات ✅' : 'Profile saved ✅' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: isAr ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-cairo text-foreground">
        {isAr ? 'الملف الشخصي' : 'Profile'}
      </h1>

      <Card className="p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-primary/30 hover:border-primary transition-colors"
            onClick={() => !uploading && fileRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
          <p className="text-xs text-muted-foreground font-cairo">
            {uploading
              ? (isAr ? 'جاري الرفع...' : 'Uploading...')
              : (isAr ? 'اضغط لتغيير الصورة' : 'Click to change photo')}
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-cairo font-medium flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> {isAr ? 'الاسم' : 'Name'}
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-cairo" />
        </div>

        {/* Phone (read-only for employees) */}
        <div className="space-y-2">
          <label className="text-sm font-cairo font-medium flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> {isAr ? 'رقم الهاتف' : 'Phone'}
            {userRole !== 'admin' && (
              <span className="text-xs text-muted-foreground ms-1">
                ({isAr ? 'يمكن للأدمن تغييره فقط' : 'Admin can change'})
              </span>
            )}
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={userRole !== 'admin'}
            className="font-cairo"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-cairo font-medium flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> {isAr ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-cairo" />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-cairo font-medium flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> {isAr ? 'كلمة مرور جديدة' : 'New Password'}
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={isAr ? 'اتركها فارغة لعدم التغيير' : 'Leave blank to keep current'}
            className="font-cairo"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-cairo font-medium flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter password'}
            className="font-cairo"
          />
        </div>

        <Button onClick={saveProfile} disabled={saving || uploading} className="w-full gap-2 font-cairo">
          <Save className="h-4 w-4" />
          {saving ? '...' : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
        </Button>
      </Card>
    </div>
  );
};

export default ProfilePage;
