import React, { useEffect, useState } from 'react';
import { Bell, Camera, MapPin, ShieldCheck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerAppUpdatePush } from '@/lib/appUpdatePush';

const pendingKey = 'elwageh:show-mobile-permissions';
const decisionsKey = 'elwageh:mobile-permission-decisions';

type PermissionChoice = 'allow' | 'while-using' | 'deny';

interface PermissionDecisions {
  location: PermissionChoice;
  camera: PermissionChoice;
  notifications: PermissionChoice;
}

const defaultDecisions: PermissionDecisions = {
  location: 'deny',
  camera: 'deny',
  notifications: 'deny',
};

const MobilePermissionsPrompt: React.FC = () => {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!standalone || localStorage.getItem(pendingKey) !== '1') return;

    const timer = window.setTimeout(() => setVisible(true), 3300);
    return () => window.clearTimeout(timer);
  }, []);

  const saveAndClose = async (selectedChoice: PermissionChoice) => {
    const decisions: PermissionDecisions =
      selectedChoice === 'allow'
        ? { location: 'allow', camera: 'allow', notifications: 'allow' }
        : selectedChoice === 'while-using'
          ? { location: 'while-using', camera: 'while-using', notifications: 'while-using' }
          : defaultDecisions;

    localStorage.setItem(decisionsKey, JSON.stringify(decisions));
    localStorage.removeItem(pendingKey);

    if (selectedChoice !== 'deny') {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }

      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // The browser can decline notification permission requests.
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          await registerAppUpdatePush();
        } catch (error) {
          console.error('Unable to enable app update notifications', error);
          toast({
            title: 'تعذر تفعيل إشعارات تحديث التطبيق',
            description: 'تأكد من إعداد الإشعارات واتصال الإنترنت، ثم حاول مرة أخرى.',
            variant: 'destructive',
          });
        }
      }

      if (selectedChoice === 'allow' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          // Camera access remains optional and is requested again by the attendance page.
        }
      }
    }

    setVisible(false);
  };

  const close = () => {
    localStorage.setItem(decisionsKey, JSON.stringify(defaultDecisions));
    localStorage.removeItem(pendingKey);
    setVisible(false);
  };

  if (!visible) return null;

  const permissions = [
    { icon: MapPin, label: 'الموقع', description: 'لتحديد الحضور وتتبع الموقع' },
    { icon: Camera, label: 'الكاميرا', description: 'لالتقاط صور الحضور والملفات' },
    { icon: Bell, label: 'الإشعارات', description: 'لتنبيهك بالمواعيد والمهام' },
  ];

  return (
    <div
      className="fixed inset-0 z-[230] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-permissions-title"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-t-[28px] border border-white/70 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px]">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 text-right">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-red-600">صلاحيات التطبيق</p>
              <h2 id="mobile-permissions-title" className="mt-1 font-cairo text-xl font-black">
                اختر السماح للأذونات
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {permissions.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 text-right">
                <p className="font-cairo text-sm font-bold">{label}</p>
                <p className="text-xs leading-5 text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => void saveAndClose('allow')}
            className="rounded-xl bg-red-600 px-4 py-3 font-cairo text-sm font-bold text-white"
          >
            السماح
          </button>
          <button
            type="button"
            onClick={() => void saveAndClose('while-using')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-cairo text-sm font-bold text-slate-800"
          >
            السماح أثناء استخدام التطبيق فقط
          </button>
          <button
            type="button"
            onClick={() => void saveAndClose('deny')}
            className="rounded-xl px-4 py-3 font-cairo text-sm font-bold text-slate-500"
          >
            عدم السماح
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePermissionsPrompt;
