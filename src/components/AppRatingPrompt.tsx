import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';

const pendingKey = 'elwageh:show-rating-prompt';
const ratingKey = 'elwageh:app-rating';

const AppRatingPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!standalone || localStorage.getItem(pendingKey) !== '1') return;

    localStorage.removeItem(pendingKey);
    const timer = window.setTimeout(() => setVisible(true), 2800);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => setVisible(false);

  const submitRating = () => {
    if (rating === 0) return;
    localStorage.setItem(ratingKey, String(rating));
    setVisible(false);
  };

  if (!visible) return null;

  const highlightedRating = hoveredRating || rating;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-title"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-t-[28px] border border-white/70 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[28px]">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-red-600">رأيك يهمنا</p>
            <h2 id="rating-title" className="mt-1 font-cairo text-xl font-black">
              قيّم تطبيق الوجيه
            </h2>
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

        <p className="mt-3 text-center font-cairo text-sm leading-6 text-slate-600">
          هل نال التطبيق رضاك؟ شاركنا تقييمك من نجمة إلى خمس نجوم.
        </p>

        <div
          className="mt-5 flex justify-center gap-2"
          role="radiogroup"
          aria-label="تقييم التطبيق"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} نجوم`}
              key={value}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="rounded-xl p-1"
            >
              <Star
                className={`h-9 w-9 transition-colors ${
                  value <= highlightedRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-xl border border-slate-200 px-4 py-3 font-cairo text-sm font-bold text-slate-600"
          >
            ليس الآن
          </button>
          <button
            type="button"
            onClick={submitRating}
            disabled={rating === 0}
            className="rounded-xl bg-red-600 px-4 py-3 font-cairo text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            إرسال التقييم
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppRatingPrompt;
