---
name: ppdm-es-troubleshooter
description: PPDM Elasticsearch diagnostics — 10 check modules, 7 guided error-pattern workflows, structured AI Diagnose via tool-calling. Browser-only, zero dependencies. Also available as /es-diagnose terminal command.
---

# PPDM ES Troubleshooter

Zero-install browser diagnostic tool for PowerProtect Data Manager Elasticsearch errors. Open `index.html` — no build step, no backend, no npm required. Diagnostic checks are **simulated**; only the live `/_cluster/health` fetch is real. AI Diagnose calls Claude Haiku 4.5 directly from the browser via tool-calling.

## Trigger

Activate this skill when the user asks about:
- PPDM Elasticsearch errors, cluster health, index problems
- `/es-diagnose` terminal command or the browser AI Diagnose panel
- Any of the 10 diagnostic modules or 7 error-pattern workflows
- Extending the dashboard (adding scenarios, error patterns, changing the AI schema)
- How `data.js`, `app.js`, or `index.html` are structured

---

## Architecture

Three source files, no framework, no bundler:

| File | Role |
|---|---|
| `index.html` | App shell, all markup, inline print stylesheet |
| `css/styles.css` | Full design system — CSS custom properties, dark mode via `data-theme="dark"` on `<html>`, responsive, print |
| `js/data.js` | Pure data — 10 diagnostic scenarios + 7 error-pattern workflow definitions |
| `js/app.js` | All logic — state, event handlers, API calls, AI Diagnose, export |

**No external JS or CSS.** The only external network call (besides `/_cluster/health`) is Anthropic for AI Diagnose, which is opt-in.

**Important:** All 10 diagnostic check modules are **simulated** — `runCheck(type)` randomises results from the scenario definition in `data.js`. They do not make real network calls to PPDM or Elasticsearch.

---

## Global State Object

```js
const state = {
  activeChecks: new Set(),         // checks currently running
  checkResults: {},                // type → { scenario, critical, hasIssue }
  selectedError: null,             // active error pattern for guided workflow
  darkMode: false,
  settings: {
    ppdmHost, ppdmPort,
    esHost, esPort, esUser,
    anthropicKey                   // in-memory only, never persisted
  }
};
```

**localStorage persistence:** `ppdmHost`, `ppdmPort`, `esHost`, `esPort`, `esUser` saved across reloads.
`anthropicKey` and `esPassword` are intentionally **never** written to storage.

---

## 10 Diagnostic Modules

| Module Key | What It Simulates Checking |
|---|---|
| `connectivity` | DNS resolution, TCP ports 9200/9300, HTTP response time |
| `service` | ES process, JVM state, thread pools, circuit breakers |
| `authentication` | Certificate validity, cert chain, basic auth, role permissions |
| `memory` | Heap usage, GC rate, fielddata cache, segment memory |
| `disk` | Storage capacity, watermark thresholds, snapshot repo access |
| `shards` | Unassigned, relocating, initializing shard counts |
| `indices` | Red/Yellow index status per index |
| `corruption` | Segment checksums, translog integrity, Lucene version |
| `ppdm-config` | PPDM endpoint, index prefix, batch size, retry policy |
| `ppdm-logs` | Error rate, index throughput, query failure rate |

Each scenario in `data.js` has: `type`, `title`, `description`, up to 4 `checks[]` (each with `name`, `command`, `expected`), and `remediation[]` steps with copy-pasteable CLI commands.

---

## 7 Error-Pattern Workflows

| Severity | Pattern | Key Diagnostic Path |
|---|---|---|
| 🔴 High | Connection Refused / Unreachable | Port check → service status → firewall |
| 🔴 High | Authentication Failed | Cert validity → basic auth test → RBAC roles |
| 🔴 Critical | Out of Memory / Circuit Breaker | Heap → fielddata → GC → JVM tuning |
| 🔴 Critical | Disk Full / Watermark Breached | Disk usage → watermark settings → old index cleanup |
| 🔴 Critical | Red Cluster Status | Unassigned shards → node discovery → reroute |
| 🟡 Medium | Query Timeout | Slow log → thread pools → circuit breakers |
| 🟡 Medium | Search Query Failed | Query syntax → index mapping → PPDM config |

