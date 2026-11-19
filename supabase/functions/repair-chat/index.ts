import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonError = (message: string, status = 500) => new Response(JSON.stringify({ error: message }), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonError("Method not allowed", 405);

  try {
    const payload = await req.json();
    if (!Array.isArray(payload?.messages) || payload.messages.length === 0 || payload.messages.length > 20) {
      return jsonError("Invalid chat messages", 400);
    }

    const messages = payload.messages.filter((message: unknown) => {
      if (!message || typeof message !== "object") return false;
      const item = message as { role?: unknown; content?: unknown };
      return (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && item.content.length <= 4000;
    });
    if (messages.length !== payload.messages.length) return jsonError("Invalid chat message format", 400);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    const model = Deno.env.get("OPENROUTER_MODEL") || "openai/gpt-4o-mini";
    if (!apiKey) return jsonError("OPENROUTER_API_KEY is not configured", 503);

    const systemPrompt = `أنت مساعد ذكي متخصص في إصلاح السيارات تعمل لصالح "الوجيه لمنظمات الهواء".
مهمتك:
- اسأل العميل عن مشكلة سيارته بالتفصيل.
- اسأل عن نوع السيارة والموديل إذا لم يذكرها.
- قدم تشخيصاً مبدئياً آمناً، ووضح أن الفحص الفني هو المرجع النهائي.
- لا تخمن أسعاراً محددة؛ اطلب من العميل التواصل مع الفرع لمعرفة التكلفة.
- شجع العميل على حجز موعد للإصلاح.
- كن ودوداً ومهنياً.
- أجب بالعربية دائماً إلا إذا تحدث العميل بالإنجليزية.
- لا تطلب بيانات شخصية حساسة.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      if (response.status === 429) {
        return jsonError("تم تجاوز الحد المسموح، حاول لاحقاً", 429);
      }
      if (response.status === 402) return jsonError("رصيد OpenRouter غير كافٍ", 402);
      if (response.status === 401 || response.status === 403) return jsonError("مفتاح OpenRouter غير صالح أو لا يملك صلاحية", 502);
      return jsonError("تعذر الحصول على رد من خدمة الذكاء الاصطناعي", 502);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("repair-chat error:", error);
    return jsonError("حدث خطأ أثناء معالجة الرسالة");
  }
});
