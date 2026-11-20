import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Home, MapPin, Menu, Package, Phone, ShoppingBag, Users, X } from 'lucide-react';
import logo from '@/assets/el-wageh-brand.png';

interface PublicSiteHeaderProps {
  onBook?: () => void;
  onBookings?: () => void;
}

const navigation = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/about', label: 'من نحن', icon: Users },
  { path: '/team', label: 'فريقنا', icon: Users },
  { path: '/home#showcase-products', label: 'منتجاتنا', icon: Package },
  { path: '/branches', label: 'فروعنا', icon: MapPin },
  { path: '/contact', label: 'تواصل معنا', icon: Phone },
];

const PublicSiteHeader: React.FC<PublicSiteHeaderProps> = ({ onBook, onBookings }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    if (path === '/') return location.pathname === '/' && !location.hash;
    if (path === '/home#showcase-products') {
      return location.pathname === '/home' && location.hash === '#showcase-products';
    }
    return location.pathname === path;
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const book = () => {
    if (onBook) {
      onBook();
    } else {
      navigate('/repair-booking?step=form');
    }
    setMobileNavOpen(false);
  };

  const showBookings = () => {
    if (onBookings) {
      onBookings();
    } else {
      navigate('/repair-booking?view=bookings');
    }
    setMobileNavOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[82px] border-b-2 border-red-600 bg-[#090909] text-white shadow-lg">
      <div dir="ltr" className="relative mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-6">
        <div className="pointer-events-none absolute inset-y-0 left-[34%] w-14 -skew-x-[35deg] bg-red-600/90" />
        <button onClick={() => navigateTo('/')} className="relative z-10 flex shrink-0 items-center" aria-label="الوجيه - الرئيسية">
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
        </nav>

        <div dir="rtl" className="relative z-10 flex items-center gap-2 lg:hidden">
          <button onClick={book} className="flex h-10 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-bold text-white">
            <Calendar className="h-4 w-4" /> احجز الآن
          </button>
          <button
            onClick={() => setMobileNavOpen(open => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 text-white"
            aria-label={mobileNavOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <nav dir="rtl" className="public-mobile-menu absolute inset-x-0 top-full z-50 grid gap-1 border-t border-white/10 bg-[#090909] p-3 shadow-xl lg:hidden">
            {navigation.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigateTo(path)}
                aria-current={isActive(path) ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold ${isActive(path) ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
            <button onClick={showBookings} className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-white hover:bg-white/10">
              <ShoppingBag className="h-4 w-4" /> حجوزاتي
            </button>
          </nav>
        )}
      </div>
      </header>
      <div aria-hidden="true" className="h-[82px]" />
    </>
  );
};

export default PublicSiteHeader;
