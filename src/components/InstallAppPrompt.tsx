import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { captureInstallPrompt, subscribeToInstallPrompt, type InstallPromptEvent } from '@/lib/pwaInstall';

const InstallAppPrompt: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobileBrowser = isIos || /android/i.test(navigator.userAgent);
  const hasPublicBottomNav = [
    '/',
    '/home',
    '/repair-booking',
    '/about',
    '/team',
    '/branches',
    '/contact',
  ].includes(location.pathname);

  useEffect(() => {
    const unsubscribe = subscribeToInstallPrompt(setInstallEvent);
    const onInstallAvailable = (event: InstallPromptEvent) => {
      captureInstallPrompt(event);
    };
    const onInstalled = () => {
      localStorage.setItem('elwageh:show-welcome', '1');
      localStorage.setItem('elwageh:show-rating-prompt', '1');
      localStorage.setItem('elwageh:show-mobile-permissions', '1');
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onInstallAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', onInstallAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!isMobileBrowser || dismissed || window.matchMedia('(display-mode: standalone)').matches || (!installEvent && !isIos)) return null;

  return (
    <>
      <aside
        className={`pwa-install-banner fixed inset-x-3 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-[#111] p-3 text-white shadow-2xl ${
          hasPublicBottomNav ? 'bottom-[80px] sm:bottom-3' : 'bottom-3'
        }`}
        dir="rtl"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#090909]">
          <img src="/install-banner-logo-v2.png" alt="الوجيه" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-cairo text-sm font-bold">نزّل تطبيق الوجيه</p>
          <p className="font-cairo text-[11px] text-white/70">وصول أسرع من شاشة الموبايل</p>
        </div>
        <button onClick={() => navigate('/download')} className="rounded-lg bg-white px-3 py-2 font-cairo text-xs font-bold text-black">
          تحميل
        </button>
        <button onClick={() => setDismissed(true)} aria-label="إغلاق" className="rounded-lg p-2 text-white/70 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </aside>
    </>
  );
};

export default InstallAppPrompt;
