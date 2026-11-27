import { createApiApp } from '../server/app';

const apiApp = createApiApp();

export default function handler(...args: Parameters<typeof apiApp>) {
  return apiApp(...args);
}
