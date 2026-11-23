import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Reveal from '@/components/Reveal';
import { Send, Wrench, Car, Phone, User, Calendar, MessageCircle, CheckCircle, ShoppingBag, MapPin, Clock, X, Shield, ChevronLeft, Settings, Truck } from 'lucide-react';
import brandLogo from '@/assets/el-wageh-brand.png';
import truckPhoto from '@/assets/volvo-truck.jpg';
import mechanicPhoto from '@/assets/mercedes-acros.jpg';
import { BRANCHES, CONTACT_BRANCHES, PHONES } from '@/data/companyInfo';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PublicSiteFooter from '@/components/PublicSiteFooter';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/repair-chat`;

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  confirmed: { label: 'مؤكد', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  in_progress: { label: 'جاري الإصلاح', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: Wrench },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: Clock },
};

const truckBrands = [
  { name: 'Mercedes-Benz', logo: 'mercedes.svg' },
  { name: 'Volvo Trucks', logo: 'volvo.svg' },
  { name: 'Scania', logo: 'scania.svg' },
  { name: 'MAN', logo: 'man.svg' },
  { name: 'Kenworth', logo: 'kenworth.png' },
  { name: 'DAF', logo: 'daf.svg' },
  { name: 'Iveco', logo: 'iveco.svg' },
  { name: 'Mack', logo: 'mack.png' },
  { name: 'Renault Trucks', logo: 'renault.svg' },
  { name: 'Isuzu', logo: 'isuzu.svg' },
  { name: 'Hino', logo: 'hino.svg' },
  { name: 'Mitsubishi Fuso', logo: 'mitsubishi.svg' },
  { name: 'Yutong', logo: 'yutong.png' },
  { name: 'Peterbilt', logo: 'peterbilt.png' },
];

const defaultSettings: Record<string, string> = {
  page_title: 'الوجيه لمنظمات الهواء',
  page_subtitle: 'مركز خدمة وصيانة منظمات الهواء',
  welcome_message: 'أهلاً بيك في الوجيه! 🚛\n\nأنا المساعد الذكي. قولي إيه مشكلة عربيتك وأنا هساعدك في التشخيص.',
  primary_color: '0 72% 51%',
  button_text: 'احجز موعد إصلاح الآن',
  footer_text: '© 2026 الوجيه لمنظمات الهواء — جميع الحقوق محفوظة',
  success_title: 'تم الحجز بنجاح!',
  success_message: 'هنتواصل معاك قريب لتأكيد الموعد. تقدر تتواصل معانا على الأرقام دي أو تزور أقرب فرع ليك.',
  chat_placeholder: 'اكتب مشكلة عربيتك...',
};

interface RepairBookingPageProps {
  mode?: 'home' | 'booking';
}

const RepairBookingPage: React.FC<RepairBookingPageProps> = ({ mode = 'booking' }) => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState(defaultSettings);
  const [step, setStep] = useState<'intro' | 'form' | 'done'>(() =>
    mode === 'home'
      ? 'intro'
      : new URLSearchParams(location.search).get('view') === 'bookings'
        ? 'done'
        : 'form'
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [showTracker, setShowTracker] = useState(() =>
    new URLSearchParams(location.search).get('view') === 'bookings'
  );
  const [trackerPhone, setTrackerPhone] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    car_type: '',
    car_model: '',
    problem_description: '',
    appointment_date: '',
  });

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (mode === 'home') {
      setStep('intro');
      setShowTracker(false);
    } else if (query.get('view') === 'bookings') {
      setStep('done');
      setShowTracker(true);
    } else {
      setStep('form');
      setShowTracker(false);
    }
  }, [location.search, mode]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('repair_page_settings').select('*');
      const map: Record<string, string> = { ...defaultSettings };
      if (data) data.forEach((r: any) => { map[r.setting_key] = r.setting_value; });
      setCfg(map);
      setMessages([{ role: 'assistant', content: map.welcome_message }]);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  const primaryColor = cfg.primary_color;

  const fetchCustomerBookings = async (phone: string) => {
    const { data } = await supabase
      .from('repair_bookings')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false });
    if (data) setCustomerBookings(data);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) {
        const errorBody = await resp.json().catch(() => null);
        throw new Error(errorBody?.error || `خدمة المساعد غير جاهزة (${resp.status})`);
      }
      if (!resp.body) throw new Error('لم يصل رد من خدمة المساعد');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      if (!assistantSoFar.trim()) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'لم يصل رد من المساعد. حاول مرة أخرى.' }]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'تعذر الاتصال بخدمة المساعد';
      const responseMessage = errorMessage === 'Failed to fetch'
        ? 'المساعد الذكي غير مفعّل على الخادم حالياً. يلزم نشر خدمة repair-chat وإعداد مفتاح الذكاء الاصطناعي في Supabase.'
        : `المساعد غير متاح حالياً: ${errorMessage}`;
      setMessages(prev => [
        ...prev.filter(message => message.role !== 'assistant' || message.content !== responseMessage),
        { role: 'assistant', content: responseMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitBooking = async () => {
    if (!form.customer_name || !form.customer_phone) {
      toast({ title: 'يرجى ملء الاسم ورقم الهاتف', variant: 'destructive' });
      return;
    }

    const chatSummary = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');

    const { data, error } = await supabase.from('repair_bookings').insert({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      car_type: form.car_type,
      car_model: form.car_model,
      problem_description: form.problem_description || chatSummary,
      appointment_date: form.appointment_date || null,
    }).select().single();

    if (error) {
      toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
      return;
    }

    if (data) {
      setBookingId(data.id);
      if (messages.length > 0) {
        const chatInserts = messages.map(m => ({
          booking_id: data.id,
          role: m.role,
          content: m.content,
        }));
        await supabase.from('repair_chat_messages').insert(chatInserts);
      }
    }

    setStep('done');
    setChatOpen(false);
    toast({ title: cfg.success_title + ' ✅' });
  };

  return (
    <div className="repair-booking-page min-h-screen bg-white text-slate-900" dir="rtl">
      <PublicSiteHeader
        onBook={
          mode === 'home'
            ? () => navigate('/repair-booking?step=form')
            : () => setStep('form')
        }
        onBookings={
          mode === 'home'
            ? () => navigate('/repair-booking?view=bookings')
            : () => {
                setShowTracker(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
        }
      />

      <main className={`repair-page-main space-y-5 sm:space-y-6 ${step === 'intro' ? 'pb-0' : 'px-3 py-4 pb-24 sm:px-4 lg:pb-28'}`}>
        {step === 'intro' && (
          <section
            aria-label="ماركات الشاحنات التي نخدمها"
            className="-mb-5 overflow-hidden border-y border-red-700/40 bg-[#090909] py-4 text-white sm:-mb-6 sm:py-5"
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-3 flex items-center justify-center gap-2 font-cairo text-xs font-bold text-white/75 sm:text-sm">
                <Truck className="h-4 w-4 text-red-500" />
                <span>خبرة في صيانة أشهر ماركات النقل الثقيل</span>
              </div>
              <div className="truck-brands-viewport" dir="ltr">
                <div className="truck-brands-track">
                  {[0, 1].map(copy => (
                    <div
                      key={copy}
                      aria-hidden={copy === 1}
                      className="flex shrink-0 items-center gap-3 pe-3 sm:gap-4 sm:pe-4"
                    >
                      {truckBrands.map(brand => (
                        <span
                          key={brand.name}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 font-sans text-sm font-extrabold tracking-wide text-white/90 sm:min-h-11 sm:gap-2.5 sm:px-4 sm:text-base"
                        >
                          {brand.logo ? (
                            <img
                              src={`/truck-brands/${brand.logo}`}
                              alt=""
                              aria-hidden="true"
                              className="h-7 w-7 shrink-0 rounded-full bg-white p-1"
                            />
                          ) : (
                            <Truck className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                          )}
                          {brand.name}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Booking Tracker */}
        {showTracker && (
          <Card className="mx-3 sm:mx-4" style={{ borderColor: `hsl(${primaryColor} / 0.2)` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-cairo flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" style={{ color: `hsl(${primaryColor})` }} />
                متابعة حجوزاتي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={trackerPhone}
                  onChange={e => setTrackerPhone(e.target.value)}
                  placeholder="ادخل رقم موبايلك..."
                  className="font-cairo"
                />
                <Button onClick={() => fetchCustomerBookings(trackerPhone)} className="font-cairo shrink-0" style={{ backgroundColor: `hsl(${primaryColor})` }}>
                  بحث
                </Button>
              </div>
              {customerBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground font-cairo text-center py-4">لا توجد حجوزات</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {customerBookings.map(b => {
                    const status = statusConfig[b.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                        <div className={`p-2 rounded-lg ${status.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-cairo font-medium text-sm">{b.car_type} {b.car_model}</span>
                            <Badge className={`${status.color} text-[10px]`}>{status.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-cairo truncate">{b.problem_description}</p>
                          <p className="text-[10px] text-muted-foreground font-cairo mt-0.5">
                            {new Date(b.created_at).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'intro' && (
          <>
            <Reveal>
              <section dir="ltr" className="grid overflow-hidden bg-black text-white md:min-h-[430px] md:grid-cols-2">
                <div className="relative aspect-[4/3] min-h-[230px] overflow-hidden sm:aspect-video md:aspect-auto md:min-h-[430px]">
                  <img src={truckPhoto} alt="شاحنة فولفو" className="absolute inset-0 h-full w-full object-cover object-[center_55%]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />
                  <Button onClick={() => setStep('form')} className="booking-hero-button absolute bottom-3 left-3 h-11 gap-2 rounded-full border-2 border-red-400 bg-red-600 px-4 text-sm font-black text-white shadow-xl hover:bg-red-700 sm:bottom-6 sm:left-6 sm:h-14 sm:px-8 sm:text-lg">
                    <Truck className="hover-truck h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>احجز صيانة الآن</span>
                  </Button>
                </div>
                <div dir="rtl" className="brand-hero-panel relative flex flex-col items-center justify-center overflow-hidden bg-[#080808] px-4 py-5 text-center sm:px-8 sm:py-7 md:py-8">
                  <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 18px, rgba(255,255,255,.04) 19px, transparent 20px)' }} />
                  <img src={brandLogo} alt="الوجيه لمنظمات الهواء" className="brand-hero-logo relative z-10 max-h-40 w-full max-w-[500px] object-contain sm:max-h-64" />
                  <p className="relative z-10 mt-1 text-xs font-bold text-white/80 sm:mt-2 sm:text-base">صيانة احترافية .. أداء أقوى .. أمان أعلى</p>
                  <div className="relative z-10 mt-3 grid w-full max-w-xl grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4">
                    {[
                      { icon: Wrench, label: 'فنيون متخصصون' },
                      { icon: Settings, label: 'أحدث المعدات' },
                      { icon: Shield, label: 'ضمان على الخدمة' },
                      { icon: Clock, label: 'خدمة سريعة' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex min-h-[54px] flex-row items-center justify-center gap-2 rounded-md bg-white px-2 py-2 text-[11px] font-black text-slate-900 sm:min-h-[64px] sm:flex-col sm:gap-1 sm:text-xs">
                        <Icon className="h-4 w-4 shrink-0 text-red-600 sm:h-5 sm:w-5" />{label}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>

            <Reveal>
              <section dir="ltr" className="mx-3 grid overflow-hidden rounded-lg border-y-2 border-red-600 bg-white sm:mx-4 md:mx-auto md:max-w-7xl md:grid-cols-[.9fr_1.1fr]">
                <div className="relative aspect-[4/3] min-h-[210px] overflow-hidden md:aspect-auto md:min-h-[270px]">
                  <img src={mechanicPhoto} alt="مرسيدس أكتروس أثناء الصيانة" className="absolute inset-0 h-full w-full object-cover object-center" />
                  <div className="absolute inset-0 border-[10px] border-red-600/90 md:border-[14px]" />
                </div>
                <div dir="rtl" className="flex flex-col justify-center px-4 py-6 text-right sm:px-8 md:py-10">
                  <p className="text-sm font-bold text-red-600">خبرة تثق بها على الطريق</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">لماذا تختار <span className="text-red-600">الوجيه؟</span></h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
                    لأننا نمتلك الخبرة والمهارة في صيانة منظمات الهواء والكلتش سيرفو، لنضمن لك معايير أعلى للأمان والأداء في النقل الثقيل.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['تشخيص دقيق للأعطال', 'قطع غيار موثوقة', 'ضمان على أعمال الصيانة', 'فروع قريبة منك'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-800"><CheckCircle className="h-4 w-4 shrink-0 text-red-600" />{item}</div>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>

            {/* Branches */}
            <Reveal>
              <section className="mx-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:mx-4 sm:p-6 md:mx-auto md:max-w-7xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">فروعنا</h3>
                    <p className="mt-1 text-sm text-slate-500">اختار أقرب فرع لك.</p>
                  </div>
                  <MapPin className="h-6 w-6 text-red-600" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {BRANCHES.map((branch) => (
                    <a key={branch.city} href={branch.mapUrl} target="_blank" rel="noreferrer" className="branch-location-card group flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-red-300 hover:bg-red-50/40">
                      <div className="branch-pin-wrap flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><MapPin className="branch-pin-icon h-5 w-5" /></div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900">{branch.city}</h4>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{branch.address}</p>
                      </div>
                      <ChevronLeft className="mr-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:-translate-x-1 group-hover:text-red-500" />
                    </a>
                  ))}
                </div>
              </section>
            </Reveal>

            {/* Contact */}
            <Reveal>
              <section className="mx-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-4 md:mx-auto md:max-w-7xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h3 className="text-xl font-black text-slate-900">تواصل معنا</h3>
                  <Phone className="h-6 w-6 text-red-600" />
                </div>
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  {CONTACT_BRANCHES.map((branch) => (
                    <div key={branch.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <h4 className="mb-2 flex items-center gap-2 font-cairo text-sm font-black text-slate-900">
                        <MapPin className="h-4 w-4 text-red-600" />
                        {branch.name}
                      </h4>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {branch.phones.map((phone) => (
                          <a key={phone} href={`tel:${phone}`} dir="ltr" className="flex items-center justify-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm font-black text-slate-800 shadow-sm hover:border-red-200 hover:text-red-700">
                            <Phone className="h-4 w-4 text-red-600" />
                            {phone}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          </>
        )}

        {step === 'form' && (
          <Card style={{ borderColor: `hsl(${primaryColor} / 0.2)` }}>
            <CardHeader>
              <CardTitle className="font-cairo flex items-center gap-2">
                <Wrench className="h-5 w-5" style={{ color: `hsl(${primaryColor})` }} />
                نموذج حجز إصلاح
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-cairo font-medium flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> الاسم *
                  </label>
                  <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="اسمك الكامل" className="font-cairo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-cairo font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> رقم الموبايل *
                  </label>
                  <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="01xxxxxxxxx" className="font-cairo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-cairo font-medium flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" /> نوع العربية
                  </label>
                  <Input value={form.car_type} onChange={e => setForm(f => ({ ...f, car_type: e.target.value }))} placeholder="مثال: مرسيدس، مان، فولفو" className="font-cairo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-cairo font-medium flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" /> الموديل
                  </label>
                  <Input value={form.car_model} onChange={e => setForm(f => ({ ...f, car_model: e.target.value }))} placeholder="مثال: 2020" className="font-cairo" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cairo font-medium">وصف المشكلة</label>
                <Textarea value={form.problem_description} onChange={e => setForm(f => ({ ...f, problem_description: e.target.value }))} placeholder="اوصف مشكلة العربية..." className="font-cairo" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-cairo font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> موعد مفضل
                </label>
                <Input type="datetime-local" value={form.appointment_date} onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={submitBooking} className="flex-1 font-cairo gap-2" style={{ backgroundColor: `hsl(${primaryColor})` }}>
                  <CheckCircle className="h-4 w-4" />
                  تأكيد الحجز
                </Button>
                <Button variant="outline" onClick={() => setStep('intro')} className="font-cairo">
                  رجوع
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <Card style={{ borderColor: `hsl(${primaryColor} / 0.2)` }} className="text-center py-10">
              <CardContent className="space-y-4">
                <div className="text-6xl">✅</div>
                <h2 className="text-2xl font-bold font-cairo" style={{ color: `hsl(${primaryColor})` }}>{cfg.success_title}</h2>
                <p className="text-muted-foreground font-cairo max-w-xl mx-auto">{cfg.success_message}</p>
                {bookingId && (
                  <p className="text-xs text-muted-foreground font-cairo">رقم الحجز: {bookingId.slice(0, 8)}</p>
                )}
              </CardContent>
            </Card>

            {/* Phones after booking */}
            <Card style={{ borderColor: `hsl(${primaryColor} / 0.2)` }}>
              <CardHeader>
                <CardTitle className="font-cairo flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5" style={{ color: `hsl(${primaryColor})` }} />
                  أرقام التواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PHONES.map(p => (
                  <a key={p} href={`tel:${p}`} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted transition-colors" dir="ltr">
                    <Phone className="h-4 w-4 shrink-0" style={{ color: `hsl(${primaryColor})` }} />
                    <span className="font-cairo text-sm font-medium">{p}</span>
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Branches after booking */}
            <Card style={{ borderColor: `hsl(${primaryColor} / 0.2)` }}>
              <CardHeader>
                <CardTitle className="font-cairo flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5" style={{ color: `hsl(${primaryColor})` }} />
                  فروعنا — اختار أقرب فرع ليك
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BRANCHES.map((b, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `hsl(${primaryColor} / 0.1)` }}>
                      <MapPin className="h-5 w-5" style={{ color: `hsl(${primaryColor})` }} />
                    </div>
                    <div>
                      <h4 className="font-cairo font-bold text-sm">{b.city}</h4>
                      <p className="text-xs text-muted-foreground font-cairo leading-6">{b.address}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button onClick={() => {
                setStep('intro');
                setMessages([{ role: 'assistant', content: cfg.welcome_message }]);
                setForm({ customer_name: '', customer_phone: '', car_type: '', car_model: '', problem_description: '', appointment_date: '' });
                setBookingId(null);
              }} className="font-cairo" style={{ backgroundColor: `hsl(${primaryColor})` }}>
                رجوع للصفحة الرئيسية
              </Button>
            </div>
          </div>
        )}
      </main>

      <PublicSiteFooter />

      {/* Floating Chat Bot */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="chatbot-trigger fixed bottom-20 left-3 z-[65] flex h-14 w-14 items-center justify-center overflow-visible rounded-full border-2 border-white bg-[#090909] shadow-[0_8px_28px_rgba(15,23,42,.35)] ring-2 ring-red-600/70 transition-transform hover:scale-105 sm:left-5 md:bottom-auto md:top-[62%]"
          aria-label="افتح المساعد الذكي"
        >
          <img src={brandLogo} alt="" className="h-12 w-12 rounded-full object-contain" />
          <span className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-green-500" />
        </button>
      )}

      {chatOpen && (
        <div className="chatbot-panel fixed bottom-20 left-3 z-[65] flex h-[min(520px,calc(100dvh-170px))] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-5 sm:left-5 sm:w-[380px] sm:h-[500px] sm:max-h-[calc(100vh-40px)]">
          <div
            className="flex items-center justify-between px-3 py-2.5 text-white"
            style={{ backgroundColor: '#090909' }}
          >
            <div className="flex items-center gap-2">
              <img src={brandLogo} alt="" className="h-11 w-11 rounded-full border border-white/20 bg-white object-contain p-0.5" />
              <div>
                <p className="font-cairo font-bold text-sm">المساعد الذكي</p>
                <p className="text-[10px] opacity-90 font-cairo flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'animate-pulse bg-amber-300' : 'bg-white/70'}`} />
                  {isLoading ? 'جاري الرد...' : 'مساعد الصيانة والحجز'}
                </p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded-lg" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="max-w-[90%] rounded-2xl border border-border bg-card px-3 py-2 text-sm leading-6 text-foreground font-cairo">
                  أهلاً بيك في الوجيه! اكتب مشكلة العربية أو اختار سؤالاً للبدء.
                </div>
                <div className="flex flex-wrap gap-2">
                  {['أعمل حجز صيانة', 'أعاني من ضعف الفرامل', 'أحدث الفروع؟'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-cairo whitespace-pre-wrap ${
                    msg.role === 'user' ? 'text-white' : 'bg-card text-foreground border border-border'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: `hsl(${primaryColor})` } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-end">
                <div className="bg-card border border-border rounded-2xl px-3 py-2 text-sm">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2 border-t border-border bg-card flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={cfg.chat_placeholder}
              className="font-cairo text-sm"
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon" style={{ backgroundColor: `hsl(${primaryColor})` }}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairBookingPage;
