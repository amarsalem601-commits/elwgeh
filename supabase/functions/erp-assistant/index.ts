import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

class AssistantError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type ValueType = "text" | "number" | "boolean";
type EntityConfig = {
  label: string;
  table: string;
  fields: Record<string, ValueType>;
  required: string[];
  matchable: string[];
  audit?: "created_by" | "assigned_by" | "current_user";
  updatedAt?: boolean;
};
type BusinessRequest = {
  operation?: unknown;
  entity?: unknown;
  data?: unknown;
  match?: unknown;
};
type DesignChange = { scope: string; key: string; value: string };
type ActionRecord = Record<string, unknown> & {
  kind: "business" | "design";
  status: "pending" | "applying" | "confirmed" | "cancelled";
  summary: string;
};

const entities: Record<string, EntityConfig> = {
  suppliers: {
    label: "المورد",
    table: "suppliers",
    fields: { name: "text", contact: "text", phone: "text", location: "text" },
    required: ["name", "phone"],
    matchable: ["id", "name", "phone"],
    audit: "created_by",
    updatedAt: true,
  },
  products: {
    label: "المنتج",
    table: "products",
    fields: { name: "text", category: "text", price: "number", quantity: "number" },
    required: ["name", "price", "quantity"],
    matchable: ["id", "name", "category"],
    audit: "created_by",
    updatedAt: true,
  },
  customers: {
    label: "العميل",
    table: "customers",
    fields: { name: "text", phone: "text", location: "text" },
    required: ["name", "phone"],
    matchable: ["id", "name", "phone"],
    audit: "created_by",
    updatedAt: true,
  },
  sales: {
    label: "طلب البيع",
    table: "sales",
    fields: {
      order_number: "text", customer: "text", date: "text", items: "number", total: "number", status: "text",
    },
    required: ["customer", "total"],
    matchable: ["id", "order_number", "customer"],
    audit: "created_by",
    updatedAt: true,
  },
  purchases: {
    label: "طلب الشراء",
    table: "purchases",
    fields: {
      order_number: "text", supplier: "text", date: "text", items: "number", total: "number", status: "text",
    },
    required: ["supplier", "total"],
    matchable: ["id", "order_number", "supplier"],
    audit: "created_by",
    updatedAt: true,
  },
  crm_leads: {
    label: "العميل المحتمل",
    table: "crm_leads",
    fields: {
      name: "text", phone: "text", email: "text", company: "text", source: "text",
      status: "text", value: "number", notes: "text", assigned_to: "text",
    },
    required: ["name", "phone"],
    matchable: ["id", "name", "phone", "email"],
    audit: "created_by",
    updatedAt: true,
  },
  crm_activities: {
    label: "نشاط العميل المحتمل",
    table: "crm_activities",
    fields: { lead_id: "text", type: "text", content: "text" },
    required: ["lead_id", "content"],
    matchable: ["id", "lead_id", "type", "content"],
    audit: "created_by",
  },
  expenses: {
    label: "المصروف",
    table: "expenses",
    fields: { title: "text", category: "text", amount: "number", notes: "text" },
    required: ["title", "amount", "category"],
    matchable: ["id", "title", "category"],
    audit: "current_user",
  },
  invoices: {
    label: "الفاتورة",
    table: "invoices",
    fields: {
      invoice_number: "text", type: "text", customer_name: "text", customer_phone: "text",
      subtotal: "number", discount: "number", tax: "number", total: "number",
      status: "text", notes: "text",
    },
    required: ["customer_name"],
    matchable: ["id", "invoice_number", "customer_name", "customer_phone"],
    audit: "created_by",
    updatedAt: true,
  },
  invoice_items: {
    label: "بند الفاتورة",
    table: "invoice_items",
    fields: { invoice_id: "text", product_name: "text", quantity: "number", unit_price: "number", total: "number" },
    required: ["invoice_id", "product_name", "quantity", "unit_price"],
    matchable: ["id", "invoice_id", "product_name"],
  },
  accounting_entries: {
    label: "القيد المحاسبي",
    table: "accounting_entries",
    fields: { entry_date: "text", description: "text", type: "text", category: "text", amount: "number" },
    required: ["description", "type", "category", "amount"],
    matchable: ["id", "description", "entry_date"],
    audit: "created_by",
  },
  warehouses: {
    label: "المخزن",
    table: "warehouses",
    fields: { name: "text", location: "text", is_default: "boolean" },
    required: ["name"],
    matchable: ["id", "name", "location"],
  },
  warehouse_stock: {
    label: "رصيد المخزون",
    table: "warehouse_stock",
    fields: { warehouse_id: "text", product_name: "text", quantity: "number", min_stock: "number" },
    required: ["warehouse_id", "product_name", "quantity"],
    matchable: ["id", "warehouse_id", "product_name"],
  },
  warehouse_transfers: {
    label: "تحويل المخزون",
    table: "warehouse_transfers",
    fields: {
      from_warehouse_id: "text", to_warehouse_id: "text", product_name: "text",
      quantity: "number", status: "text", notes: "text",
    },
    required: ["from_warehouse_id", "to_warehouse_id", "product_name", "quantity"],
    matchable: ["id", "product_name", "from_warehouse_id", "to_warehouse_id"],
    audit: "created_by",
  },
  repair_bookings: {
    label: "حجز الإصلاح",
    table: "repair_bookings",
    fields: {
      customer_name: "text", customer_phone: "text", car_type: "text", car_model: "text",
      problem_description: "text", appointment_date: "text", status: "text",
    },
    required: ["customer_name", "customer_phone"],
    matchable: ["id", "customer_name", "customer_phone"],
  },
  tasks: {
    label: "المهمة",
    table: "tasks",
    fields: {
      title: "text", description: "text", due_date: "text", priority: "text",
      status: "text", assigned_to: "text",
    },
    required: ["title", "assigned_to"],
    matchable: ["id", "title", "assigned_to"],
    audit: "assigned_by",
    updatedAt: true,
  },
  notifications: {
    label: "الإشعار",
    table: "notifications",
    fields: { title: "text", message: "text", user_id: "text", read: "boolean" },
    required: ["title", "message", "user_id"],
    matchable: ["id", "title", "user_id"],
    updatedAt: false,
  },
  salaries: {
    label: "بيان الراتب",
    table: "salaries",
    fields: {
      user_id: "text", month: "text", amount: "number", bonus: "number",
      deductions: "number", notes: "text", paid: "boolean",
    },
    required: ["user_id", "month", "amount"],
    matchable: ["id", "user_id", "month"],
  },
  salary_advances: {
    label: "السلفة",
    table: "salary_advances",
    fields: { user_id: "text", amount: "number", reason: "text", approved: "boolean" },
    required: ["user_id", "amount"],
    matchable: ["id", "user_id", "amount"],
  },
  team_members: {
    label: "عضو الفريق",
    table: "team_members",
    fields: { name: "text", role: "text", description: "text", display_order: "number", photo_url: "text" },
    required: ["name", "role"],
    matchable: ["id", "name", "role"],
    updatedAt: true,
  },
};

