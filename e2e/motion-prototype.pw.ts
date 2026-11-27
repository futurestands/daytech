import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

test('desktop workspace animates controls and supports keyboard dialog workflows', async ({ page }) => {
  await page.goto('/motion-prototype');
  await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('combobox', { name: 'Reporting period' }).selectOption('90');
  await expect(page.getByText('8,053', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Period 1, 640 sessions' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Period 1 · 640 sessions')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  const add = page.getByRole('button', { name: 'New activity' });
  await add.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(add).toBeFocused();
  await add.click();
  await dialog.getByLabel('Organisation').fill('Test Studio');
  await dialog.getByRole('button', { name: 'Add sample activity' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('rowheader', { name: /Test Studio/ })).toBeVisible();
  await page.getByRole('searchbox').fill('unmatched');
  await expect(page.getByRole('heading', { name: 'No matching records' })).toBeVisible();
});

test('mobile navigation works with reduced motion and keeps the page within the viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/motion-prototype');
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await page.getByRole('button', { name: 'Analytics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('.dt-sidebar').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
});
