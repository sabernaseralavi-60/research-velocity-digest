import { test, expect, Page } from '@playwright/test';

// screenshots are for a human to look at; a capture hiccup (very tall page) must not fail the behaviour tests
const shot = async (page: Page, name: string, testInfo: { project: { name: string } }) => {
  const path = `test-results/shots/${testInfo.project.name}-${name}.png`;
  await page.screenshot({ path, fullPage: true }).catch(() => page.screenshot({ path }));
};

test('database mode shows real papers, the growth panel and topics', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Live citation database' })).toBeVisible();
  await expect(page.getByText('Demo data:')).toHaveCount(0);
  const topicSelect = page.getByLabel('Topic', { exact: true });
  await expect(topicSelect.locator('option')).not.toHaveCount(0);
  // the first topic is the broad AI one: hydrated works with real titles, no synthetic ids
  await expect(page.locator('text=/recent citation/i').first()).toBeVisible({ timeout: 15_000 });
  const html = await page.content();
  expect(html).not.toContain('W_ATTENTION');
  expect(html).not.toContain('W_DORMANT');
  await shot(page, 'db-default', testInfo);
});

test('a focused topic with a 30-day window shows sleeping beauties and latent gems', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('Topic', { exact: true }).selectOption({ label: 'Surrogate safety measures' });
  await page.getByRole('button', { name: '30 days' }).click();
  await expect(page.getByText('Latent Gems (Pre-Awakening Candidates)')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/lexical/i).first()).toBeVisible();
  await shot(page, 'db-gems', testInfo);
});

test('demo mode is labelled synthetic', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Demo (synthetic)' }).click();
  await expect(page.getByText(/Demo data: the papers below are a synthetic fixture/)).toBeVisible();
  await shot(page, 'demo', testInfo);
});

test('live mode failure shows an error and never substitutes data (F-003)', async ({ page }) => {
  await page.route('https://api.openalex.org/**', (route) => route.fulfill({ status: 500, body: 'boom' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'OpenAlex now' }).click();
  await expect(page.getByRole('alert')).toContainText('Live run failed');
  await expect(page.getByText('Attention Is All You Need')).toHaveCount(0);
});

test('email tab renders without crashing (F-005)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: /email/i }).first().click();
  await expect(page.locator('iframe[title="Email Digest Preview"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('topic management: wrong token is refused, right token adds then removes', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Manage monitored topics').click();
  await page.getByLabel('Admin token').fill('wrong');
  await page.getByLabel('Topic label').fill('E2E temporary topic');
  await page.getByRole('button', { name: 'Add topic' }).click();
  await expect(page.getByText('missing or wrong admin token')).toBeVisible();

  await page.getByLabel('Admin token').fill('e2e-admin-token');
  await page.getByRole('button', { name: 'Add topic' }).click();
  await expect(page.getByText(/Topic saved/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove E2E temporary topic' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove E2E temporary topic' }).click();
  await expect(page.getByRole('button', { name: 'Remove E2E temporary topic' })).toHaveCount(0);
});

test('no horizontal overflow on this viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Live citation database' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
