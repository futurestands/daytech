import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiApp } from '../server/app';

const apiApp = createApiApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return apiApp(req as unknown as Parameters<typeof apiApp>[0], res as unknown as Parameters<typeof apiApp>[1]);
}
