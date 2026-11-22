import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Calendar, Ellipsis, Home, MapPin, Menu, Package, Phone, ShoppingBag, Users, X } from 'lucide-react';
import logo from '@/assets/el-wageh-brand.png';

interface PublicSiteHeaderProps {
  onBook?: () => void;
  onBookings?: () => void;
}

const navigation = [
  { path: '/home', label: 'الرئيسية', icon: Home },
  { path: '/about', label: 'من نحن', icon: Users },
  { path: '/team', label: 'فريقنا', icon: Users },
  { path: '/public-products', label: 'منتجاتنا', icon: Package },
  { path: '/branches', label: 'فروعنا', icon: MapPin },
  { path: '/contact', label: 'تواصل معنا', icon: Phone },
];

const PublicSiteHeader: React.FC<PublicSiteHeaderProps> = ({ onBook, onBookings }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const updateMode = () => setIsStandalone(media.matches);
    updateMode();
    media.addEventListener('change', updateMode);
    return () => media.removeEventListener('change', updateMode);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home' && !location.hash;
    return location.pathname === path;
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  const book = () => {
    if (onBook) {
      onBook();
    } else {
      navigate('/repair-booking?step=form');
    }
  };

  const showBookings = () => {
    if (onBookings) {
      onBookings();
    } else {
      navigate('/repair-booking?view=bookings');
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[82px] border-b-2 border-red-600 bg-[#090909] text-white shadow-lg ${
          isStandalone ? 'hidden lg:block' : 'block'
        }`}
      >
      <div dir="ltr" className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-6">
        <div className="pointer-events-none absolute inset-y-0 left-[34%] w-14 -skew-x-[35deg] bg-red-600/90" />
        <button onClick={() => navigateTo('/home')} className="relative z-10 flex shrink-0 items-center" aria-label="الوجيه - الرئيسية">
          <img src={logo} alt="الوجيه" className="h-14 w-[4.5rem] object-contain" />
          <span dir="rtl" className="mr-2 hidden text-right leading-tight sm:block">
            <span className="block text-lg font-black text-white">الوجيه</span>
            <span className="block text-xs font-bold text-white/85">لمنظمات الهواء</span>
            <span dir="ltr" className="mt-0.5 inline-block rounded-sm bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white">Air Brake &amp; Clutch Servo</span>
          </span>
        </button>

        <nav dir="rtl" className="relative z-10 hidden items-center gap-0.5 lg:flex">
          {navigation.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigateTo(path)}
              aria-current={isActive(path) ? 'page' : undefined}
              className={`flex h-11 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-colors xl:gap-2 xl:px-3 xl:text-sm ${isActive(path) ? 'rounded-b-xl bg-red-600 text-white' : 'text-white/85 hover:bg-white/10'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
          <button onClick={showBookings} className="flex h-11 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold text-white/85 transition-colors hover:bg-white/10 xl:gap-2 xl:px-3 xl:text-sm">
            <ShoppingBag className="h-4 w-4 shrink-0" /> حجوزاتي
          </button>
          <button onClick={book} className="flex h-11 items-center gap-1.5 rounded-md bg-red-600 px-2.5 text-xs font-black text-white transition-colors hover:bg-red-700 xl:gap-2 xl:px-3 xl:text-sm">
            <Calendar className="h-4 w-4 shrink-0" /> احجز موعد إصلاح
          </button>
          {!isStandalone && (
            <button
              type="button"
              onClick={() => navigateTo('/download')}
              className="flex h-11 items-center gap-1.5 rounded-md border border-white/25 px-2.5 text-xs font-bold text-white transition-colors hover:border-red-500 hover:bg-white/10 xl:gap-2 xl:px-3 xl:text-sm"
            >
              <ArrowDownToLine className="h-4 w-4 shrink-0" />
              تحميل التطبيق
            </button>
          )}
        </nav>

        {!isStandalone && (
          <div dir="rtl" className="relative z-10 flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => navigateTo('/download')}
              className="flex h-10 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-black text-white"
            >
              <ArrowDownToLine className="h-4 w-4" />
              التطبيق
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 text-white"
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        )}

        {!isStandalone && mobileMenuOpen && (
          <nav
            dir="rtl"
            className="absolute inset-x-0 top-full z-50 grid gap-1 border-t border-white/10 bg-[#090909] p-3 shadow-xl lg:hidden"
          >
            {navigation.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigateTo(path)}
                aria-current={isActive(path) ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${
                  isActive(path) ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={showBookings}
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              <ShoppingBag className="h-4 w-4" />
              حجوزاتي
            </button>
          </nav>
        )}

      </div>
      </header>
      <div aria-hidden="true" className={isStandalone ? 'hidden lg:block lg:h-[82px]' : 'h-[82px]'} />

      {isStandalone && <nav
        dir="rtl"
        aria-label="التنقل الرئيسي للموبايل"
        className="fixed inset-x-0 bottom-0 z-[60] grid h-[68px] grid-cols-4 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] lg:hidden"
      >
        <button
          type="button"
          onClick={() => navigateTo('/home')}
          aria-current={location.pathname === '/home' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-1 font-cairo text-[11px] font-bold transition-colors ${
            location.pathname === '/home' ? 'text-red-600' : 'text-slate-500'
          }`}
        >
          {location.pathname === '/home' && <span className="absolute top-0 h-1 w-10 rounded-b-full bg-red-600" />}
          <Home className="h-5 w-5" strokeWidth={location.pathname === '/home' ? 2.5 : 2} />
          الرئيسية
        </button>
        <button
          type="button"
          onClick={book}
          aria-current={
            location.pathname === '/repair-booking' &&
            new URLSearchParams(location.search).get('view') !== 'bookings'
              ? 'page'
              : undefined
          }
          className={`relative flex flex-col items-center justify-center gap-1 font-cairo text-[11px] font-bold transition-colors ${
            location.pathname === '/repair-booking' &&
            new URLSearchParams(location.search).get('view') !== 'bookings'
              ? 'text-red-600'
              : 'text-slate-500'
          }`}
        >
          {location.pathname === '/repair-booking' &&
          new URLSearchParams(location.search).get('view') !== 'bookings' ? (
            <span className="absolute top-0 h-1 w-10 rounded-b-full bg-red-600" />
          ) : null}
          <Calendar
            className="h-5 w-5"
            strokeWidth={
              location.pathname === '/repair-booking' &&
              new URLSearchParams(location.search).get('view') !== 'bookings'
                ? 2.5
                : 2
            }
          />
          احجز الآن
        </button>
        <button
          type="button"
          onClick={showBookings}
          aria-current={location.pathname === '/repair-booking' && new URLSearchParams(location.search).get('view') === 'bookings' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-1 font-cairo text-[11px] font-bold transition-colors ${
            location.pathname === '/repair-booking' && new URLSearchParams(location.search).get('view') === 'bookings'
              ? 'text-red-600'
              : 'text-slate-500'
          }`}
        >
          {location.pathname === '/repair-booking' && new URLSearchParams(location.search).get('view') === 'bookings' && (
            <span className="absolute top-0 h-1 w-10 rounded-b-full bg-red-600" />
          )}
          <ShoppingBag
            className="h-5 w-5"
            strokeWidth={location.pathname === '/repair-booking' && new URLSearchParams(location.search).get('view') === 'bookings' ? 2.5 : 2}
          />
          حجوزاتي
        </button>
        <button
          type="button"
          onClick={() => setMoreOpen(open => !open)}
          aria-expanded={moreOpen}
          aria-controls="public-mobile-more"
          className={`relative flex flex-col items-center justify-center gap-1 font-cairo text-[11px] font-bold transition-colors ${
            moreOpen || navigation.slice(1).some(({ path }) => isActive(path))
              ? 'text-red-600'
              : 'text-slate-500'
          }`}
        >
          {moreOpen || navigation.slice(1).some(({ path }) => isActive(path)) ? (
            <span className="absolute top-0 h-1 w-10 rounded-b-full bg-red-600" />
          ) : null}
          {moreOpen ? <X className="h-5 w-5" /> : <Ellipsis className="h-5 w-5" />}
          المزيد
        </button>
      </nav>}

      {isStandalone && moreOpen && (
        <>
          <button
            type="button"
            aria-label="إغلاق المزيد"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-[58] bg-slate-950/25 backdrop-blur-[2px] lg:hidden"
          />
          <nav
            id="public-mobile-more"
            dir="rtl"
            aria-label="المزيد من الأقسام"
            className="fixed bottom-[76px] left-3 right-3 z-[59] grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_-12px_32px_rgba(15,23,42,0.18)] lg:hidden"
          >
            {navigation.slice(1).map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigateTo(path)}
                aria-current={isActive(path) ? 'page' : undefined}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 font-cairo text-sm font-bold transition-colors ${
                  isActive(path)
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive(path) ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </button>
            ))}
          </nav>
        </>
      )}
    </>
  );
};

export default PublicSiteHeader;
