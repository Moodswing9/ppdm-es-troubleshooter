# CLAUDE.md — ppdm-es-troubleshooter

## What This Is

A zero-dependency, zero-install browser diagnostic tool for PPDM Elasticsearch errors. Open `index.html` — that's it. No build step, no npm, no backend.

The app simulates diagnostic checks, guides engineers through error-pattern workflows, and optionally calls Claude Haiku 4.5 for AI-assisted root cause analysis.

## Running Locally

```bash
# Just open the file
open index.html                  # macOS
start index.html                 # Windows
xdg-open index.html              # Linux

# For Playwright tests (need a server)
npm install
npx playwright install
npm test                         # headless
npm run test:headed              # visible browser
npm run test:debug               # step through with inspector
npm run test:report              # open last HTML report
```

## Architecture

Three source files, no framework, no bundler:

| File | Role |
|---|---|
| `index.html` | App shell, all UI markup, inline `<style>` for print |
| `css/styles.css` | Full design system — CSS custom properties, dark mode via `data-theme="dark"`, responsive, print stylesheet |
| `js/data.js` | Pure data — 10 diagnostic scenarios + 7 error-pattern workflow definitions |
| `js/app.js` | All application logic — state, event handlers, API calls, export |

### State

Single global `state` object in `app.js`:

```js
const state = {
  activeChecks: new Set(),   // checks currently running
  checkResults: {},          // type → {scenario, critical, hasIssue}
  selectedError: null,       // active error pattern
  darkMode: false,
  settings: { ppdmHost, ppdmPort, esHost, esPort, esUser, anthropicKey }
};
```

Settings are in-memory only — no localStorage persistence.

### Key Functions

| Function | What it does |
|---|---|
| `runCheck(type)` | Simulates a single diagnostic check with random delays and outcomes |
| `runFullDiagnostics()` | Runs all 10 checks in sequence with 200 ms stagger |
| `selectErrorPattern(pattern)` | Loads an error workflow into the 3-step guided panel |
| `buildResultHTML(scenario, critical, hasIssue)` | Renders check result card with copy-pasteable CLI commands |
| `refreshMetrics()` | Updates the 4 health-overview metric cards |
| `exportReport()` | Generates and downloads a JSON snapshot of all check results |
| `redactPII(text)` | Synchronous regex — strips IPs, emails, credential patterns |
| `callClaudeAPI(prompt, apiKey)` | Calls `claude-haiku-4-5-20251001` via Anthropic REST API |
| `runAiDiagnose()` | Orchestrates redaction → Claude call → renders output |

## Dark Mode

Toggled by `data-theme` attribute on `<html>`. CSS custom properties switch automatically — no JS class manipulation needed. The `data-theme` attribute starts absent (light) and is set to `"dark"` by `toggleDarkMode()`.

Playwright tests check `document.documentElement.getAttribute('data-theme')` — not a class.

## AI Diagnose

- Requires Anthropic API key entered in ⚙️ Settings (`cfgAnthropicKey`)
- Key lives in `state.settings.anthropicKey` (in-memory, never persisted)
- Uses `anthropic-dangerous-direct-browser-access: true` header — required for browser-to-Anthropic direct calls
- PII redacted synchronously before any network call
- Model: `claude-haiku-4-5-20251001`, `max_tokens: 1024`

## Key Constraints

- **No external dependencies at runtime** — the `No Dependencies` badge is load-bearing. Do not add CDN imports, npm packages that get bundled, or fetch calls to third-party services (except Anthropic for AI Diagnose, which is opt-in).
- Diagnostic checks are **simulated** — they do not make real network calls to PPDM or ES. The scenarios in `data.js` define plausible outcomes; `runCheck()` randomises the result.
- `copyToClipboard()` has a `navigator.clipboard` path and a `document.execCommand` fallback for older browsers.
- Print stylesheet is in `css/styles.css` — keeps AI output, log viewer, and settings panel hidden in print.

## Tests

Playwright suite in `tests/dashboard.spec.js` — covers:
- Page load + zero console errors
- 4 health-overview metric cards render
- Settings panel open/close
- Dark mode toggle (checks `data-theme` attribute)
- Diagnostic cards render
- Export + print buttons exist

CI runs Chromium, Firefox, WebKit on every push — see `.github/workflows/playwright.yml`.

## Files

```
index.html                        # App shell
css/styles.css                    # Design system + print + dark mode
js/data.js                        # Diagnostic scenarios + error patterns
js/app.js                         # All application logic
tests/dashboard.spec.js           # Playwright smoke tests
playwright.config.js              # Test config (http-server on port 8080)
.github/workflows/playwright.yml  # CI matrix
docs/screenshot.png               # README screenshot
```