const fieldLabels: Record<string, string> = {
  name: "الاسم",
  contact: "الشخص المسؤول",
  phone: "رقم الهاتف",
  location: "العنوان",
  email: "البريد الإلكتروني",
  company: "الشركة",
  source: "المصدر",
  status: "الحالة",
  value: "القيمة",
  notes: "ملاحظات",
  assigned_to: "اسم الموظف المسؤول",
  lead_id: "اسم العميل المحتمل",
  title: "العنوان",
  category: "التصنيف",
  amount: "المبلغ",
  invoice_number: "رقم الفاتورة",
  type: "النوع",
  customer_name: "اسم العميل",
  customer_phone: "هاتف العميل",
  subtotal: "الإجمالي قبل الضريبة",
  discount: "الخصم",
  tax: "الضريبة",
  total: "الإجمالي",
  invoice_id: "رقم الفاتورة",
  product_name: "اسم المنتج",
  quantity: "الكمية",
  price: "السعر",
  order_number: "رقم الطلب",
  customer: "العميل",
  supplier: "المورد",
  date: "التاريخ",
  items: "عدد البنود",
  unit_price: "سعر الوحدة",
  entry_date: "تاريخ القيد",
  description: "الوصف",
  is_default: "المخزن الافتراضي",
  warehouse_id: "اسم المخزن",
  min_stock: "حد التنبيه للمخزون",
  from_warehouse_id: "المخزن المرسل",
  to_warehouse_id: "المخزن المستلم",
  car_type: "نوع السيارة",
  car_model: "موديل السيارة",
  problem_description: "وصف المشكلة",
  appointment_date: "موعد الإصلاح",
  due_date: "تاريخ الاستحقاق",
  priority: "الأولوية",
  message: "نص الإشعار",
  user_id: "اسم الموظف",
  month: "الشهر",
  bonus: "المكافأة",
  deductions: "الخصومات",
  paid: "تم الصرف",
  reason: "السبب",
  approved: "تمت الموافقة",
  display_order: "ترتيب العرض",
  photo_url: "رابط الصورة",
};

const referenceFields: Record<string, { table: string; id: string; name: string; label: string }> = {
  assigned_to: { table: "profiles", id: "user_id", name: "name", label: "الموظف" },
  user_id: { table: "profiles", id: "user_id", name: "name", label: "الموظف" },
  lead_id: { table: "crm_leads", id: "id", name: "name", label: "العميل المحتمل" },
  invoice_id: { table: "invoices", id: "id", name: "invoice_number", label: "الفاتورة" },
  warehouse_id: { table: "warehouses", id: "id", name: "name", label: "المخزن" },
  from_warehouse_id: { table: "warehouses", id: "id", name: "name", label: "المخزن المرسل" },
  to_warehouse_id: { table: "warehouses", id: "id", name: "name", label: "المخزن المستلم" },
};

const globalThemeDefaults: Record<string, string> = {
  primary: "0 72% 51%",
  primaryForeground: "0 0% 100%",
  background: "220 25% 97%",
  foreground: "222 47% 11%",
  card: "0 0% 100%",
  border: "220 16% 88%",
  darkBackground: "222 47% 7%",
  darkForeground: "220 20% 96%",
  darkCard: "222 38% 10%",
  darkBorder: "222 24% 18%",
  radius: "0.875rem",
  font: "Cairo",
};

