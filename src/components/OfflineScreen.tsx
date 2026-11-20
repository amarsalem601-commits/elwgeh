import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && (
        <div role="status" aria-live="polite" className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-xs font-bold text-black font-cairo">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>أنت غير متصل. الصفحات والمحتوى المحفوظ متاحان، لكن الحجز والتعديلات تحتاج إلى الإنترنت.</span>
        </div>
      )}
      {children}
    </>
  );
};

export default OfflineScreen;
