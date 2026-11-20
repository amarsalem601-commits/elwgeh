CREATE TABLE IF NOT EXISTS public.showcase_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.showcase_products ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.showcase_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.showcase_products TO authenticated;

DROP POLICY IF EXISTS "Anyone can view active showcase products" ON public.showcase_products;
CREATE POLICY "Anyone can view active showcase products"
ON public.showcase_products FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all showcase products" ON public.showcase_products;
CREATE POLICY "Admins can view all showcase products"
ON public.showcase_products FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage showcase products" ON public.showcase_products;
CREATE POLICY "Admins can manage showcase products"
ON public.showcase_products FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS showcase_products_display_order_idx
ON public.showcase_products (display_order, created_at);
