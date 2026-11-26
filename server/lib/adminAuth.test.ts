import { describe, expect, it } from 'vitest';
import { evaluateAdminRequest, ALL_STAFF_ROLES } from './adminAuth';

describe('administrative authentication', () => {
  it.each([{ NODE_ENV: 'production' }, { VERCEL: '1' }])(
    'rejects legacy access keys and unkeyed access in %j',
    async (runtime) => {
      const env = { ...runtime, ADMIN_ACCESS_KEY: 'local-key', ALLOW_UNKEYED_LOCAL_ADMIN: 'true' };
      for (const headers of [{ 'x-admin-token': 'local-key' }, {}]) {
        expect((await evaluateAdminRequest({ headers }, ALL_STAFF_ROLES, { env })).authorized).toBe(false);
      }
    }
  );

  it.each([...ALL_STAFF_ROLES, 'client'])('enforces role and account state for %s', async (role) => {
    for (const active of [true, false]) {
      const result = await evaluateAdminRequest(
        { headers: { authorization: 'Bearer test' } },
        ALL_STAFF_ROLES,
        {
          env: { NODE_ENV: 'production' },
          verifyToken: async () => ({ uid: 'staff-uid', emailVerified: true }),
          fetchUser: async () => ({ uid: 'staff-uid', role, active }),
        }
      );
      expect(result.authorized).toBe(active && role !== 'client');
    }
  });
});