Each workflow has `severity`, `title`, `description`, and `steps[]` — each step has `title`, `description`, and `command` (copy-pasteable).

---

## AI Diagnose

Calls `claude-haiku-4-5-20251001` via the Anthropic REST API directly from the browser.
Required header: `anthropic-dangerous-direct-browser-access: true`

### Tool Schema — ppdm_es_diagnosis

Tool-calling forces this exact output shape:

```json
{
  "root_cause": "string — concise root cause description",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "affected_component": "string — e.g. JVM Heap, Shard Allocation, PPDM Config",
  "actions": ["step 1 with exact CLI command", "step 2", "..."],
  "prevention": "string — long-term remediation or monitoring suggestion"
}
```

### PII Redaction (synchronous, before API call)

Strips before any text leaves the browser:
- Bearer/Basic auth headers
- `password=…` and `"password": "…"` style credential fields
- Email addresses (`user@domain`)
- IPv4 octets 3+4 → `[REDACTED]`

### Output Rendering

Cards rendered via `innerHTML`:
- Severity badge (red=CRITICAL, orange=HIGH, yellow=MEDIUM, green=LOW)
- Root cause card
- Numbered action blocks — click-to-copy CLI commands
- Prevention panel

---

## Key Functions (for developers)

| Function | Purpose |
|---|---|
| `runCheck(type)` | Simulate one diagnostic — random delay + outcome from scenario |
| `runFullDiagnostics()` | All 10 checks with 200ms stagger |
| `selectErrorPattern(pattern)` | Load an error workflow into the 3-step guided panel |
| `buildResultHTML(scenario, critical, hasIssue)` | Render check result card with copy-pasteable commands |
| `refreshMetrics()` | Fetch `GET /_cluster/health` live, update 4 health metric cards |
| `exportReport()` | Generate + download JSON snapshot of all check results |
| `redactPII(text)` | Synchronous regex redaction before any API call |
| `callClaudeAPI(prompt, apiKey)` | Tool-calling request to Haiku 4.5, returns `toolUse.input` object |
| `_severityColor(sev)` | Returns CSS color string for severity badge |
| `_renderDiagnosisCards(d)` | Renders structured diagnosis as cards into `#aiOutputBody` |
| `runAiDiagnose()` | Orchestrates: redaction → API call → `_renderDiagnosisCards` |

---

## Dark Mode

`toggleDarkMode()` sets `data-theme="dark"` on `<html>`. CSS custom properties switch automatically — no class manipulation. Playwright tests verify via `document.documentElement.getAttribute('data-theme')`.

---

## Few-Shot Examples

**Q: How do I add a new diagnostic module?**
A: Add an entry to `diagnosticScenarios` in `js/data.js` with `type`, `title`, `description`, `checks[]`, and `remediation[]`. Add the trigger button to `index.html` wired to `runCheck('your-type')`. No other changes needed.

**Q: The AI Diagnose output is showing as plain text instead of cards.**
A: `runAiDiagnose` must call `_renderDiagnosisCards(result)` and set `aiOutputBody.innerHTML` (not `textContent`). Also confirm `white-space: pre-wrap` is NOT on `#aiOutputBody` — that overrides card layout with plain text rendering.

**Q: How do I change the severity colours in the AI output cards?**
A: Edit `_severityColor(sev)` in `app.js`. It returns a CSS color string keyed to `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW` from the tool schema.

**Q: Does the live ES check hit the real cluster?**
A: Yes — `refreshMetrics()` fetches `GET http://<esHost>:<esPort>/_cluster/health`. All 10 diagnostic module runs are simulated. The only real outbound calls are `/_cluster/health` and the Anthropic API for AI Diagnose.

**Q: How do I use /es-diagnose from the terminal?**
A: Run `/es-diagnose "your error text"` or `/es-diagnose /path/to/es-error.log`. Uses the same `ppdm_es_diagnosis` tool schema and outputs severity icon + ASCII border + numbered remediation commands. Requires `ANTHROPIC_API_KEY` and `pip install anthropic`.
