import { describe, expect, it } from 'vitest';
import { decodeVapidPublicKey } from './appUpdatePush';

describe('decodeVapidPublicKey', () => {
  it('decodes base64url keys with omitted padding', () => {
    const bytes = new Uint8Array(decodeVapidPublicKey('-_8'));

    expect([...bytes]).toEqual([251, 255]);
  });

  it('decodes standard base64 keys', () => {
    const bytes = new Uint8Array(decodeVapidPublicKey('AQID'));

    expect([...bytes]).toEqual([1, 2, 3]);
  });
});
