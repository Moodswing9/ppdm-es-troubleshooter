<div align="center">

# 🔍 PPDM Elasticsearch Troubleshooter

**Interactive diagnostic dashboard for PowerProtect Data Manager Elasticsearch access errors**

[![Version](https://img.shields.io/badge/version-1.0.0-6366f1?style=flat-square)](https://github.com/Moodswing9/ppdm-es-troubleshooter/releases)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-ef4444?style=flat-square)](#license)
[![Status](https://img.shields.io/badge/status-stable-22c55e?style=flat-square)](#)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-f59e0b?style=flat-square)](#)
[![Open in Browser](https://img.shields.io/badge/open-in%20browser-0ea5e9?style=flat-square)](#getting-started)

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
| ⚙️ Settings Panel | Configure PPDM host, ES host / port, and credentials |
| 📥 JSON Export | Download a full diagnostic snapshot as `.json` |
| 🖨️ Print / PDF | Dedicated print stylesheet for clean report output |

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
└── js/
    ├── data.js             # Diagnostic scenarios and error pattern definitions
    └── app.js              # Application logic, state management, and export
```

---

## License

Copyright (c) 2026 Timur Poyraz. All rights reserved.

No part of this software may be reproduced, distributed, or modified in any form or by any means without express written permission from the copyright holder.

---

<div align="center">

Built by [Moodswing9](https://github.com/Moodswing9) · [Portfolio](https://moodswing9.github.io)

</div>
