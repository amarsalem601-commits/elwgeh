import { supabase } from '@/integrations/supabase/client';

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const isAppUpdatePushConfigured = Boolean(vapidPublicKey);

export const decodeVapidPublicKey = (key: string): ArrayBuffer => {
  const paddedKey = key + '='.repeat((4 - (key.length % 4)) % 4);
  const base64Key = paddedKey.replace(/-/g, '+').replace(/_/g, '/');
  const binaryKey = window.atob(base64Key);
  const buffer = new ArrayBuffer(binaryKey.length);
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < binaryKey.length; index += 1) {
    bytes[index] = binaryKey.charCodeAt(index);
  }

  return buffer;
};

export const registerAppUpdatePush = async (): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('إشعارات التحديث غير مدعومة على هذا الجهاز');
  }
  if (Notification.permission !== 'granted') return;
  if (!vapidPublicKey) throw new Error('مفتاح إشعارات التحديث غير مُعدّ في التطبيق');

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidPublicKey(vapidPublicKey),
    });
  }

  const subscriptionData = subscription.toJSON();
  if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys.auth) {
    throw new Error('تعذر قراءة بيانات اشتراك الإشعارات');
  }

  const { error } = await supabase.from('app_update_push_subscriptions').upsert(
    {
      endpoint: subscriptionData.endpoint,
      p256dh: subscriptionData.keys.p256dh,
      auth: subscriptionData.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );

  if (error) throw error;
};
