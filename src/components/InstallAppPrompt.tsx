import React, { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import appIcon from '@/assets/el-wageh-brand.png';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: InstallPromptEvent;
  }
}

const InstallAppPrompt: React.FC = () => {
  const location = useLocation();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
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
    const onInstallAvailable = (event: InstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
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
      window.removeEventListener('beforeinstallprompt', onInstallAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!isMobileBrowser || dismissed || window.matchMedia('(display-mode: standalone)').matches || (!installEvent && !isIos)) return null;

  const install = async () => {
    if (!installEvent) {
      setShowIosHelp(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setInstallEvent(null);
  };

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
        <button onClick={() => void install().catch(error => console.error('Unable to install the app', error))} className="rounded-lg bg-white px-3 py-2 font-cairo text-xs font-bold text-black">
          تثبيت
        </button>
        <button onClick={() => setDismissed(true)} aria-label="إغلاق" className="rounded-lg p-2 text-white/70 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </aside>
      {showIosHelp && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" dir="rtl">
          <div className="w-full max-w-sm rounded-t-[28px] border border-white/70 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px]">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200 sm:hidden" />
            <div className="mb-4 flex items-center gap-3">
              <img src={appIcon} alt="" className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain p-1 shadow-sm" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs font-bold text-red-600">تثبيت التطبيق</p>
                <h2 className="font-cairo text-lg font-black">الوجيه على شاشتك</h2>
              </div>
              <button onClick={() => { localStorage.setItem('elwageh:show-welcome', '1'); localStorage.setItem('elwageh:show-rating-prompt', '1'); localStorage.setItem('elwageh:show-mobile-permissions', '1'); setShowIosHelp(false); }} aria-label="إغلاق" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Share className="h-5 w-5" /></span>
                <p className="font-cairo text-sm font-bold leading-6">اضغط زر المشاركة في Safari</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">2</span>
                <p className="font-cairo text-sm font-bold leading-6">اختر «إضافة إلى الشاشة الرئيسية»</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">3</span>
                <p className="font-cairo text-sm font-bold leading-6">اضغط «إضافة» للتثبيت</p>
              </div>
            </div>
            <button onClick={() => { localStorage.setItem('elwageh:show-welcome', '1'); localStorage.setItem('elwageh:show-rating-prompt', '1'); localStorage.setItem('elwageh:show-mobile-permissions', '1'); setShowIosHelp(false); }} className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 font-cairo font-bold text-white shadow-lg shadow-red-600/20">حسناً</button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppPrompt;