const themeKeys = Object.keys(globalThemeDefaults);
const repairSettings = [
  "page_title", "page_subtitle", "primary_color", "welcome_message", "chat_placeholder",
  "button_text", "success_title", "success_message", "footer_text", "branch_name",
  "branch_address", "branch_phone", "branch_map_url",
];
const hslPattern = /^\d{1,3}(?:\.\d+)?\s+\d{1,3}%\s+\d{1,3}%$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const normalizeData = (config: EntityConfig, raw: unknown) => {
  if (!isRecord(raw)) throw new AssistantError("بيانات الإجراء غير مكتملة.");
  const aliases = config.table === "suppliers"
    ? { address: "location", contact_person: "contact" }
    : config.table === "customers"
    ? { address: "location" }
    : {};
  const normalizedRaw = { ...raw };
  for (const [alias, field] of Object.entries(aliases)) {
    if (!(alias in normalizedRaw)) continue;
    if (field in normalizedRaw) throw new AssistantError(`تم تحديد ${fieldLabels[field] || field} مرتين.`);
    normalizedRaw[field] = normalizedRaw[alias];
    delete normalizedRaw[alias];
  }
  const result: Record<string, string | number | boolean | null> = {};
  const unsupported = Object.keys(normalizedRaw).filter(key => !(key in config.fields));
  if (unsupported.length) throw new AssistantError(`لا يمكن تعديل الحقول التالية: ${unsupported.join(", ")}`);

  for (const [key, value] of Object.entries(normalizedRaw)) {
    if (value === null) {
      result[key] = null;
      continue;
    }
    const type = config.fields[key];
    if (type === "number") {
      const numberValue = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numberValue)) throw new AssistantError(`قيمة ${fieldLabels[key] || key} يجب أن تكون رقمًا.`);
      if (["price", "quantity", "items", "total"].includes(key) && numberValue < 0) {
        throw new AssistantError(`قيمة ${fieldLabels[key] || key} لا يمكن أن تكون سالبة.`);
      }
      if (key === "items" && (!Number.isInteger(numberValue) || numberValue < 1)) {
        throw new AssistantError("عدد البنود يجب أن يكون عددًا صحيحًا أكبر من صفر.");
      }
      result[key] = numberValue;
    } else if (type === "boolean") {
      if (typeof value !== "boolean") throw new AssistantError(`قيمة ${fieldLabels[key] || key} يجب أن تكون نعم أو لا.`);
      result[key] = value;
    } else if (typeof value === "string") {
      const text = value.trim();
      if (text.length > 1000) throw new AssistantError(`قيمة ${fieldLabels[key] || key} طويلة جدًا.`);
      if (key === "date") {
        const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
        const parsed = parts ? new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))) : null;
        if (!parts || !parsed || parsed.toISOString().slice(0, 10) !== text) {
          throw new AssistantError("اكتب التاريخ بصيغة سنة-شهر-يوم، مثل 2026-11-19.");
        }
      }
      result[key] = text;
    } else {
      throw new AssistantError(`قيمة ${fieldLabels[key] || key} غير صالحة.`);
    }
  }
  return result;
};

const getRequiredFields = (config: EntityConfig, data: Record<string, unknown>) =>
  config.required.filter(key => {
    const value = data[key];
    return value === undefined || value === null || (typeof value === "string" && !value.trim());
  });

const resolveReference = async (
  supabase: ReturnType<typeof createClient>,
  field: string,
  value: unknown,
): Promise<{ id?: string; display?: string; error?: string }> => {
  if (typeof value !== "string" || !value.trim()) return { error: `أحتاج ${fieldLabels[field] || field}.` };
  const reference = referenceFields[field];
  if (!reference) return { id: value, display: value };
  if (uuidPattern.test(value)) return { id: value, display: value };

  const { data, error } = await supabase
    .from(reference.table)
    .select(`${reference.id}, ${reference.name}`)
    .eq(reference.name, value.trim())
    .limit(2);
  if (error) throw new AssistantError(`تعذر البحث عن ${reference.label}.`, 500);
  if (!data?.length) return { error: `لم أجد ${reference.label} باسم «${value}». اكتب الاسم الموجود بالنظام.` };
  if (data.length > 1) return { error: `وجدت أكثر من ${reference.label} باسم «${value}». حدّد الاسم بالكامل أو المعرّف.` };
  return { id: String(data[0][reference.id]), display: String(data[0][reference.name]) };
};

const resolveReferences = async (
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>,
) => {
  const resolved = { ...data };
  const display = { ...data };
  for (const field of Object.keys(referenceFields)) {
    if (!(field in resolved)) continue;
    const result = await resolveReference(supabase, field, resolved[field]);
    if (result.error) return { error: result.error };
    resolved[field] = result.id;
    display[field] = result.display;
  }
  return { resolved, display };
};

