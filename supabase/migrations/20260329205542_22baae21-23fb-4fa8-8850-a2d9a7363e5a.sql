CREATE TABLE public.repair_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.repair_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage settings" ON public.repair_page_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view settings" ON public.repair_page_settings
  FOR SELECT TO anon, authenticated
  USING (true);

INSERT INTO public.repair_page_settings (setting_key, setting_value) VALUES
  ('page_title', 'الوجيه لمنظمات الهواء'),
  ('page_subtitle', 'حجز إصلاح سيارة'),
  ('welcome_message', 'أهلاً بيك في الوجيه لمنظمات الهواء! 🚗

ازاي أقدر أساعدك؟ قولي إيه مشكلة عربيتك وأنا هساعدك في التشخيص وحجز موعد للإصلاح.'),
  ('primary_color', '0 72% 51%'),
  ('button_text', 'احجز موعد إصلاح الآن'),
  ('footer_text', '© 2026 الوجيه لمنظمات الهواء — جميع الحقوق محفوظة'),
  ('success_title', 'تم الحجز بنجاح!'),
  ('success_message', 'هنتواصل معاك قريب لتأكيد الموعد'),
  ('chat_placeholder', 'اكتب مشكلة عربيتك هنا...'),
  ('branch_name', 'فرع الإسكندرية'),
  ('branch_address', 'الإسكندرية — شارع عبد القادر'),
  ('branch_phone', '01000000001'),
  ('branch_map_url', 'https://maps.google.com/?q=Alexandria,Egypt');