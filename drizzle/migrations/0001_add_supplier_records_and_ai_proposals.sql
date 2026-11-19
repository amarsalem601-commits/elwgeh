CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized staff can view suppliers"
ON public.suppliers
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.employee_permissions ep
    WHERE ep.user_id = auth.uid() AND ep.page_key = 'suppliers'
  )
);
CREATE POLICY "Authorized staff can add suppliers"
ON public.suppliers
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.employee_permissions ep
      WHERE ep.user_id = auth.uid() AND ep.page_key = 'suppliers'
    )
  )
);
CREATE POLICY "Authorized staff can update suppliers"
ON public.suppliers
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.employee_permissions ep
    WHERE ep.user_id = auth.uid() AND ep.page_key = 'suppliers'
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.employee_permissions ep
    WHERE ep.user_id = auth.uid() AND ep.page_key = 'suppliers'
  )
);
CREATE POLICY "Authorized staff can delete suppliers"
ON public.suppliers
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.employee_permissions ep
    WHERE ep.user_id = auth.uid() AND ep.page_key = 'suppliers'
  )
);

ALTER TABLE public.ai_assistant_messages
ADD COLUMN action JSONB;
COMMENT ON COLUMN public.ai_assistant_messages.action IS 'A pending, explicitly confirmed assistant action proposal; never an executed command.';