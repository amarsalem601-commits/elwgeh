CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  orders INTEGER NOT NULL DEFAULT 0,
  total DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL DEFAULT '',
  customer TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items INTEGER NOT NULL DEFAULT 1,
  total DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL DEFAULT '',
  supplier TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items INTEGER NOT NULL DEFAULT 1,
  total DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.products, public.customers, public.sales, public.purchases TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorized staff can manage products" ON public.products;
CREATE POLICY "Authorized staff can manage products"
ON public.products FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'products')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'products')
);

DROP POLICY IF EXISTS "Authorized staff can manage customers" ON public.customers;
CREATE POLICY "Authorized staff can manage customers"
ON public.customers FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'customers')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'customers')
);

DROP POLICY IF EXISTS "Authorized staff can manage sales" ON public.sales;
CREATE POLICY "Authorized staff can manage sales"
ON public.sales FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'sales')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'sales')
);

DROP POLICY IF EXISTS "Authorized staff can manage purchases" ON public.purchases;
CREATE POLICY "Authorized staff can manage purchases"
ON public.purchases FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'purchases')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.employee_permissions ep WHERE ep.user_id = auth.uid() AND ep.page_key = 'purchases')
);

CREATE INDEX IF NOT EXISTS products_name_idx ON public.products(name);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON public.customers(phone);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_created_at_idx ON public.purchases(created_at DESC);
