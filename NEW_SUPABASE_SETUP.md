# إعداد مشروع Supabase الجديد

افتح Supabase Dashboard للمشروع الجديد، ثم افتح **SQL Editor** وشغّل ملفات SQL التالية بالترتيب بالضبط.

انسخ محتوى كل ملف وشغّل `Run` في SQL Editor، ثم انتقل للملف التالي.

## أولًا: ملفات قاعدة التطبيق

1. `supabase/migrations/20260217140738_80c80d7d-3c3b-4f10-93de-9ef65302a968.sql`
2. `supabase/migrations/20260219222636_62c9246a-20f6-4bfc-b4e8-ed63d7408355.sql`
3. `supabase/migrations/20260324185323_9bd43c69-17e6-4540-a58f-80d19557481f.sql`
4. `supabase/migrations/20260324185817_0097bf3f-224d-4690-bdb2-4804fb0913e0.sql`
5. `supabase/migrations/20260329205542_22baae21-23fb-4fa8-8850-a2d9a7363e5a.sql`
6. `supabase/migrations/20260401184440_d8836e34-90e2-41dd-afc2-cf701567aaef.sql`
7. `supabase/migrations/20260403214311_0ac4d80a-1dfb-41ad-99de-6db13d93e938.sql`
8. `supabase/migrations/20260403220143_889025ff-b5fb-423b-be91-c68d53e9e3ce.sql`
9. `supabase/migrations/20260503102040_d0ba7121-a198-40df-9c2e-4804fb0913e0.sql`
10. `supabase/migrations/20260505124444_da9511ae-2f2d-4a36-82a6-7d54d3572f26.sql`

## ثانيًا: ملفات المساعد والموردين

11. `drizzle/migrations/0000_create_ai_assistant_conversations.sql`
12. `drizzle/migrations/0001_add_supplier_records_and_ai_proposals.sql`

## روابط SQL Editor المقاطع

شغّل الملفات عبر مسار المشروع:

- [فتح SQL Editor للمشروع الجديد](https://supabase.com/dashboard/project/koqcjwhawmftoavlobiy/sql/new)

## ملاحظات مهمة

- لا تشغّل أي ملف مرتين. لو ظهر خطأ، توقف عند الخطأ وأرسل النص كاملًا قبل متابعة الملفات التالية.
- تأكد من أن أماكن المفاتيح في `.env` تم تعديلها لتشير للمشروع الجديد.
