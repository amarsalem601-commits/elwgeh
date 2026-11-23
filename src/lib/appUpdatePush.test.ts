import { afterEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
const originalNotification = Object.getOwnPropertyDescriptor(window, 'Notification');
const originalPushManager = Object.getOwnPropertyDescriptor(window, 'PushManager');
const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: rpcMock },
}));

import { decodeVapidPublicKey, registerAppUpdatePush } from './appUpdatePush';

afterEach(() => {
  vi.unstubAllGlobals();
  rpcMock.mockReset();
  if (originalNotification) Object.defineProperty(window, 'Notification', originalNotification);
  else Reflect.deleteProperty(window, 'Notification');
  if (originalPushManager) Object.defineProperty(window, 'PushManager', originalPushManager);
  else Reflect.deleteProperty(window, 'PushManager');
  if (originalServiceWorker) Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
  else Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('appUpdatePush', () => {
  it('decodes base64url keys with omitted padding', () => {
    const bytes = new Uint8Array(decodeVapidPublicKey('-_8'));

    expect([...bytes]).toEqual([251, 255]);
  });

  it('decodes standard base64 keys', () => {
    const bytes = new Uint8Array(decodeVapidPublicKey('AQID'));

    expect([...bytes]).toEqual([1, 2, 3]);
  });

  it('saves an existing push subscription through the registration RPC', async () => {
    const subscription = {
      toJSON: () => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'p'.repeat(65), auth: 'a'.repeat(22) },
      }),
    };

    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
    Object.defineProperty(window, 'PushManager', { configurable: true, value: class PushManager {} });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
        }),
      },
    });
    rpcMock.mockResolvedValue({ error: null });

    await registerAppUpdatePush();

    expect(rpcMock).toHaveBeenCalledWith('register_app_update_push_subscription', {
      p_endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      p_p256dh: 'p'.repeat(65),
      p_auth: 'a'.repeat(22),
    });
  });
});
