import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const AppUpdatePrompt: React.FC = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!standalone) return;
    if (!('serviceWorker' in navigator)) return;

    let controllerChanged = false;
    const reloadOnce = () => {
      if (controllerChanged) return;
      controllerChanged = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

    const inspectRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setDismissed(false);
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(installing);
            setDismissed(false);
          }
        });
      });

      void registration.update().catch(error => {
        console.error('Unable to check for app updates', error);
      });
    };

    void navigator.serviceWorker.ready.then(inspectRegistration).catch(error => {
      console.error('Unable to access the app update registration', error);
    });

    const checkForUpdates = () => {
      void navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) inspectRegistration(registration);
      });
    };

    document.addEventListener('visibilitychange', checkForUpdates);
    const interval = window.setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', reloadOnce);
      document.removeEventListener('visibilitychange', checkForUpdates);
      window.clearInterval(interval);
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  const updateApp = () => {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[240] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-[#111] p-3 text-white shadow-2xl sm:bottom-5"
      dir="rtl"
      role="dialog"
      aria-modal="false"
      aria-label="تحديث التطبيق"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600">
        <RefreshCw className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-cairo text-sm font-bold">يتوفر تحديث جديد للتطبيق</p>
        <p className="font-cairo text-[11px] text-white/70">اضغط تحديث للحصول على آخر الميزات</p>
      </div>
      <button
        type="button"
        onClick={updateApp}
        className="rounded-lg bg-white px-3 py-2 font-cairo text-xs font-bold text-black"
      >
        تحديث
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إغلاق"
        className="rounded-lg p-2 text-white/70 hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
};

export default AppUpdatePrompt;
