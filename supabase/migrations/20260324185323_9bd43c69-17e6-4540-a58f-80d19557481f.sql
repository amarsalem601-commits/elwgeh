
-- Repair bookings table
CREATE TABLE public.repair_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  car_type TEXT NOT NULL DEFAULT '',
  car_model TEXT NOT NULL DEFAULT '',
  problem_description TEXT NOT NULL DEFAULT '',
  appointment_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repair_bookings ENABLE ROW LEVEL SECURITY;

-- Public can insert bookings (no auth required)
CREATE POLICY "Anyone can create bookings" ON public.repair_bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admin can do everything
CREATE POLICY "Admin can manage bookings" ON public.repair_bookings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view own booking by id (we'll handle via chat)
CREATE POLICY "Anyone can view bookings" ON public.repair_bookings
  FOR SELECT TO anon, authenticated USING (true);

-- Chat messages for repair bookings
CREATE TABLE public.repair_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.repair_bookings(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repair_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert chat messages" ON public.repair_chat_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" ON public.repair_chat_messages
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can manage chat messages" ON public.repair_chat_messages
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_chat_messages;
