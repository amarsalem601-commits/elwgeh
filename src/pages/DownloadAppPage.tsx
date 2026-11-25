import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowDownToLine, Check, ChevronLeft, Clock3, Share, ShieldCheck, Smartphone } from 'lucide-react';
import { promptToInstall, subscribeToInstallPrompt, type InstallPromptEvent } from '@/lib/pwaInstall';
import HoloMosaic from '@/components/HoloMosaic/HoloMosaic';

const isInstalledApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && navigator.standalone === true);

const DownloadAppPage: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installAccepted, setInstallAccepted] = useState(false);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const unsubscribe = subscribeToInstallPrompt(setInstallEvent);
    const onAppInstalled = () => setInstallAccepted(true);

    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      unsubscribe();
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isInstalledApp()) return <Navigate to="/home" replace />;

  const download = async () => {
    if (isIos || !installEvent) {
      setShowInstructions(true);
      return;
    }

    const choice = await promptToInstall();
    if (choice?.outcome === 'accepted') setInstallAccepted(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090909] text-white" dir="rtl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(220,38,38,.22),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <a href="/home" className="inline-flex items-center gap-2 font-cairo text-sm font-bold text-white/70 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
            العودة للموقع
          </a>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-cairo text-xs text-white/60">
            التطبيق الرسمي
          </span>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
          <div className="order-2 text-center md:order-1 md:text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 font-cairo text-xs font-bold text-red-300">
              <Smartphone className="h-4 w-4" />
              الوجيه على موبايلك
            </div>
            <h1 className="font-cairo text-3xl font-black leading-[1.5] sm:text-4xl lg:text-5xl">
              كل خدمات الوجيه،
              <span className="block text-red-500">أقرب وأسهل</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-cairo text-base leading-8 text-white/65 md:mx-0">
              ثبّت تطبيق الوجيه على شاشة موبايلك واحجز الصيانة، وتابع خدماتنا بسهولة في أي وقت.
            </p>

            <button
              type="button"
              onClick={() => void download().catch(error => console.error('Unable to install the app', error))}
              className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-3 font-cairo text-base font-black text-white shadow-xl shadow-red-950/40 transition hover:bg-red-500 sm:w-auto"
            >
              {installAccepted ? <Check className="h-5 w-5" /> : <ArrowDownToLine className="h-5 w-5" />}
              {installAccepted ? 'تم بدء التثبيت' : 'تحميل التطبيق'}
            </button>

            {showInstructions && (
              <div role="status" className="mx-auto mt-4 max-w-lg rounded-2xl border border-white/10 bg-white/5 p-4 text-right font-cairo text-sm leading-7 text-white/75 md:mx-0">
                {isIos ? (
                  <>
                    <p className="font-bold text-white">لتثبيت التطبيق على iPhone:</p>
                    <p>اضغط «مشاركة» في Safari، ثم اختر «إضافة إلى الشاشة الرئيسية» واضغط «إضافة».</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-white">لتثبيت التطبيق على Android:</p>
                    <p>افتح قائمة المتصفح ⋮ واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>
                  </>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-3 font-cairo text-xs text-white/55 md:justify-start">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> تثبيت مجاني</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> آمن ورسمي</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-emerald-400" /> وصول أسرع</span>
            </div>
          </div>

          <div className="order-1 mx-auto w-full max-w-sm md:order-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[.08] to-white/[.02] p-5 shadow-2xl shadow-black/40">
              <div className="absolute inset-x-10 top-0 h-32 bg-red-600/20 blur-3xl" />
              <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090909]">
                <HoloMosaic
                  color="#090909"
                  metalColor="#f4f4f5"
                  spectrum="warm"
                  tileSize={0.85}
                  gap={0.06}
                  roundness={0.18}
                  bevel={0.55}
                  scatter={0.45}
                  tilt={0.28}
                  saturation={0.22}
                  intensity={1.35}
                  ripple={0.7}
                  glitter={0.9}
                  sheen={0.85}
                  grain={0.06}
                  speed={0.45}
                  fade={0.08}
                  intro
                  mouseInteraction
                  flipOnClick
                />
                <img
                  src="/brand-logo.png"
                  alt="شعار الوجيه لمنظمات الهواء"
                  className="pointer-events-none absolute inset-[18%] h-[64%] w-[64%] object-contain drop-shadow-2xl"
                />
              </div>
              <div className="relative mt-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
                <p className="font-cairo text-lg font-black">الوجيه لمنظمات الهواء</p>
                <p className="mt-1 font-cairo text-sm text-white/55">Air Brake &amp; Clutch Servo</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 font-cairo text-xs text-white/45">
              <Share className="h-4 w-4" />
              متاح للتثبيت على أجهزة Android و iPhone
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-4 text-center font-cairo text-xs text-white/35">
          الوجيه لمنظمات الهواء · التطبيق الرسمي
        </footer>
      </div>
    </main>
  );
};

export default DownloadAppPage;
