import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sun, Moon, Globe, User, Database, Users as UsersIcon, UserCheck,
  Wrench, Palette, LogOut, Bell, Building2, Settings as SettingsIcon,
  ShieldCheck, ChevronLeft, ChevronRight
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { t, lang, setLang, isRTL } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { logout, userRole, user } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  const adminLinks = [
    { icon: User, label: isAr ? 'الملف الشخصي' : 'My Profile', desc: isAr ? 'تعديل بياناتك الشخصية' : 'Edit your details', path: '/profile', color: 'bg-emerald-500' },
    { icon: UsersIcon, label: isAr ? 'إدارة الملفات الشخصية' : 'Profile Management', desc: isAr ? 'إدارة ملفات الموظفين' : 'Manage employee profiles', path: '/profile-management', color: 'bg-pink-500' },
    { icon: UserCheck, label: isAr ? 'الموظفين والصلاحيات' : 'Employees & Permissions', desc: isAr ? 'إدارة الموظفين وصلاحياتهم' : 'Manage employees', path: '/employees', color: 'bg-blue-500' },
    { icon: ShieldCheck, label: isAr ? 'إدارة الفريق' : 'Team Management', desc: isAr ? 'إدارة فريق العمل العام' : 'Public team page', path: '/team-management', color: 'bg-violet-500' },
    { icon: Building2, label: isAr ? 'منتجات الصفحة العامة' : 'Public Showcase Products', desc: isAr ? 'إضافة وتعديل المنتجات المعروضة للزوار' : 'Manage products shown to visitors', path: '/showcase-products', color: 'bg-red-600' },
    { icon: Wrench, label: isAr ? 'تصميم صفحة الحجز' : 'Booking Page Design', desc: isAr ? 'تخصيص صفحة الحجز العامة' : 'Customize public booking page', path: '/repair-design', color: 'bg-amber-500' },
    { icon: Database, label: isAr ? 'قاعدة البيانات' : 'Database', desc: isAr ? 'استعراض وتعديل البيانات' : 'Browse and edit data', path: '/database', color: 'bg-zinc-700' },
    { icon: Building2, label: isAr ? 'المخازن' : 'Warehouses', desc: isAr ? 'إدارة الفروع والمخازن' : 'Manage branches & stock', path: '/warehouses', color: 'bg-orange-500' },
    { icon: Bell, label: isAr ? 'الإشعارات' : 'Notifications', desc: isAr ? 'إرسال إشعارات للموظفين' : 'Send notifications', path: '/notifications', color: 'bg-fuchsia-500' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-cairo">{t('nav.settings')}</h1>
          <p className="text-xs text-muted-foreground font-cairo">
            {isAr ? 'تخصيص النظام والوصول السريع للأقسام' : 'Customize the system & quick access'}
          </p>
        </div>
      </div>

      {/* Account Info */}
      <Card className="p-5 shadow-sm border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg font-cairo">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-cairo font-bold truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground font-cairo">
              {userRole === 'admin' ? (isAr ? '👑 مدير النظام' : '👑 Admin') : (isAr ? '👤 موظف' : '👤 Employee')}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/profile')} className="font-cairo gap-1">
            <User className="h-4 w-4" /> {isAr ? 'الملف' : 'Profile'}
          </Button>
        </div>
      </Card>

      {/* Appearance & Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-foreground font-cairo">{t('settings.appearance')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={!isDark ? 'default' : 'outline'}
              onClick={() => isDark && toggleTheme()}
              className="font-cairo gap-2"
            >
              <Sun className="h-4 w-4" /> {t('lightMode')}
            </Button>
            <Button
              variant={isDark ? 'default' : 'outline'}
              onClick={() => !isDark && toggleTheme()}
              className="font-cairo gap-2"
            >
              <Moon className="h-4 w-4" /> {t('darkMode')}
            </Button>
          </div>
        </Card>

        <Card className="p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-foreground font-cairo">{t('settings.language')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={lang === 'ar' ? 'default' : 'outline'}
              onClick={() => setLang('ar')}
              className="font-cairo"
            >
              العربية
            </Button>
            <Button
              variant={lang === 'en' ? 'default' : 'outline'}
              onClick={() => setLang('en')}
              className="font-cairo"
            >
              English
            </Button>
          </div>
        </Card>
      </div>

      {/* Admin Quick Access */}
      {userRole === 'admin' && (
        <div>
          <h3 className="font-bold font-cairo text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {isAr ? 'إعدادات الإدارة' : 'Admin Settings'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {adminLinks.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-start group"
              >
                <div className={`${item.color} text-white p-2 rounded-lg shrink-0`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cairo font-bold text-sm truncate">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground font-cairo truncate">{item.desc}</p>
                </div>
                <Chevron className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <Card className="p-4 border-destructive/30">
        <Button
          variant="destructive"
          onClick={logout}
          className="w-full font-cairo gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;
