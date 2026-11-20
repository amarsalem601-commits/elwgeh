import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import brandLogo from '@/assets/el-wageh-brand.png';
import { BRANCHES, CONTACT_BRANCHES } from '@/data/companyInfo';

const PublicSiteFooter: React.FC = () => (
  <footer className="public-site-footer border-t border-white/10 bg-[#090909] text-white" dir="rtl">
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:px-8">
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src={brandLogo} alt="الوجيه لمنظمات الهواء" className="h-16 w-16 object-contain" />
          <div className="leading-tight">
            <p className="text-lg font-black">الوجيه</p>
            <p className="mt-1 text-xs text-white/60">لمنظمات الهواء والكلتش سيرفو</p>
          </div>
        </Link>
        <p className="max-w-sm text-sm leading-7 text-white/55">
          صيانة احترافية لمنظمات الهواء والكلتش سيرفو للشاحنات والسيارات الثقيلة.
        </p>
        <div className="flex items-center gap-2">
          <a
            href="https://www.instagram.com/elwag.eh/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="إنستجرام"
            className="footer-social-link"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://web.facebook.com/profile.php?id=61596075775440"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="فيسبوك"
            className="footer-social-link"
          >
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div>
        <h3 className="footer-column-title">خدماتنا</h3>
        <nav className="mt-4 space-y-3 text-sm">
          <Link to="/repair-booking?step=form" className="footer-link">حجز صيانة</Link>
          <Link to="/repair-booking?view=bookings" className="footer-link">متابعة الحجز</Link>
          <Link to="/branches" className="footer-link">فروعنا</Link>
          <Link to="/contact" className="footer-link">تواصل معنا</Link>
        </nav>
      </div>

      <div>
        <h3 className="footer-column-title">الفروع</h3>
        <nav className="mt-4 space-y-3 text-sm">
          {BRANCHES.map(branch => (
            <a key={branch.city} href={branch.mapUrl} target="_blank" rel="noreferrer" className="footer-link">
              {branch.city}
            </a>
          ))}
        </nav>
      </div>

      <div>
        <h3 className="footer-column-title">معلومات التواصل</h3>
        <div className="mt-4 space-y-3 text-sm">
          {CONTACT_BRANCHES.map(branch => (
            <div key={branch.name}>
              <p className="font-bold text-white/80">{branch.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1" dir="ltr">
                {branch.phones.map(phone => (
                  <a key={phone} href={`tel:${phone}`} className="footer-link">
                    {phone}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-4 text-center text-xs text-white/45 sm:flex-row sm:px-6 lg:px-8">
        <p>© 2026 الوجيه لمنظمات الهواء — جميع الحقوق محفوظة</p>
        <p>صيانة موثوقة .. أداء أقوى .. أمان أعلى</p>
      </div>
    </div>
  </footer>
);

export default PublicSiteFooter;
