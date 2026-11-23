import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const constantTimeEquals = (left: string, right: string) => {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
};

const isAllowedPushEndpoint = (endpoint: string) => {
  try {
    const url = new URL(endpoint);
    const allowedHosts = [
      "fcm.googleapis.com",
      "push.services.mozilla.com",
      "web.push.apple.com",
      "notify.windows.com",
    ];
    return url.protocol === "https:" && allowedHosts.some(
      host => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
};

Deno.serve(async req => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const deployToken = Deno.env.get("PUSH_DEPLOY_TOKEN");
  if (!deployToken || !constantTimeEquals(req.headers.get("x-deploy-token") || "", deployToken)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const { version } = await req.json();
    if (typeof version !== "string" || !/^[a-f0-9]{7,40}$/i.test(version)) {
      return jsonResponse({ error: "Invalid update version" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");
    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error("App update push secrets are not fully configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: subscriptions, error } = await supabaseAdmin
      .from("app_update_push_subscriptions")
      .select("endpoint,p256dh,auth");
    if (error) throw error;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    let sent = 0;
    let removed = 0;
    let failed = 0;
    const payload = JSON.stringify({
      title: "تحديث جديد من الوجيه",
      body: "تم رفع تحديث جديد للتطبيق. اضغط لفتح التطبيق.",
      version,
      url: "/home",
    });

    for (let offset = 0; offset < (subscriptions || []).length; offset += 25) {
      const batch = (subscriptions || []).slice(offset, offset + 25);
      const results = await Promise.all(batch.map(async subscription => {
        if (!isAllowedPushEndpoint(subscription.endpoint)) {
          const { error: deleteError } = await supabaseAdmin
            .from("app_update_push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
          if (deleteError) throw deleteError;
          return "removed" as const;
        }

        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
            { TTL: 60 * 60 },
          );
          return "sent" as const;
        } catch (error) {
          const statusCode = typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : 0;

          if (statusCode === 404 || statusCode === 410) {
            const { error: deleteError } = await supabaseAdmin
              .from("app_update_push_subscriptions")
              .delete()
              .eq("endpoint", subscription.endpoint);
            if (deleteError) throw deleteError;
            return "removed" as const;
          }

          console.error("App update push delivery failed", { statusCode });
          return "failed" as const;
        }
      }));

      for (const result of results) {
        if (result === "sent") sent += 1;
        else if (result === "removed") removed += 1;
        else failed += 1;
      }
    }

    if (failed > 0) {
      return jsonResponse({ error: "Some app update notifications failed", sent, removed, failed }, 502);
    }
    return jsonResponse({ sent, removed, failed });
  } catch (error) {
    console.error("notify-app-update failed", error);
    return jsonResponse({ error: "Unable to send app update notifications" }, 500);
  }
});
