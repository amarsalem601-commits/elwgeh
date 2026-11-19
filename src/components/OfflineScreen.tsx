import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OfflineScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRetry = () => {
    setRefreshing(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
      setRefreshing(false);
    }, 1500);
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
        <div className="text-center max-w-sm space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-cairo text-foreground">
              لا يوجد اتصال بالإنترنت
            </h1>
            <p className="text-sm text-muted-foreground font-cairo">
              يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى
            </p>
          </div>
          <Button
            onClick={handleRetry}
            disabled={refreshing}
            className="gap-2 font-cairo"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'جاري المحاولة...' : 'إعادة المحاولة'}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OfflineScreen;