const prepareBusinessAction = async (
  supabase: ReturnType<typeof createClient>,
  request: BusinessRequest,
  userId: string,
) => {
  if (typeof request.entity !== "string" || !(request.entity in entities)) {
    throw new AssistantError("القسم المطلوب غير مدعوم حاليًا.");
  }
  const entity = request.entity;
  const config = entities[entity];
  const operation = request.operation;
  if (operation !== "create" && operation !== "update" && operation !== "delete") {
    throw new AssistantError("نوع العملية غير مدعوم.");
  }

  const rawData = operation === "delete" ? {} : request.data ?? {};
  const data = normalizeData(config, rawData);
  const matchRaw = request.match;
  const match: Record<string, unknown> = {};
  if (matchRaw !== undefined) {
    if (!isRecord(matchRaw)) throw new AssistantError("بيانات تحديد السجل غير صالحة.");
    for (const [key, value] of Object.entries(matchRaw)) {
      if (!config.matchable.includes(key) || (typeof value !== "string" && typeof value !== "number")) {
        throw new AssistantError("استخدم رقم أو اسمًا واضحًا لتحديد السجل.");
      }
      match[key] = value;
    }
  }

  if (operation === "create") {
    const required = getRequiredFields(config, data);
    if (required.length) {
      return {
        reply: `لإضافة ${config.label}، أحتاج ${required.map(key => fieldLabels[key] || key).join("، ")}.`,
      };
    }
  } else {
    if (!Object.keys(match).length) {
      return { reply: `لـ${operation === "update" ? "تعديل" : "حذف"} ${config.label}، حدّد الاسم أو الرقم المميز للسجل.` };
    }
    if (operation === "update" && !Object.keys(data).length) {
      return { reply: `ما البيانات التي تريد تعديلها في ${config.label}؟` };
    }
    const resolvedMatch = await resolveReferences(supabase, match);
    if (resolvedMatch.error) return { reply: resolvedMatch.error };
    Object.assign(match, resolvedMatch.resolved);
  }

  const resolvedData = await resolveReferences(supabase, data);
  if (resolvedData.error) return { reply: resolvedData.error };

  if (operation === "create") {
    if (config.audit === "created_by" || config.audit === "assigned_by") {
      resolvedData.resolved[config.audit] = userId;
    } else if (config.audit === "current_user") {
      resolvedData.resolved.user_id = userId;
    }
    if (config.updatedAt) resolvedData.resolved.updated_at = new Date().toISOString();
  } else if (operation === "update" && config.updatedAt) {
    resolvedData.resolved.updated_at = new Date().toISOString();
  }

  let targetId: string | undefined;
  let before: Record<string, unknown> | undefined;
  if (operation !== "create") {
    const { data: records, error } = await supabase
      .from(config.table)
      .select("*")
      .match(match)
      .limit(2);
    if (error) throw new AssistantError(`تعذر البحث في ${config.label}.`, 500);
    if (!records?.length) return { reply: `لم أجد ${config.label} بهذه البيانات. راجع الاسم أو الرقم وحاول مرة أخرى.` };
    if (records.length > 1) return { reply: `وجدت أكثر من سجل لـ${config.label}. أرسل رقمًا أو معلومة أدق لتحديد سجل واحد.` };
    targetId = String(records[0].id);
    before = Object.fromEntries(
      ["id", ...Object.keys(config.fields)].map(key => [key, records[0][key]])
    );
  }

  const displayData = operation === "delete"
    ? Object.fromEntries(Object.keys(config.fields).map(key => [key, before?.[key]]).filter(([, value]) => value !== undefined))
    : resolvedData.display;
  const action: ActionRecord = {
    kind: "business",
    status: "pending",
    operation,
    entity,
    summary: `${operation === "create" ? "إضافة" : operation === "update" ? "تعديل" : "حذف"} ${config.label}${targetId ? ` (${String(match.name || match.id || match.phone || targetId)})` : ""}`,
    data: displayData,
    execution: {
      table: config.table,
      targetId: targetId || null,
      data: resolvedData.resolved,
      before: before || null,
    },
  };
  return {
    reply: `هذا مقترح ${operation === "create" ? "إضافة" : operation === "update" ? "تعديل" : "حذف"} ${config.label}. راجع التفاصيل واضغط تأكيد التنفيذ أو إلغاء.`,
    action,
  };
};

const validateDesignValue = (scope: string, key: string, value: unknown): string => {
  if (typeof value !== "string" || value.trim().length > 500) {
    throw new AssistantError(`قيمة التصميم ${key} غير صالحة.`);
  }
  const text = value.trim();
  if (scope === "global_theme") {
    if (!themeKeys.includes(key)) throw new AssistantError(`إعداد المظهر ${key} غير مسموح.`);
    if (["primary", "primaryForeground", "background", "foreground", "card", "border", "darkBackground", "darkForeground", "darkCard", "darkBorder"].includes(key) && !hslPattern.test(text)) {
      throw new AssistantError(`قيمة اللون ${key} يجب أن تكون بصيغة HSL مثل 0 72% 51%.`);
    }
    if (key === "radius" && !/^(?:0|[0-9]+(?:\.[0-9]+)?)(?:rem|px)$/.test(text)) {
      throw new AssistantError("قيمة نصف قطر الزوايا يجب أن تكون مثل 0.875rem.");
    }
    if (key === "font" && text !== "Cairo" && text !== "Manrope") {
      throw new AssistantError("الخط المتاح هو Cairo أو Manrope.");
    }
    return text;
  }
  if (scope !== "repair_page_settings" || !repairSettings.includes(key)) {
    throw new AssistantError(`إعداد الموقع ${key} غير مسموح.`);
  }
  if (key === "primary_color" && !hslPattern.test(text)) {
    throw new AssistantError("لون صفحة الحجز يجب أن يكون بصيغة HSL مثل 0 72% 51%.");
  }
  if (key === "branch_map_url" && text && !text.startsWith("https://")) {
    throw new AssistantError("رابط الخريطة يجب أن يبدأ بـ https://.");
  }
  return text;
};

