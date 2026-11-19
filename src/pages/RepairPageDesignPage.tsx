import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Palette, Type, MessageCircle, MapPin, CheckCircle, Save, Eye } from 'lucide-react';

const settingLabels: Record<string, { ar: string; en: string; icon: React.ElementType; group: string }> = {
  page_title: { ar: 'عنوان الصفحة', en: 'Page Title', icon: Type, group: 'header' },
  page_subtitle: { ar: 'العنوان الفرعي', en: 'Subtitle', icon: Type, group: 'header' },
  primary_color: { ar: 'اللون الأساسي (HSL)', en: 'Primary Color (HSL)', icon: Palette, group: 'style' },
  welcome_message: { ar: 'رسالة الترحيب (الشات)', en: 'Welcome Message (Chat)', icon: MessageCircle, group: 'content' },
  chat_placeholder: { ar: 'نص حقل الشات', en: 'Chat Placeholder', icon: MessageCircle, group: 'content' },
  button_text: { ar: 'نص زر الحجز', en: 'Booking Button Text', icon: CheckCircle, group: 'content' },
  success_title: { ar: 'عنوان نجاح الحجز', en: 'Success Title', icon: CheckCircle, group: 'content' },
  success_message: { ar: 'رسالة نجاح الحجز', en: 'Success Message', icon: CheckCircle, group: 'content' },
  footer_text: { ar: 'نص الفوتر', en: 'Footer Text', icon: Type, group: 'content' },
  branch_name: { ar: 'اسم الفرع', en: 'Branch Name', icon: MapPin, group: 'branch' },
  branch_address: { ar: 'عنوان الفرع', en: 'Branch Address', icon: MapPin, group: 'branch' },
  branch_phone: { ar: 'هاتف الفرع', en: 'Branch Phone', icon: MapPin, group: 'branch' },
  branch_map_url: { ar: 'رابط الخريطة', en: 'Map URL', icon: MapPin, group: 'branch' },
};

const groups = [
  { key: 'header', ar: 'الهيدر والعنوان', en: 'Header & Title', icon: Type },
  { key: 'style', ar: 'الألوان والتصميم', en: 'Colors & Style', icon: Palette },
  { key: 'content', ar: 'النصوص والمحتوى', en: 'Text & Content', icon: MessageCircle },
  { key: 'branch', ar: 'بيانات الفرع', en: 'Branch Info', icon: MapPin },
];

const RepairPageDesignPage: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('repair_page_settings').select('*');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { map[r.setting_key] = r.setting_value; });
        setSettings(map);
        setOriginal(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    const changedKeys = Object.keys(settings).filter(k => settings[k] !== original[k]);
    
    for (const key of changedKeys) {
      await supabase
        .from('repair_page_settings')
        .update({ setting_value: settings[key], updated_at: new Date().toISOString() })
        .eq('setting_key', key);
    }
    
    setOriginal({ ...settings });
    setSaving(false);
    toast({ title: lang === 'ar' ? 'تم الحفظ بنجاح ✅' : 'Saved successfully ✅' });
  };

  const previewColor = settings.primary_color || '0 72% 51%';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-cairo text-foreground">
          {lang === 'ar' ? 'تصميم صفحة حجز الإصلاح' : 'Repair Page Design'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-cairo gap-1" onClick={() => window.open('/repair-booking', '_blank')}>
            <Eye className="h-4 w-4" />
            {lang === 'ar' ? 'معاينة' : 'Preview'}
          </Button>
          <Button size="sm" className="font-cairo gap-1" onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4" />
            {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
          </Button>
        </div>
      </div>

      {/* Color Preview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl shadow-md" style={{ backgroundColor: `hsl(${previewColor})` }} />
            <div>
              <p className="font-cairo font-bold text-sm">{lang === 'ar' ? 'معاينة اللون الأساسي' : 'Primary Color Preview'}</p>
              <p className="text-xs text-muted-foreground font-cairo">HSL: {previewColor}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {groups.map(group => {
        const groupSettings = Object.keys(settingLabels).filter(k => settingLabels[k].group === group.key);
        const GroupIcon = group.icon;
        return (
          <Card key={group.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-cairo flex items-center gap-2">
                <GroupIcon className="h-5 w-5 text-primary" />
                {lang === 'ar' ? group.ar : group.en}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupSettings.map(key => {
                const meta = settingLabels[key];
                const Icon = meta.icon;
                const isTextarea = key === 'welcome_message';
                return (
                  <div key={key} className="space-y-1.5">
                    <label className="text-sm font-cairo font-medium flex items-center gap-1.5 text-foreground">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {lang === 'ar' ? meta.ar : meta.en}
                    </label>
                    {isTextarea ? (
                      <Textarea
                        value={settings[key] || ''}
                        onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                        className="font-cairo min-h-[100px]"
                        dir="rtl"
                      />
                    ) : (
                      <Input
                        value={settings[key] || ''}
                        onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                        className="font-cairo"
                        dir={key === 'branch_map_url' || key === 'primary_color' ? 'ltr' : 'rtl'}
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RepairPageDesignPage;
