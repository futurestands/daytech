import { expect, test } from '@playwright/test';
import { createFirestoreStore } from '../server/lib/firestoreStore';

test('homepage serves its favicon and exposes the currency selector to keyboard users', async ({ page, request }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/');
  const icon = await request.get(await page.locator('link[rel="icon"]').getAttribute('href') ?? '');
  expect(icon.headers()['content-type']).toContain('image/svg+xml');
  const currency = page.getByRole('combobox', { name: 'Select display currency' });
  await expect(currency).toHaveAttribute('name', 'currency');
  await currency.focus();
  await page.keyboard.press('Home');
  await expect(currency).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(currency).toHaveValue('USD');
});

test('public product page renders a real emulator-backed release and keeps drafts private', async ({ page, request }) => {
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  test.skip(!emulator, 'Run against the isolated Firestore Emulator.');
  const store = createFirestoreStore({ NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: emulator });
  const path = 'productReleases/rentals';
  const seed = store.put(path, {
    projection: JSON.stringify({
      description: 'Rentals release from the isolated emulator.', status: 'Available',
      capabilities: ['Synthetic release capability'], releaseVersion: '1.0', launchUrl: '', pricing: [],
    }),
  }, { exists: false }, ['publishedAt']);
  if (!('update' in seed)) throw new Error('Expected a Firestore update.');
  await store.commit([seed]);
  try {
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const release = page.waitForResponse(response => new URL(response.url()).pathname === '/api/products/rentals/release');
    await page.goto('/products/rentals');
    expect((await release).status()).toBe(200);
    await expect(page.getByText('Rentals release from the isolated emulator.', { exact: true })).toBeVisible();
    await page.goto('/products');
    await expect(page.getByText('Property Management · Available')).toBeVisible();
    expect((await request.get('/api/admin/product-drafts/rentals')).status()).toBe(401);
  } finally {
    const document = await store.get(path);
    if (document) await store.commit([{ delete: seed.update.name, currentDocument: { updateTime: document.updateTime } }]);
  }
});