const prepareDesignAction = async (
  supabase: ReturnType<typeof createClient>,
  rawChanges: unknown,
  summary: unknown,
) => {
  if (!Array.isArray(rawChanges) || rawChanges.length === 0 || rawChanges.length > 8) {
    throw new AssistantError("حدّد تغييرًا واحدًا إلى ثمانية تغييرات.");
  }
  const changes = rawChanges.map((item): DesignChange => {
    if (!isRecord(item) || typeof item.scope !== "string" || typeof item.key !== "string") {
      throw new AssistantError("تفاصيل اقتراح التصميم غير صالحة.");
    }
    return {
      scope: item.scope,
      key: item.key,
      value: validateDesignValue(item.scope, item.key, item.value),
    };
  });
  const scope = changes[0].scope;
  if (changes.some(change => change.scope !== scope)) {
    return { reply: "قسّم التعديلات إلى مقترحات منفصلة: واحد لمظهر اللوحات وواحد لصفحة الحجز." };
  }
  if (new Set(changes.map(change => change.key)).size !== changes.length) {
    throw new AssistantError("يوجد إعداد مكرر في المقترح.");
  }

  let current: Record<string, string>;
  if (scope === "global_theme") {
    const { data, error } = await supabase
      .from("repair_page_settings")
      .select("setting_value")
      .eq("setting_key", "global_theme")
      .maybeSingle();
    if (error) throw new AssistantError("تعذر قراءة إعدادات مظهر الموقع.", 500);
    current = { ...globalThemeDefaults };
    if (data?.setting_value) {
      try {
        const parsed: unknown = JSON.parse(data.setting_value);
        if (isRecord(parsed)) {
          for (const key of themeKeys) {
            if (typeof parsed[key] === "string") current[key] = parsed[key];
          }
        }
      } catch {
        throw new AssistantError("إعدادات مظهر الموقع المحفوظة غير صالحة.", 500);
      }
    }
  } else {
    const keys = changes.map(change => change.key);
    const { data, error } = await supabase
      .from("repair_page_settings")
      .select("setting_key, setting_value")
      .in("setting_key", keys);
    if (error) throw new AssistantError("تعذر قراءة إعدادات صفحة الحجز.", 500);
    current = Object.fromEntries((data || []).map((row: { setting_key: string; setting_value: string }) => [row.setting_key, row.setting_value]));
    const missing = keys.filter(key => !(key in current));
    if (missing.length) throw new AssistantError(`الإعدادات غير الموجودة: ${missing.join(", ")}`);
  }

  const resolvedChanges = changes.map(change => ({
    ...change,
    oldValue: current[change.key],
  }));
  const nextTheme = scope === "global_theme"
    ? { ...current, ...Object.fromEntries(changes.map(change => [change.key, change.value])) }
    : undefined;
  const action: ActionRecord = {
    kind: "design",
    status: "pending",
    summary: typeof summary === "string" && summary.trim()
      ? summary.slice(0, 240)
      : "تغيير مقترح على مظهر الموقع",
    changes: resolvedChanges,
    theme: nextTheme,
    execution: { scope, changes: resolvedChanges },
  };
  return {
    reply: "هذا مقترح تعديل للموقع. راجع القيم قبل الضغط على تأكيد التنفيذ.",
    action,
  };
};

