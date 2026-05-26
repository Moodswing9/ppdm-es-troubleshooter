<div align="center">

# 🔍 PPDM Elasticsearch Troubleshooter

**Interactive diagnostic dashboard for PowerProtect Data Manager Elasticsearch access errors**

[![Version](https://img.shields.io/badge/version-1.3.0-6366f1?style=flat-square)](https://github.com/Moodswing9/ppdm-es-troubleshooter/releases)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Moodswing9/ppdm-es-troubleshooter/playwright.yml?branch=master&style=flat-square&label=CI)](https://github.com/Moodswing9/ppdm-es-troubleshooter/actions/workflows/playwright.yml)
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
| ⚡ Live ES Check | Fetches `/_cluster/health` directly from your ES instance — updates the health metrics cards in real time |
| 🤖 AI Diagnose | One-click AI analysis powered by **Claude Haiku 4.5** — structured JSON output rendered as styled cards: severity badge, affected component, click-to-copy remediation commands, and prevention guidance (requires Anthropic API key) |

---

## 🤖 AI Diagnose (Claude Haiku 4.5)

Paste any PPDM or Elasticsearch log excerpt, error message, or symptom description into the **AI Diagnose** panel and get a structured analysis back — root cause, severity, affected component, exact remediation commands, and prevention guidance.

### Pipeline

| Step | Purpose |
|:--|:--|
| 1. **Regex PII redaction** | Strip IPs, emails, and `password=…` style tokens before anything leaves the browser |
| 2. **Structured diagnosis** | `claude-haiku-4-5-20251001` is forced via tool-calling to return a JSON object: `root_cause`, `severity`, `affected_component`, `actions[]`, `prevention` |
| 3. **Styled card rendering** | Output rendered as cards — severity badge (color-coded), affected component label, copy-pasteable action code blocks, prevention panel |

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

## Claude Code Plugin

Install as a Claude Code plugin to get `/es-diagnose` directly in your terminal:

```bash
npx skills add Moodswing9/ppdm-es-troubleshooter -g
```

This registers the skill and command globally so you can run `/es-diagnose` from any Claude Code session.

| Command | What it does |
|:---|:---|
| `/es-diagnose "connection refused to elasticsearch:9200"` | Diagnose inline error text |
| `/es-diagnose /var/log/ppdm/es-error.log` | Analyse a log file |
| `/es-diagnose es-error.log es-slow.log` | Concatenate multiple log files for combined diagnosis |

The skill auto-activates in Claude Code when you ask about PPDM Elasticsearch errors, shard allocation, circuit breakers, disk watermarks, or the diagnostic dashboard's architecture — no command needed. Requires `ANTHROPIC_API_KEY` and `pip install anthropic`.

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

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by [Moodswing9](https://github.com/Moodswing9) · [Portfolio](https://moodswing9.github.io)

</div>
