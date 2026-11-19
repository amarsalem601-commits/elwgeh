
CREATE TABLE public.salary_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage advances" ON public.salary_advances FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own advances" ON public.salary_advances FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can request advances" ON public.salary_advances FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
