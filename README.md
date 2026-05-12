<div align="center">

# 🔍 PPDM Elasticsearch Troubleshooter

**Interactive diagnostic dashboard for PowerProtect Data Manager Elasticsearch access errors**

[![Version](https://img.shields.io/badge/version-1.2.0-6366f1?style=flat-square)](https://github.com/Moodswing9/ppdm-es-troubleshooter/releases)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-ef4444?style=flat-square)](#license)
[![Status](https://img.shields.io/badge/status-stable-22c55e?style=flat-square)](#)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-f59e0b?style=flat-square)](#)
[![Open in Browser](https://img.shields.io/badge/open-in%20browser-0ea5e9?style=flat-square)](#getting-started)
[![Claude Haiku](https://img.shields.io/badge/AI-Claude%20Haiku%204.5-f59e0b?style=flat-square)](#-ai-diagnose-claude-haiku-45)

</div>

---

<div align="center">

![PPDM Elasticsearch Troubleshooter dashboard](docs/screenshot.png)

</div>

---

## Overview

A fully self-contained, browser-based diagnostic tool built for engineers and administrators working with **Dell PowerProtect Data Manager (PPDM)** and its embedded Elasticsearch service. No installation, no backend, no build step — open `index.html` and start diagnosing.

---

## Features

### 🧩 10 Diagnostic Check Modules

| Module | Checks Performed |
|:---|:---|
| 🌐 Network Connectivity | DNS resolution · TCP ports 9200 / 9300 · HTTP response time |
| ⚙️ Service Status | ES process · JVM state · thread pools · circuit breakers |
| 🔐 Authentication | Certificate validity · cert chain · basic auth · role permissions |
| 🧠 Memory Pressure | Heap usage · GC rate · fielddata cache · segment memory |
| 💾 Disk Usage | Storage capacity · watermark thresholds · snapshot repo access |
| 🧩 Shard Distribution | Unassigned · relocating · initializing shard counts |
| 📁 Index Health | Red / Yellow index status resolution per index |
| 🔍 Corruption Detection | Segment checksums · translog integrity · Lucene version |
| ⚙️ Search Service Config | PPDM endpoint · index prefix · batch size · retry policy |
| 📋 PPDM Log Analysis | Error rate · index throughput · query failure rate |

### 🛠️ 7 Guided Error-Pattern Workflows

Each workflow delivers **severity-rated**, step-by-step remediation with one-click copy commands:

| Severity | Error Pattern |
|:---:|:---|
| 🔴 High | Connection Refused / Unreachable |
| 🔴 High | Authentication Failed |
| 🔴 Critical | Out of Memory / Circuit Breaker Tripped |
| 🔴 Critical | Disk Full / Watermark Breached |
| 🔴 Critical | Red Cluster Status |
| 🟡 Medium | Query Timeout |
| 🟡 Medium | Search Query Failed |

### ✨ Additional Capabilities

| Capability | Description |
|:---|:---|
| 🌙 Dark Mode | Full light / dark theme toggle |
| 📜 Live Log Stream | Timestamped real-time diagnostic activity viewer |
| ⚙️ Settings Panel | Configure PPDM host, ES host / port, and credentials — **connection settings persist across page reloads** via `localStorage` |
| 📥 JSON Export | Download a full diagnostic snapshot as `.json` |
| 🖨️ Print / PDF | Dedicated print stylesheet for clean report output |
| 🤖 AI Diagnose | One-click AI analysis powered by **Claude Haiku 4.5** — paste your error, get a root cause summary and remediation steps (requires Anthropic API key, set in ⚙️ Settings) |

---

## 🤖 AI Diagnose (Claude Haiku 4.5)

Paste any PPDM or Elasticsearch log excerpt, error message, or symptom description into the **AI Diagnose** panel and get a structured analysis back — root cause, severity, affected component, exact remediation commands, and prevention guidance.

### Pipeline

| Step | Purpose |
|:--|:--|
| 1. **Regex PII redaction** | Strip IPs, emails, and `password=…` style tokens before anything leaves the browser |
| 2. **Diagnosis** | `claude-haiku-4-5-20251001` returns root cause · severity · affected component · numbered remediation steps · prevention notes |

### Privacy

- Raw log text **never leaves the browser unredacted** — regex redaction runs synchronously before the API call
- The dashboard is fully client-side. No backend, no telemetry, no server logs
- Your Anthropic API key is held **in memory only** and is never written to `localStorage` or any storage
- Connection settings (host, port, ES username) are saved to `localStorage` for convenience; passwords and API keys are intentionally excluded

### Usage

1. Click ⚙️ → paste your `sk-ant-…` key into the **Anthropic API Key** field → Save
2. Open the AI Diagnose panel (▼ Expand)
3. Paste your log excerpt
4. Click **Analyse** — typical round-trip is 2–4 seconds

The diagnosis output includes copy-pasteable PPDM/ES CLI commands (`mminfo`, `nsradmin`, `curl` against the ES REST API, etc.) so you can act immediately.

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/Moodswing9/ppdm-es-troubleshooter.git

# 2. Open in your browser — no build step needed
open ppdm-es-troubleshooter/index.html
```

> **Optional:** Click ⚙️ in the header to enter your PPDM and Elasticsearch connection details before running diagnostics.

---

## Project Structure

```
ppdm-es-troubleshooter/
├── index.html              # Application shell and UI markup
├── css/
│   └── styles.css          # Design system — dark mode, print, responsive layout
├── js/
│   ├── data.js             # Diagnostic scenarios and error pattern definitions
│   └── app.js              # Application logic, state management, and export
├── tests/
│   └── dashboard.spec.js   # Playwright smoke tests (Chromium · Firefox · WebKit)
├── playwright.config.js    # Test runner config — runs against local http-server
└── .github/workflows/
    └── playwright.yml      # CI — runs full test matrix on every PR
```

---

## Tests

The dashboard ships with a Playwright smoke-test suite covering page load, the four health-overview metric cards, settings panel, dark mode toggle, diagnostic card rendering, export/print buttons, and zero-console-errors. Tests run on Chromium, Firefox, and WebKit.

```bash
# One-time setup
npm install
npx playwright install

# Run tests headless
npm test

# Watch tests run in a real browser
npm run test:headed

# Step through with the inspector
npm run test:debug

# Open the last HTML report
npm run test:report
```

CI runs the full matrix on every push and PR — see `.github/workflows/playwright.yml`. HTML reports are uploaded as artifacts on every run.

---

## License

Copyright (c) 2026 Timur Poyraz. All rights reserved.

No part of this software may be reproduced, distributed, or modified in any form or by any means without express written permission from the copyright holder.

---

<div align="center">

Built by [Moodswing9](https://github.com/Moodswing9) · [Portfolio](https://moodswing9.github.io)

</div>