const confirmAction = async (
  supabase: ReturnType<typeof createClient>,
  threadId: string,
  messageId: string,
  decision: unknown,
) => {
  if (decision !== "confirm" && decision !== "cancel") throw new AssistantError("قرار المقترح غير صالح.");
  const { data: row, error } = await supabase
    .from("ai_assistant_messages")
    .select("id, action")
    .eq("id", messageId)
    .eq("thread_id", threadId)
    .eq("role", "assistant")
    .maybeSingle();
  if (error) throw new AssistantError("تعذر قراءة المقترح.", 500);
  if (!row || !isRecord(row.action)) throw new AssistantError("المقترح غير موجود.", 404);
  const action = row.action as ActionRecord;
  if (action.status !== "pending") throw new AssistantError("تمت معالجة هذا المقترح مسبقًا.", 409);

  if (decision === "cancel") {
    const cancelled = { ...action, status: "cancelled" };
    const { data: updatedAction, error: updateError } = await supabase
      .from("ai_assistant_messages")
      .update({ action: cancelled })
      .eq("id", messageId)
      .eq("action->>status", "pending")
      .select("id")
      .maybeSingle();
    if (updateError) throw new AssistantError("تعذر إلغاء المقترح.", 500);
    if (!updatedAction) throw new AssistantError("تمت معالجة هذا المقترح مسبقًا.", 409);
    return { reply: "تم إلغاء المقترح ولم يتم تطبيق أي تغيير." };
  }

  const applying = { ...action, status: "applying" };
  const { data: lockedAction, error: lockError } = await supabase
    .from("ai_assistant_messages")
    .update({ action: applying })
    .eq("id", messageId)
    .eq("action->>status", "pending")
    .select("id")
    .maybeSingle();
  if (lockError) throw new AssistantError("تعذر تأكيد المقترح.", 500);
  if (!lockedAction) throw new AssistantError("تمت معالجة هذا المقترح مسبقًا.", 409);

  let changeApplied = false;
  try {
    const execution = isRecord(action.execution) ? action.execution : null;
    if (!execution) throw new AssistantError("بيانات تنفيذ المقترح غير صالحة.", 400);
    let updatedTheme: Record<string, string> | undefined;

    if (action.kind === "business") {
      const entity = typeof action.entity === "string" ? action.entity : "";
      const config = entities[entity];
      const operation = action.operation;
      if (!config || (operation !== "create" && operation !== "update" && operation !== "delete")) {
        throw new AssistantError("نوع الإجراء غير مسموح.", 400);
      }
      const targetId = typeof execution.targetId === "string" ? execution.targetId : null;
      const data = isRecord(execution.data) ? execution.data : {};
      if (operation === "create") {
        const { error: insertError } = await supabase.from(config.table).insert(data);
        if (insertError) throw new AssistantError(`فشل تنفيذ الإضافة: ${insertError.message}`, 400);
        changeApplied = true;
      } else {
        if (!targetId || !isRecord(execution.before)) throw new AssistantError("السجل المستهدف غير صالح.", 400);
        const { data: current, error: currentError } = await supabase
          .from(config.table)
          .select("*")
          .eq("id", targetId)
          .maybeSingle();
        if (currentError) throw new AssistantError("تعذر التحقق من السجل قبل التنفيذ.", 500);
        if (!current) throw new AssistantError("لم يعد السجل موجودًا. أعد إنشاء المقترح.", 409);
        const before = execution.before;
        const changedSinceProposal = Object.entries(before).some(([key, value]) =>
          JSON.stringify(current[key]) !== JSON.stringify(value)
        );
        if (changedSinceProposal) throw new AssistantError("تغير السجل منذ إنشاء المقترح. راجعه وأنشئ مقترحًا جديدًا.", 409);

        const query = supabase.from(config.table);
        const result = operation === "update"
          ? await query.update(data).eq("id", targetId).select("id").maybeSingle()
          : await query.delete().eq("id", targetId).select("id").maybeSingle();
        if (result.error) throw new AssistantError(`فشل تنفيذ التغيير: ${result.error.message}`, 400);
        if (!result.data) throw new AssistantError("لم يتم العثور على السجل لتطبيق التغيير.", 409);
        changeApplied = true;
      }
    } else if (action.kind === "design") {
      const scope = execution.scope;
      if (!Array.isArray(execution.changes)) throw new AssistantError("تفاصيل تعديل التصميم غير صالحة.", 400);
      const changes = execution.changes as Array<Record<string, unknown>>;
      if (!changes.length || changes.some(change =>
        typeof change.key !== "string" ||
        typeof change.value !== "string" ||
        typeof change.oldValue !== "string"
      )) throw new AssistantError("تفاصيل تعديل التصميم غير صالحة.", 400);

      if (scope === "global_theme") {
        const { data, error } = await supabase
          .from("repair_page_settings")
          .select("setting_value")
          .eq("setting_key", "global_theme")
          .maybeSingle();
        if (error) throw new AssistantError("تعذر قراءة مظهر الموقع الحالي.", 500);
        const current = { ...globalThemeDefaults };
        if (data?.setting_value) {
          const parsed: unknown = JSON.parse(data.setting_value);
          if (isRecord(parsed)) {
            for (const key of themeKeys) {
              if (typeof parsed[key] === "string") current[key] = parsed[key];
            }
          }
        }
        for (const change of changes) {
          const key = String(change.key);
          const value = validateDesignValue("global_theme", key, change.value);
          if (current[key] !== change.oldValue) throw new AssistantError("تغير مظهر الموقع منذ إنشاء المقترح. أعد إنشاء المقترح.", 409);
          current[key] = value;
        }
        const { error: saveError } = await supabase
          .from("repair_page_settings")
          .upsert({
            setting_key: "global_theme",
            setting_value: JSON.stringify(current),
            updated_at: new Date().toISOString(),
          }, { onConflict: "setting_key" });
        if (saveError) throw new AssistantError("تعذر حفظ مظهر الموقع.", 500);
        updatedTheme = current;
        changeApplied = true;
      } else if (scope === "repair_page_settings") {
        const keys = changes.map(change => String(change.key));
        if (keys.some(key => !repairSettings.includes(key))) throw new AssistantError("إعداد صفحة الحجز غير مسموح.", 400);
        const { data: currentRows, error: currentError } = await supabase
          .from("repair_page_settings")
          .select("setting_key, setting_value")
          .in("setting_key", keys);
        if (currentError) throw new AssistantError("تعذر قراءة إعدادات صفحة الحجز.", 500);
        const current = Object.fromEntries((currentRows || []).map((item: { setting_key: string; setting_value: string }) => [item.setting_key, item.setting_value]));
        for (const change of changes) {
          const key = String(change.key);
          if (current[key] !== change.oldValue) throw new AssistantError("تغيرت إعدادات صفحة الحجز منذ إنشاء المقترح. أعد إنشاء المقترح.", 409);
          validateDesignValue(scope, key, change.value);
        }
        const rows = changes.map(change => ({
          setting_key: String(change.key),
          setting_value: String(change.value),
          updated_at: new Date().toISOString(),
        }));
        const { error: saveError } = await supabase
          .from("repair_page_settings")
          .upsert(rows, { onConflict: "setting_key" });
        if (saveError) throw new AssistantError("تعذر حفظ إعدادات صفحة الحجز.", 500);
        changeApplied = true;
      } else {
        throw new AssistantError("نطاق تعديل التصميم غير مسموح.", 400);
      }
    } else {
      throw new AssistantError("نوع المقترح غير صالح.", 400);
    }

    const confirmed = { ...action, status: "confirmed" };
    const { error: statusError } = await supabase
      .from("ai_assistant_messages")
      .update({ action: confirmed })
      .eq("id", messageId);
    if (statusError) {
      console.error("Change was applied but proposal status could not be saved:", statusError);
      throw new AssistantError("تم تطبيق التغيير، لكن تعذر تحديث حالة المقترح. تحقق من النتيجة قبل إعادة المحاولة.", 500);
    }
    return {
      reply: action.kind === "business" ? "تم تطبيق التغيير بعد تأكيدك." : "تم تطبيق تعديل التصميم بعد تأكيدك.",
      theme: updatedTheme,
    };
  } catch (error) {
    if (!changeApplied) {
      const { error: resetError } = await supabase
        .from("ai_assistant_messages")
        .update({ action: { ...action, status: "pending" } })
        .eq("id", messageId)
        .eq("action->>status", "applying");
      if (resetError) console.error("Failed to release pending assistant proposal:", resetError);
    } else {
      console.error("Change was applied but proposal completion failed; leaving it locked to prevent duplicate execution.");
    }
    throw error;
  }
};

