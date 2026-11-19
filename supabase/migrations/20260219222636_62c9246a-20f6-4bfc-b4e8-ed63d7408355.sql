
-- جدول الحضور والانصراف
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
  photo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view all attendance" ON public.attendance FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage attendance" ON public.attendance FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- جدول تتبع الموقع المستمر
CREATE TABLE public.location_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view all locations" ON public.location_tracking FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own location" ON public.location_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own location" ON public.location_tracking FOR SELECT USING (auth.uid() = user_id);

-- جدول المصروفات
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage expenses" ON public.expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- جدول الرواتب
CREATE TABLE public.salaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  bonus DOUBLE PRECISION NOT NULL DEFAULT 0,
  deductions DOUBLE PRECISION NOT NULL DEFAULT 0,
  month TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage salaries" ON public.salaries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own salary" ON public.salaries FOR SELECT USING (auth.uid() = user_id);

-- جدول المهام
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Users can update assigned tasks" ON public.tasks FOR UPDATE USING (auth.uid() = assigned_to);

-- جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for location tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-photos', 'attendance-photos', true);
CREATE POLICY "Users can upload attendance photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view attendance photos" ON storage.objects FOR SELECT USING (bucket_id = 'attendance-photos');
