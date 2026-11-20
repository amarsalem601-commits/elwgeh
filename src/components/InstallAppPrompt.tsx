import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

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
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobileBrowser = isIos || /android/i.test(navigator.userAgent);

  useEffect(() => {
    const onInstallAvailable = (event: InstallPromptEvent) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => setInstallEvent(null);
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
      <aside className="pwa-install-banner fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-[#111] p-3 text-white shadow-2xl" dir="rtl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600">
          <Download className="h-5 w-5" />
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
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" dir="rtl">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Share className="h-5 w-5 text-red-600" />
              <h2 className="font-cairo font-bold">إضافة الوجيه إلى الشاشة الرئيسية</h2>
            </div>
            <p className="font-cairo text-sm leading-7 text-slate-600">من قائمة المشاركة في Safari اختر «إضافة إلى الشاشة الرئيسية»، ثم اضغط «إضافة».</p>
            <button onClick={() => setShowIosHelp(false)} className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 font-cairo font-bold text-white">حسناً</button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppPrompt;
