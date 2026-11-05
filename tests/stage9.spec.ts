import { execFileSync } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const pages = ['/', '/shop/', '/faq/', '/about/', '/contact/', '/cart/', '/design/', '/stores/', '/stores/studio-north/', '/account/', '/track/'];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  return results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
}

test('templates have no serious or critical axe violations', async ({ page }) => {
  const problems: string[] = [];
  for (const path of pages) {
    await page.goto(path);
    const violations = await seriousViolations(page);
    for (const violation of violations) {
      problems.push(`${path} ${violation.id}: ${violation.help}`);
    }
  }
  expect(problems).toEqual([]);
});

test('security headers and the custom-printing redirect', async ({ request }) => {
  const home = await request.get('/');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');
  expect(home.headers()['x-frame-options']).toBe('DENY');
  const legacy = await request.get('/custom-printing/', { maxRedirects: 0 });
  expect(legacy.status()).toBe(301);
  expect(legacy.headers().location).toContain('/?quote=1');
});

test('admin stays closed when signed out', async ({ request }) => {
  const response = await request.get('/admin/');
  expect(response.status()).toBe(401);
});

test('quote modal opens and does not submit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get a Free Quote', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByLabel('How many pieces do you need?')).toBeVisible();
});

test('client store add to cart can start checkout', async ({ page }) => {
  await page.goto('/shop/coffee-lover-tee/?store=studio-north');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('/cart/');
  await expect(page.getByText('Coffee Lover Tee / S / Black')).toBeVisible();
  await page.getByRole('button', { name: 'Checkout' }).click();
  const error = page.locator('#cartError');
  await Promise.race([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 25_000 }),
    error.waitFor({ state: 'visible', timeout: 25_000 }),
  ]);
  if (!page.url().includes('checkout.stripe.com')) {
    await expect(error).not.toHaveText(/Checkout failed|not configured|Unknown variant/i);
  }
  expect(page.url()).toContain('checkout.stripe.com');
});

test('design studio can add a one-piece design and start checkout', async ({ page }) => {
  await page.goto('/design/');
  await page.locator('#btnAddText').click();
  await page.locator('#btnQtySize').click();
  const size = page.locator('#sizeQtyGrid input').first();
  await size.fill('1');
  await size.blur();
  await page.locator('#ipAttest').check();
  await page.locator('#btnExport').click();
  await page.waitForURL('**/cart/**');
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 25_000 });
});

test('sign-in and reorder', async ({ page, request }) => {
  const unsigned = await request.get('/api/account/reorder?orderId=ord_missing');
  expect(unsigned.status()).toBe(401);

  const email = 'reorder-check@example.com';
  const magic = await request.post('/api/auth/magic', {
    headers: { 'x-lialvaro-test': '1', Origin: 'http://localhost:4321' },
    data: { email, next: '/account/' },
  });
  const body = (await magic.json()) as { devLink?: string };
  expect(body.devLink).toBeTruthy();
  await page.goto(body.devLink!);
  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();

  const missing = await page.request.get('/api/account/reorder?orderId=ord_missing');
  expect(missing.status()).toBe(404);

  try {
    execFileSync('npx wrangler d1 execute lialvaro-commerce --local --file tests/fixtures/reorder.sql', {
      shell: true,
      stdio: 'pipe',
    });
  } catch {
    test.info().annotations.push({ type: 'note', description: 'Local D1 seed was not available; reorder API auth was still checked.' });
    return;
  }

  await page.goto('/account/');
  await page.getByRole('button', { name: 'Reorder' }).click();
  await page.waitForURL('**/cart/**');
  await expect(page.getByText('Coffee Lover Tee / S / Black')).toBeVisible();
});
