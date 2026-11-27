import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    return new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.fallback()
      : route.abort();
  });
});

test('contact form allows one active submission and displays its reference', async ({ page }) => {
  await page.route('**/api/public-config', route => route.fulfill({
    json: { storage: { provider: 'local-file-store', persistent: true } },
  }));
  let requests = 0;
  let confirmSubmission!: () => void;
  const pending = new Promise<void>(resolve => { confirmSubmission = resolve; });
  await page.route('**/api/contact', async route => {
    requests++;
    await pending;
    await route.fulfill({ status: 201, json: { referenceNumber: 'DTC-2026-ABC123' } });
  });
  await page.goto('/contact');
  await page.getByLabel('Full Name').fill('Test Customer');
  await page.getByLabel('Email Address').fill('customer@example.invalid');
  await page.getByLabel('Subject').fill('Test enquiry');
  await page.getByLabel('Message').fill('This is a test acquisition message.');
  const submit = page.getByRole('button', { name: 'Send Message' });
  await expect(submit).toBeEnabled();
  await page.locator('form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect.poll(() => requests).toBe(1);
  await expect(page.getByRole('button', { name: 'Sending...' })).toBeDisabled();
  confirmSubmission();
  await expect(page.getByText('DTC-2026-ABC123')).toBeVisible();
  expect(requests).toBe(1);
});

test('direct navigation opens the lazy administrative route', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Administrator Access Required' })).toBeVisible();
});

test('production preview serves the primary image with optional integrations disabled', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'DayTech enterprise technology operations and engineering architecture' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open DayTech Live Voice Advisor' })).toHaveCount(0);
  const image = await page.request.get('/src/assets/images/hero_tech_architecture_1795598738822.jpg');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/jpeg');
});

test('planned products preserve public routes and open dedicated interest form', async ({ page }) => {
  await page.goto('/products/schools');
  await expect(page.getByRole('heading', { name: 'DayTech Schools', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Planned capabilities' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Launch Application' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Register early interest' }).click();
  await expect(page.getByRole('combobox', { name: 'Product', exact: true })).toHaveValue('schools');
  await page.goto('/products/rentals');
  await expect(page.getByRole('heading', { name: 'DayTech Rentals', exact: true })).toBeVisible();
});

test('all catalogue routes resolve and pending products have no application launch', async ({ page }) => {
  for (const slug of ['sacco', 'hr', 'hotelos', 'farm', 'crm', 'inventory', 'meet', 'finance', 'waterops', 'schools', 'rentals']) {
    await page.goto('/products/' + slug);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^DayTech/);
    await expect(page.getByRole('link', { name: 'Launch Application' })).toHaveCount(0);
  }
});

test('profit and QR tools run in the browser', async ({ page }) => {
  await page.goto('/tools');
  await page.getByLabel('Revenue (UGX)').fill('150000');
  await page.getByLabel('Costs (UGX)').fill('100000');
  await page.getByRole('button', { name: 'Calculate profit' }).click();
  await expect(page.getByText('Profit: UGX 50,000')).toBeVisible();
  await page.getByLabel('Text or URL').fill('https://example.invalid');
  await page.getByRole('button', { name: 'Generate QR code' }).click();
  await expect(page.getByRole('img', { name: 'QR code for the entered text' })).toBeVisible();
});

test('invoice copy is printable and describes its non-tax scope', async ({ page }) => {
  await page.goto('/tools');
  await page.getByLabel('Business name').fill('Sample Shop');
  await page.getByLabel('Customer name').fill('Sample Buyer');
  await page.getByLabel('Invoice number').fill('INV-014');
  await page.getByLabel('Description', { exact: true }).fill('Support services');
  await page.getByLabel('Amount (UGX)').fill('65000');
  await page.getByRole('button', { name: 'Preview invoice' }).click();
  await expect(page.getByRole('heading', { name: 'Invoice INV-014' })).toBeVisible();
  await expect(page.getByText('Support services · UGX 65,000')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
});

test('an approved public projection renders the verified product and launch destination', async ({ page }) => {
  await page.route('**/api/products/inventory/release', route => route.fulfill({ json: {
    status: 'Available', description: 'Published emulator fixture.', capabilities: ['Verified sample capability'],
    launchUrl: 'https://app.example.invalid/launch', pricing: [],
  } }));
  await page.goto('/products/inventory');
  await expect(page.getByText('Published emulator fixture.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Launch Application' })).toHaveAttribute('href', 'https://app.example.invalid/launch');
});
