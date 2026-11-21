import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PublicSiteHeader from '@/components/PublicSiteHeader';
import PublicSiteFooter from '@/components/PublicSiteFooter';

const PublicPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <PublicSiteHeader />

      <main className="public-page-layout-main public-page-enter mx-auto max-w-7xl space-y-6 px-4 py-5 pb-24 lg:px-6 lg:pb-24">
        <button onClick={() => navigate('/home')} className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-red-600">
          <ArrowRight className="h-4 w-4" />
          رجوع
        </button>
        {children}
      </main>

      <PublicSiteFooter />
    </div>
  );
};

export default PublicPageLayout;
