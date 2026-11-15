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
    const versionBadge = page.locator('.header-badge', { hasText: 'PPDM' });
    await expect(versionBadge).toContainText('PPDM');
    await expect(versionBadge).toContainText('ES');
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

    // Default: light mode — button shows the moon icon
    await expect(btn).toContainText('🌙');

    // Click → dark mode active
    await btn.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(btn).toContainText('☀️');

    // Click again → back to light mode
    await btn.click();
    await expect(btn).toContainText('🌙');
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

  test('selecting an error pattern loads severity badge and remediation commands', async ({ page }) => {
    await page.locator('[data-pattern="connection"]').click();
    const actions = page.locator('#remediationActions');
    await expect(actions).toContainText('Connection Refused');
    await expect(actions).toContainText('systemctl status elasticsearch');
    await expect(actions).toContainText('HIGH SEVERITY');
  });

  test('running a single diagnostic check shows a result panel', async ({ page }) => {
    await page.locator('[data-check="corruption"]').click();
    await expect(page.locator('#result-corruption')).toHaveClass(/show/, { timeout: 4000 });
    await expect(page.locator('#result-corruption')).toContainText('Diagnostic Results');
  });

  test('re-running a check replaces Step 2 entry rather than duplicating it', async ({ page }) => {
    const checkBtn = page.locator('[data-check="shards"]');

    await checkBtn.click();
    await expect(checkBtn).toBeEnabled({ timeout: 4000 });

    await checkBtn.click();
    await expect(checkBtn).toBeEnabled({ timeout: 4000 });

    await expect(page.locator('[data-check-type="shards"]')).toHaveCount(1);
  });

  test('redactPII strips Bearer tokens, JSON credentials, and Basic auth headers', async ({ page }) => {
    const results = await page.evaluate(() => [
      redactPII('Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig'),
      redactPII('"password":"s3cr3t!"'),
      redactPII('Authorization: Basic dXNlcjpwYXNz'),
    ]);
    expect(results[0]).toBe('Bearer [TOKEN]');
    expect(results[1]).toBe('"[CREDENTIAL_KEY]":"***"');
    expect(results[2]).toBe('Authorization: Basic [REDACTED]');
  });
});

// Regression tests for CodeQL js/incomplete-html-attribute-sanitization:
// AI output and API error bodies are untrusted and must never become markup.
test.describe('HTML escaping of untrusted content', () => {
  // Breaks out of a double-quoted attribute, a single-quoted one, and element content.
  const PAYLOAD = `x" onmouseover="window.__pwned=1" data-x="' onfocus='window.__pwned=1' <img src=x onerror="window.__pwned=1" class="pwned">`;

  async function runAiDiagnoseWith(page, route) {
    await page.route('https://api.anthropic.com/**', route);
    await page.locator('#aiToggleBtn').click();   // panel starts collapsed
    await page.evaluate(() => {
      state.settings.anthropicKey = 'sk-ant-test';
      document.getElementById('aiLogInput').value = 'ERROR something failed';
    });
    await page.evaluate(() => runAiDiagnose());
    await expect(page.locator('#aiOutput')).toBeVisible();
  }

  async function expectNoInjection(page) {
    const body = page.locator('#aiOutputBody');
    await expect(body.locator('img, script, iframe, .pwned')).toHaveCount(0);
    await expect(body.locator('[onmouseover], [onfocus], [onerror], [data-x]')).toHaveCount(0);
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('escapeHtml escapes all five HTML-significant characters', async ({ page }) => {
    const out = await page.evaluate(() => escapeHtml(`& < > " '`));
    expect(out).toBe('&amp; &lt; &gt; &quot; &#39;');
    expect(await page.evaluate(() => escapeHtml(null))).toBe('');
  });

  test('hostile AI diagnosis renders as text, including inside data-cmd', async ({ page }) => {
    await runAiDiagnoseWith(page, route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', name: 'diagnose', input: {
          severity: PAYLOAD, affected_component: PAYLOAD, root_cause: PAYLOAD,
          actions: [PAYLOAD], prevention: PAYLOAD,
        } }],
      }),
    }));
    await expectNoInjection(page);
    const cmd = page.locator('#aiOutputBody .copy-cmd');
    await expect(cmd).toHaveCount(1);
    await expect(cmd).toHaveAttribute('data-cmd', PAYLOAD);   // round-trips exactly
    await expect(cmd).toHaveText(PAYLOAD);
  });

  test('hostile API error body renders as text', async ({ page }) => {
    await runAiDiagnoseWith(page, route => route.fulfill({
      status: 400, contentType: 'text/plain', body: PAYLOAD,
    }));
    await expectNoInjection(page);
    await expect(page.locator('#aiOutputBody')).toContainText(PAYLOAD);
  });

  test('data.js text with angle brackets is shown literally', async ({ page }) => {
    // errorPatterns contains "GET /<index>/_mapping"; unescaped, <index> vanished as a tag.
    const pattern = await page.evaluate(() =>
      Object.keys(errorPatterns).find(k =>
        [...errorPatterns[k].steps, ...errorPatterns[k].commands].some(s => s.includes('<index>'))));
    expect(pattern).toBeTruthy();
    await page.locator(`[data-pattern="${pattern}"]`).click();
    await expect(page.locator('#remediationActions')).toContainText('/<index>/_mapping');
  });
});
