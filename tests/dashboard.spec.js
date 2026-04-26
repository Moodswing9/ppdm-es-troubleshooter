// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PPDM Elasticsearch Troubleshooter — smoke tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/PPDM Elasticsearch Troubleshooter/i);
    await expect(page.locator('h1')).toContainText('PPDM Elasticsearch Troubleshooter');
  });

  test('overall status badge is present and renders an initial state', async ({ page }) => {
    const badge = page.locator('#overallStatus');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/Not Checked|Checking|Healthy|Issues/i);
  });

  test('header shows version metadata for PPDM and Elasticsearch', async ({ page }) => {
    await expect(page.locator('.header-badge')).toContainText('PPDM');
    await expect(page.locator('.header-badge')).toContainText('ES');
  });

  test('all four health-overview metric cards render', async ({ page }) => {
    await expect(page.locator('#esNodes')).toBeVisible();
    await expect(page.locator('#indexHealth')).toBeVisible();
    await expect(page.locator('#lastBackup')).toBeVisible();
    await expect(page.locator('#queryRate')).toBeVisible();
  });

  test('primary action buttons are present and clickable', async ({ page }) => {
    const fullDiag = page.locator('#fullDiagBtn');
    await expect(fullDiag).toBeVisible();
    await expect(fullDiag).toBeEnabled();
    await expect(fullDiag).toContainText(/Full Diagnostics/i);
  });

  test('settings panel opens when gear icon is clicked', async ({ page }) => {
    const panel = page.locator('#settingsPanel');
    // Find the settings button by title attribute
    await page.locator('button[title="Connection settings"]').click();
    await expect(panel).toBeVisible();
    // Form fields should be present
    await expect(page.locator('#cfgPpdmHost')).toBeVisible();
    await expect(page.locator('#cfgEsHost')).toBeVisible();
    await expect(page.locator('#cfgEsPort')).toBeVisible();
  });

  test('dark mode toggle flips data-theme attribute and button label', async ({ page }) => {
    const html = page.locator('html');
    const btn = page.locator('#darkModeBtn');

    // Default is light mode — data-theme is empty, button shows 🌙
    await expect(btn).toContainText('🌙');
    expect(await html.getAttribute('data-theme')).toBe('');

    await btn.click();

    // After toggle: dark mode active
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(btn).toContainText('☀️');
  });

  test('diagnostic cards grid renders multiple modules', async ({ page }) => {
    const cards = page.locator('.card.fade-in');
    // System Health Overview + at least 9 diagnostic modules = 10+ cards expected
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('export and print buttons are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export JSON/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Print Report/i })).toBeVisible();
  });

  test('page has no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
