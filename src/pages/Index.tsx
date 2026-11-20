import React from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import Reveal from '@/components/Reveal';
import { usePublicShowcase } from '@/hooks/usePublicShowcase';
import { ImagePlus, Users, Wrench } from 'lucide-react';

const Index: React.FC = () => {
  const { team, products, error, loading } = usePublicShowcase();

  return (
    <PublicPageLayout title="الرئيسية">
      {error && (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 font-cairo">
          تعذر تحديث بعض البيانات. {team.length || products.length ? 'نعرض آخر محتوى محفوظ.' : 'تحقق من اتصال الإنترنت.'}
        </p>
      )}

      <Reveal>
        <section className="overflow-hidden rounded-2xl bg-[#090909] text-white shadow-xl" dir="rtl">
          <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">الوجيه لمنظمات الهواء</span>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl">صيانة احترافية،<br /><span className="text-red-500">وأمان على الطريق</span></h1>
              <p className="max-w-xl text-sm leading-7 text-white/70 sm:text-base">خبرة متخصصة في صيانة منظمات الهواء والكلتش سيرفو للشاحنات والسيارات الثقيلة.</p>
              <div className="flex flex-wrap gap-3">
                <a href="/repair-booking?step=form" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">احجز موعد إصلاح</a>
                <a href="#showcase-products" className="rounded-lg border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">تعرّف على منتجاتنا</a>
              </div>
            </div>
            <div className="relative hidden min-h-56 items-center justify-center md:flex">
              <div className="absolute h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />
              <Wrench className="relative h-36 w-36 -rotate-12 text-red-500/90" strokeWidth={1.2} />
            </div>
          </div>
          <div className="h-1 bg-gradient-to-l from-red-700 via-red-500 to-transparent" />
        </section>
      </Reveal>

      <Reveal>
        <section id="showcase-products" className="scroll-mt-24 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">اختياراتنا</p>
              <h2 className="text-2xl font-black text-slate-950">منتجاتنا</h2>
            </div>
            <Wrench className="h-6 w-6 text-red-600" />
          </div>
          {loading && products.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 font-cairo">جاري تحميل المنتجات...</p>
          ) : products.length === 0 ? (
            <Card className="border-slate-200 bg-white"><CardContent className="py-8 text-center text-sm text-slate-500 font-cairo">سيتم عرض المنتجات هنا قريباً.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Reveal key={product.id} delay={index * 70}>
                  <Card className="h-full overflow-hidden border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg">
                    <div className="aspect-[16/10] bg-slate-100">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><ImagePlus className="h-10 w-10 text-slate-300" /></div>
                      )}
                    </div>
                    <CardContent className="space-y-2 p-4">
                      {product.category && <p className="text-xs font-bold text-red-600">{product.category}</p>}
                      <h3 className="font-bold text-slate-950">{product.name}</h3>
                      {product.description && <p className="text-sm leading-6 text-slate-600">{product.description}</p>}
                      {product.price !== null && <p className="font-black text-red-700">{product.price.toLocaleString('ar-EG')} ج.م</p>}
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">خبرات تثق بها</p>
              <h2 className="text-2xl font-black text-slate-950">فريقنا</h2>
            </div>
            <a href="/team" className="text-sm font-bold text-red-700 hover:text-red-800">كل الفريق ←</a>
          </div>
          {team.length === 0 ? (
            <Card className="border-slate-200 bg-white"><CardContent className="py-8 text-center text-sm text-slate-500 font-cairo">فريق متخصص لخدمتك بأعلى مستوى.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.slice(0, 3).map((member, index) => (
                <Reveal key={member.id} delay={index * 70}>
                  <Card className="h-full overflow-hidden border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="aspect-[4/3] bg-slate-100">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Users className="h-12 w-12 text-slate-300" /></div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-slate-950">{member.name}</h3>
                      {member.role && <p className="mt-1 text-sm font-semibold text-red-700">{member.role}</p>}
                      {member.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{member.description}</p>}
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </Reveal>
    </PublicPageLayout>
  );
};

export default Index;