const erpTool = {
  type: "function",
  function: {
    name: "propose_erp_change",
    description: "Ask for missing fields in normal text, or propose a create, update, or delete action for one supported ERP record. Never execute it.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        operation: { type: "string", enum: ["create", "update", "delete"] },
        entity: { type: "string", enum: Object.keys(entities) },
        data: { type: "object", additionalProperties: true },
        match: { type: "object", additionalProperties: true },
      },
      required: ["summary", "operation", "entity"],
    },
  },
};

const designTool = {
  type: "function",
  function: {
    name: "propose_design_changes",
    description: "Propose only safe, allowlisted design settings. Do not execute changes.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              scope: { type: "string", enum: ["global_theme", "repair_page_settings"] },
              key: { type: "string" },
              value: { type: "string" },
            },
            required: ["scope", "key", "value"],
          },
        },
      },
      required: ["summary", "changes"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("ERP assistant Supabase credentials are not configured");
      return jsonResponse({ error: "Assistant service is not configured" }, 503);
    }
    if (!openRouterKey) return jsonResponse({ error: "خدمة الذكاء الاصطناعي غير مفعّلة على الخادم." }, 503);

    const payload: unknown = await req.json();
    if (!isRecord(payload) || typeof payload.threadId !== "string" || !uuidPattern.test(payload.threadId)) {
      return jsonResponse({ error: "Invalid conversation" }, 400);
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Invalid authentication" }, 401);

    const { data: roleRecord, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (roleError) {
      console.error("Failed to load assistant caller role:", roleError);
      return jsonResponse({ error: "Could not verify account permissions" }, 500);
    }
    if (roleRecord?.role !== "admin") return jsonResponse({ error: "Admin access is required" }, 403);

    const { data: thread, error: threadError } = await supabase
      .from("ai_assistant_threads")
      .select("id, assistant_type")
      .eq("id", payload.threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (threadError) {
      console.error("Failed to load assistant thread:", threadError);
      return jsonResponse({ error: "Could not load conversation" }, 500);
    }
    if (!thread || (thread.assistant_type !== "erp" && thread.assistant_type !== "design")) {
      return jsonResponse({ error: "Conversation not found" }, 404);
    }

    if (typeof payload.actionMessageId === "string") {
      const result = await confirmAction(
        supabase,
        thread.id,
        payload.actionMessageId,
        payload.decision,
      );
      await supabase
        .from("ai_assistant_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", thread.id)
        .eq("user_id", user.id);
      return jsonResponse(result);
    }

    const imageDataUrl = payload.imageDataUrl;
    if (imageDataUrl !== undefined) {
      if (thread.assistant_type !== "design") return jsonResponse({ error: "Images are only supported by the design assistant" }, 400);
      if (
        typeof imageDataUrl !== "string" ||
        imageDataUrl.length > 5_600_000 ||
        !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageDataUrl)
      ) return jsonResponse({ error: "الصورة غير صالحة أو أكبر من الحد المسموح." }, 400);
    }

    const { data: messageRows, error: messagesError } = await supabase
      .from("ai_assistant_messages")
      .select("role, content")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (messagesError) {
      console.error("Failed to load assistant messages:", messagesError);
      return jsonResponse({ error: "Could not load conversation messages" }, 500);
    }
    const messages = (messageRows || []).reverse();
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return jsonResponse({ error: "A user message is required" }, 400);
    }
    if (messages.some((message: { role: string; content: string }) =>
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string" ||
      message.content.length > 4200
    )) return jsonResponse({ error: "Invalid conversation message" }, 400);

    const entityList = Object.entries(entities).map(([key, value]) =>
      `${key}: ${value.label}؛ الحقول المطلوبة: ${value.required.map(field => fieldLabels[field] || field).join("، ")}؛ الحقول المتاحة: ${Object.keys(value.fields).map(field => fieldLabels[field] || field).join("، ")}`
    ).join("\n");
    const systemPrompt = thread.assistant_type === "erp"
      ? `أنت مساعد نظام ERP للوجيه وتعمل مع مدير النظام.
ساعده في إدارة السجلات. الكيانات المسموحة فقط: ${entityList}.
إذا كان الطلب عن إنشاء مستخدم أو حساب أو تعيين صلاحيات/أدوار، لا تفسره كإضافة مورد، ولا تستخدم أداة الإجراء؛ وضّح أن إدارة الحسابات والصلاحيات غير متاحة للمساعد. إذا كانت هناك معلومات ناقصة اسأل عنها في رد عادي، ولا تقترح إجراءً حتى تكتمل الحقول المطلوبة. الحقول المطلوبة فقط هي التي تمنع إعداد المقترح؛ الحقول الاختيارية لا تسأل عنها، وإذا رفض المستخدم إضافة حقل اختياري فتجاهله. في التعديل والحذف اطلب اسمًا أو رقمًا يحدد سجلًا واحدًا. عند اكتمال البيانات استخدم أداة propose_erp_change لعرض مقترح فقط، ولا تقل إنك لا تستطيع إعداد المقترح.
إذا حدّد المستخدم تاريخ طلب بيع أو شراء، استخدم صيغة YYYY-MM-DD.
المقترح ليس تنفيذًا. لا تنفذ أي عملية بنفسك، ولا تدّعِ نجاحها قبل تأكيد المدير. لا تدعم إدارة الحسابات والصلاحيات أو تعديل سجلات الحضور والمواقع. أجب بلغة المستخدم وباختصار.`
      : `أنت مساعد تصميم موقع الوجيه.
يمكنك اقتراح تغييرات آمنة فقط على مفاتيح global_theme التالية: ${themeKeys.join(", ")}، وعلى إعدادات repair_page_settings التالية: ${repairSettings.join(", ")}.
global_theme يغيّر ألوان وخط وحواف جميع اللوحات. repair_page_settings يغيّر نصوص/إعدادات صفحة حجز الإصلاح. لا تقترح أكواد CSS أو JavaScript أو HTML ولا تغيّر بنية الصفحات.
إذا أرفق المدير صورة فحللها لتفهم طلبه، ثم اسأله إذا كان الهدف غير واضح. عند اكتمال الطلب استخدم أداة propose_design_changes لعرض مقترح فقط. لا تطبق شيئًا قبل تأكيد المدير. أجب بلغة المستخدم.`;

    const model = Deno.env.get("OPENROUTER_MODEL") || "openai/gpt-4o-mini";
    const lastUserMessage = [...messages].reverse().find(message => message.role === "user")?.content || "";
    const accountManagementRequest = /(?:مستخدم\s+جديد|حساب\s+جديد|(?:إضافة|اضافة|إنشاء|انشاء|تضيف|أضف|اضف).{0,24}(?:مستخدم|حساب)|(?:صلاحية|صلاحيات|أذونات).{0,32}(?:مستخدم|حساب|موظف|الموردين|المورد)|\b(?:user|account|permission|role)\b)/i.test(lastUserMessage);
    const requiresErpProposal = thread.assistant_type === "erp" &&
      !accountManagementRequest &&
      /(?:\b(?:add|create|update|edit|delete|remove)\b|أضف|اضف|أضيف|اضيف|إضافة|اضافة|ضيف|سجّل|سجل|أنشئ|انشئ|عدّل|عدل|غيّر|غير|احذف|حذف|امسح|جهّز\s+المقترح|جهز\s+المقترح)/i.test(lastUserMessage);
    const providerMessages = messages.map((message: { role: string; content: string }, index: number) => ({
      role: message.role,
      content: imageDataUrl && index === messages.length - 1
        ? [
          { type: "text", text: message.content },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ]
        : message.content,
    }));
    const completion = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...providerMessages],
        tools: [thread.assistant_type === "erp" ? erpTool : designTool],
        tool_choice: requiresErpProposal ? "required" : "auto",
      }),
    });

    if (!completion.ok) {
      const errorText = await completion.text();
      console.error("OpenRouter ERP assistant error:", completion.status, errorText);
      if (completion.status === 429) return jsonResponse({ error: "تم تجاوز الحد المسموح، حاول لاحقاً." }, 429);
      if (completion.status === 402) return jsonResponse({ error: "رصيد خدمة الذكاء الاصطناعي غير كافٍ." }, 402);
      return jsonResponse({ error: "تعذر الحصول على رد من خدمة الذكاء الاصطناعي." }, 502);
    }

    const completionData = await completion.json();
    const assistantResponse = completionData?.choices?.[0]?.message;
    let reply = typeof assistantResponse?.content === "string" ? assistantResponse.content.trim() : "";
    let action: ActionRecord | undefined;
    const toolCall = assistantResponse?.tool_calls?.[0];
    if (toolCall?.function?.name && typeof toolCall.function.arguments === "string") {
      let args: unknown;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new AssistantError("تعذر فهم اقتراح المساعد. أعد صياغة الطلب.", 502);
      }
      if (!isRecord(args)) throw new AssistantError("صيغة اقتراح المساعد غير صالحة.", 502);
      if (thread.assistant_type === "erp" && toolCall.function.name === "propose_erp_change") {
        const prepared = await prepareBusinessAction(supabase, args as BusinessRequest, user.id);
        reply = prepared.reply;
        action = prepared.action;
      } else if (thread.assistant_type === "design" && toolCall.function.name === "propose_design_changes") {
        const prepared = await prepareDesignAction(supabase, args.changes, args.summary);
        reply = prepared.reply;
        action = prepared.action;
      }
    }
    if (!reply) reply = "لم يصل رد من المساعد. حاول مرة أخرى.";

    const { error: saveError } = await supabase
      .from("ai_assistant_messages")
      .insert({
        thread_id: thread.id,
        role: "assistant",
        content: reply,
        action: action || null,
      });
    if (saveError) {
      console.error("Failed to save assistant response:", saveError);
      return jsonResponse({ error: "تعذر حفظ رد المساعد." }, 500);
    }
    const { error: updateError } = await supabase
      .from("ai_assistant_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", thread.id)
      .eq("user_id", user.id);
    if (updateError) {
      console.error("Failed to update assistant thread:", updateError);
      return jsonResponse({ error: "تعذر تحديث المحادثة." }, 500);
    }
    return jsonResponse({ reply, action: action || null });
  } catch (error) {
    console.error("ERP assistant error:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الرسالة.",
    }, error instanceof AssistantError ? error.status : 500);
  }
});
