import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Home, MapPin, Menu, Phone, Users, X } from 'lucide-react';
import logo from '@/assets/el-wageh-logo.jpeg';

const PublicPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigation = [
    { path: '/repair-booking', label: 'الرئيسية', icon: Home },
    { path: '/about', label: 'من نحن', icon: Users },
    { path: '/branches', label: 'فروعنا', icon: MapPin },
    { path: '/contact', label: 'تواصل معنا', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <header className="sticky top-0 z-50 border-b-2 border-red-600 bg-[#090909] text-white shadow-lg">
        <div dir="ltr" className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-6">
          <div className="pointer-events-none absolute inset-y-0 left-[34%] w-14 -skew-x-[35deg] bg-red-600/90" />
          <button onClick={() => navigate('/repair-booking')} className="relative z-10 flex shrink-0 items-center" aria-label="الوجيه - الرئيسية">
            <img src={logo} alt="الوجيه" className="h-14 w-[4.5rem] object-contain" />
            <span dir="rtl" className="mr-2 hidden text-right leading-tight sm:block">
              <span className="block text-lg font-black text-white">الوجيه</span>
              <span className="block text-xs font-bold text-white/85">لمنظمات الهواء</span>
              <span dir="ltr" className="mt-0.5 inline-block rounded-sm bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white">Air Brake &amp; Clutch Servo</span>
            </span>
          </button>
          <nav dir="rtl" className="relative z-10 hidden items-center gap-1 lg:flex">
            {navigation.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <button key={path} onClick={() => navigate(path)} className={`flex h-11 items-center gap-2 rounded-md px-4 text-sm font-bold transition-colors ${isActive ? 'rounded-b-xl bg-red-600 text-white' : 'text-white/85 hover:bg-white/10'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              );
            })}
            <button onClick={() => navigate('/repair-booking')} className="flex h-11 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700">
              <Calendar className="h-4 w-4" /> احجز موعد إصلاح
            </button>
          </nav>
          <div dir="rtl" className="relative z-10 flex items-center gap-2 lg:hidden">
            <button onClick={() => navigate('/repair-booking')} className="flex h-10 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-bold text-white">
              <Calendar className="h-4 w-4" /> احجز الآن
            </button>
            <button onClick={() => setMobileNavOpen(open => !open)} className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 text-white" aria-label={mobileNavOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={mobileNavOpen}>
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {mobileNavOpen && (
            <nav dir="rtl" className="absolute inset-x-0 top-full z-50 grid gap-1 border-t border-white/10 bg-[#090909] p-3 shadow-xl lg:hidden">
              {navigation.map(({ path, label, icon: Icon }) => (
                <button key={path} onClick={() => { navigate(path); setMobileNavOpen(false); }} className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${location.pathname === path ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 pb-24 lg:px-6">
        <button onClick={() => navigate('/repair-booking')} className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-red-600">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </button>
        {children}
      </main>

      <footer className="py-4 text-center border-t border-border bg-card">
        <p className="text-xs font-cairo text-muted-foreground">
          © 2026 الوجيه لمنظمات الهواء — جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
};

export default PublicPageLayout;
