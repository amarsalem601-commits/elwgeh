import React, { useEffect, useState } from 'react';
import appLogo from '@/assets/el-wageh-brand.png';

const pendingKey = 'elwageh:show-welcome';

const AppLaunchSplash: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!standalone) return;

    const pending = localStorage.getItem(pendingKey) === '1';
    if (!pending) return;

    localStorage.removeItem(pendingKey);
    setVisible(true);

    const speechTimer = window.setTimeout(() => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const message = new SpeechSynthesisUtterance('مرحباً بك في الوجيه');
      message.lang = 'ar-EG';
      message.rate = 0.82;
      message.pitch = 1;
      const arabicVoice = window.speechSynthesis
        .getVoices()
        .find(voice => voice.lang.toLowerCase().startsWith('ar'));
      if (arabicVoice) message.voice = arabicVoice;
      window.speechSynthesis.speak(message);
    }, 350);

    const closeTimer = window.setTimeout(() => setVisible(false), 2600);
    return () => {
      window.clearTimeout(speechTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#090909] px-8 text-center"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="ترحيب بتطبيق الوجيه"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,.18),transparent_55%)]" />
      <div className="relative flex flex-col items-center">
        <img
          src={appLogo}
          alt="الوجيه"
          className="w-[min(82vw,360px)] animate-[welcome-logo_700ms_cubic-bezier(.2,.8,.2,1)_both]"
        />
        <h1 className="mt-1 font-cairo text-2xl font-black text-white sm:text-3xl">
          مرحباً بك في الوجيه
        </h1>
        <div className="mt-5 h-1 w-20 overflow-hidden rounded-full bg-white/15">
          <div className="h-full animate-[welcome-line_1.8s_ease-in-out_both] rounded-full bg-red-600" />
        </div>
      </div>
    </div>
  );
};

export default AppLaunchSplash;
