import React from 'react';
import { ImagePlus, Package } from 'lucide-react';
import PublicPageLayout from '@/components/PublicPageLayout';
import Reveal from '@/components/Reveal';
import { Card, CardContent } from '@/components/ui/card';
import { usePublicShowcase } from '@/hooks/usePublicShowcase';

const PublicProductsPage: React.FC = () => {
  const { products, loading, error } = usePublicShowcase();

  return (
    <PublicPageLayout title="منتجاتنا">
      <Reveal>
        <div className="mb-4 space-y-2 text-center">
          <div className="inline-flex rounded-xl bg-red-50 p-3 text-red-600">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="font-cairo text-2xl font-black text-slate-950">منتجاتنا</h1>
          <p className="font-cairo text-sm text-slate-500">اختر من منتجات الوجيه المتاحة لسيارتك</p>
        </div>
      </Reveal>

      {error && (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-center font-cairo text-xs text-amber-800">
          تعذر تحديث بعض البيانات، وقد يظهر آخر محتوى محفوظ.
        </p>
      )}

      {loading && products.length === 0 ? (
        <p className="py-10 text-center font-cairo text-sm text-slate-500">جاري تحميل المنتجات...</p>
      ) : products.length === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardContent className="py-10 text-center font-cairo text-sm text-slate-500">
            لا توجد منتجات متاحة حالياً.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={index * 70}>
              <Card className="mx-auto h-full w-full max-w-[350px] overflow-hidden border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg">
                <div className="aspect-[210/297] bg-white">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImagePlus className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  {product.category && <p className="font-cairo text-xs font-bold text-red-600">{product.category}</p>}
                  <h2 className="font-cairo font-bold text-slate-950">{product.name}</h2>
                  {product.description && <p className="font-cairo text-sm leading-6 text-slate-600">{product.description}</p>}
                  {product.price !== null && (
                    <p className="font-cairo font-black text-red-700">
                      {product.price.toLocaleString('ar-EG')} ج.م
                    </p>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};

export default PublicProductsPage;
